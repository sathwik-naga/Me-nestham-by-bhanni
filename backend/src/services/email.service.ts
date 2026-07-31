import React from 'react';
import { render } from '@react-email/render';
import { EmailRepository } from '../repositories/email.repository';
import { ResendProvider } from '../providers/resend.provider';
import { EmailQueueService } from './emailQueue.service';
import logger from '../utils/logger';

// Templates
import { WelcomeEmail } from '../emails/WelcomeEmail';
import { OrderConfirmationEmail } from '../emails/OrderConfirmationEmail';
import { PaymentConfirmationEmail } from '../emails/PaymentConfirmationEmail';
import { OrderPackedEmail } from '../emails/OrderPackedEmail';
import { OrderShippedEmail } from '../emails/OrderShippedEmail';
import { OutForDeliveryEmail } from '../emails/OutForDeliveryEmail';
import { DeliveredEmail } from '../emails/DeliveredEmail';
import { OrderCancelledEmail } from '../emails/OrderCancelledEmail';
import { PasswordResetEmail } from '../emails/PasswordResetEmail';
import { LowStockAlertEmail } from '../emails/LowStockAlertEmail';
import { NewOrderAdminEmail } from '../emails/NewOrderAdminEmail';
import { AdminPaymentFailedEmail } from '../emails/AdminPaymentFailedEmail';
import { CustomerContactConfirmationEmail } from '../emails/CustomerContactConfirmationEmail';
import { ContactAdminAlertEmail } from '../emails/ContactAdminAlertEmail';

export class EmailService {
  private queueService: EmailQueueService;

  constructor(
    private repository: EmailRepository = new EmailRepository(),
    private provider: ResendProvider = new ResendProvider()
  ) {
    this.queueService = new EmailQueueService(this.provider, this.repository);
  }

  /**
   * Universal internal helper to log, compile, check idempotency, and enqueue emails
   */
  private async enqueueEmail(
    to: string,
    subject: string,
    templateName: string,
    element: React.ReactElement,
    metadata: Record<string, any> = {},
    idempotencyKey?: string
  ): Promise<void> {
    try {
      const emailEnabled = process.env.EMAIL_ENABLED !== 'false';

      // 1. Idempotency Check
      if (idempotencyKey) {
        const alreadySent = await this.repository.checkIdempotency(idempotencyKey);
        if (alreadySent) {
          logger.info(`Suppressed duplicate email trigger for idempotency key: ${idempotencyKey}`);
          return;
        }
      }

      // 2. Rate Limiting / Duplicate check
      const isDuplicate = await this.repository.checkDuplicate(
        to,
        templateName,
        metadata.orderId
      );

      if (isDuplicate) {
        logger.warn(`Deduplication rate limit triggered. Suppressing email duplicate for ${to} (Template: ${templateName})`);
        return;
      }

      // 3. Render template to HTML
      const html = await render(element);

      // 4. Create log record in database
      const logRecord = await this.repository.createLog({
        recipient: to,
        subject,
        template: templateName,
        idempotency_key: idempotencyKey || null,
        status: emailEnabled ? 'queued' : 'cancelled',
        provider: 'resend',
        attempts: 0,
        metadata,
        html_body: html,
        is_retryable: true,
      });

      if (!emailEnabled) {
        logger.info(`EMAIL_ENABLED=false: Logged email to DB (Log ID: ${logRecord.id}), dispatch skipped.`);
        return;
      }

      // 5. Enqueue for async non-blocking background dispatch
      await this.queueService.addJob({
        logId: logRecord.id,
        recipient: to,
        subject,
        html,
        template: templateName,
        idempotencyKey: idempotencyKey || undefined,
        orderId: metadata.orderId,
      });
    } catch (err) {
      logger.error(`Error in EmailService.enqueueEmail for ${to} (${templateName}): ${err}`);
    }
  }

  /**
   * Manually retry delivery of a logged email entry
   */
  async retryLoggedEmail(logId: string): Promise<void> {
    const log = await this.repository.getById(logId);
    if (!log) {
      throw new Error(`Email log with ID ${logId} not found`);
    }

    if (!log.html_body) {
      throw new Error(`Email log ${logId} lacks pre-rendered HTML body for retry`);
    }

    await this.repository.updateStatus(logId, { status: 'queued' });
    await this.queueService.addJob({
      logId: log.id,
      recipient: log.recipient,
      subject: log.subject,
      html: log.html_body,
      template: log.template,
      orderId: log.metadata?.orderId,
    });
  }

  // --- Customer Email Triggers ---

  async sendOrderConfirmationEmail(to: string, customerName: string, order: any) {
    const idempotencyKey = `order_confirmation:${order.id}`;
    await this.enqueueEmail(
      to,
      `Order Confirmation - #${String(order.id).substring(0, 8)}`,
      'OrderConfirmationEmail',
      React.createElement(OrderConfirmationEmail, {
        orderId: String(order.id),
        customerName,
        items: order.items || [],
        totalAmount: order.grand_total || order.total || 0,
      }),
      { orderId: order.id },
      idempotencyKey
    );
  }

  async sendPaymentConfirmationEmail(to: string, customerName: string, orderId: string, transactionId: string, amountPaid: number, paymentMethod: string) {
    const idempotencyKey = `payment_confirmation:${orderId}:${transactionId}`;
    await this.enqueueEmail(
      to,
      `Payment Receipt - #${String(orderId).substring(0, 8)}`,
      'PaymentConfirmationEmail',
      React.createElement(PaymentConfirmationEmail, {
        orderId: String(orderId),
        customerName,
        transactionId,
        amountPaid,
        paymentMethod,
      }),
      { orderId, transactionId },
      idempotencyKey
    );
  }

  async sendOrderPackedEmail(to: string, customerName: string, orderId: string) {
    const idempotencyKey = `order_packed:${orderId}`;
    await this.enqueueEmail(
      to,
      `Your Order #${String(orderId).substring(0, 8)} is Packed!`,
      'OrderPackedEmail',
      React.createElement(OrderPackedEmail, {
        orderId: String(orderId),
        customerName,
      }),
      { orderId },
      idempotencyKey
    );
  }

  async sendOrderShippedEmail(to: string | any, customerName?: string, orderId?: any, trackingNumber?: string, courierName?: string) {
    let emailStr = '';
    let nameStr = '';
    let idStr = '';

    if (typeof to === 'object' && to !== null) {
      const order = to;
      emailStr = order.shipping_address?.email || '';
      nameStr = order.shipping_address?.full_name || 'Customer';
      idStr = String(order.id);
    } else {
      emailStr = String(to || '');
      nameStr = customerName || 'Customer';
      idStr = String(orderId || '');
    }

    const idempotencyKey = `order_shipped:${idStr}:${trackingNumber || 'default'}`;
    const baseTrackingUrl = process.env.ORDER_TRACKING_BASE_URL || 'https://www.menesthambybhanni.com/orders';
    const trackingUrl = `${baseTrackingUrl}/${idStr}/track`;

    await this.enqueueEmail(
      emailStr,
      `Your Order #${idStr.substring(0, 8)} has been Shipped!`,
      'OrderShippedEmail',
      React.createElement(OrderShippedEmail, {
        orderId: idStr,
        customerName: nameStr,
        trackingNumber: trackingNumber || 'TRK' + idStr.substring(0, 8).toUpperCase(),
        courierName: courierName || 'Express Logistics India',
        trackingUrl,
      }),
      { orderId: idStr, trackingNumber, courierName },
      idempotencyKey
    );
  }

  async sendOutForDeliveryEmail(to: string | any, customerName?: string, orderId?: any) {
    let emailStr = '';
    let nameStr = '';
    let idStr = '';

    if (typeof to === 'object' && to !== null) {
      const order = to;
      emailStr = order.shipping_address?.email || '';
      nameStr = order.shipping_address?.full_name || 'Customer';
      idStr = String(order.id);
    } else {
      emailStr = String(to || '');
      nameStr = customerName || 'Customer';
      idStr = String(orderId || '');
    }

    const idempotencyKey = `out_for_delivery:${idStr}`;
    await this.enqueueEmail(
      emailStr,
      `Out for Delivery - Order #${idStr.substring(0, 8)}`,
      'OutForDeliveryEmail',
      React.createElement(OutForDeliveryEmail, {
        orderId: idStr,
        customerName: nameStr,
        courierName: 'Express Logistics',
        trackingNumber: 'TRK' + idStr.substring(0, 8).toUpperCase(),
      }),
      { orderId: idStr },
      idempotencyKey
    );
  }

  async sendDeliveredEmail(to: string | any, customerName?: string, orderId?: any) {
    let emailStr = '';
    let nameStr = '';
    let idStr = '';

    if (typeof to === 'object' && to !== null) {
      const order = to;
      emailStr = order.shipping_address?.email || '';
      nameStr = order.shipping_address?.full_name || 'Customer';
      idStr = String(order.id);
    } else {
      emailStr = String(to || '');
      nameStr = customerName || 'Customer';
      idStr = String(orderId || '');
    }

    const idempotencyKey = `order_delivered:${idStr}`;
    await this.enqueueEmail(
      emailStr,
      `Order #${idStr.substring(0, 8)} Delivered!`,
      'DeliveredEmail',
      React.createElement(DeliveredEmail, {
        orderId: idStr,
        customerName: nameStr,
      }),
      { orderId: idStr },
      idempotencyKey
    );
  }

  async sendOrderCancelledEmail(to: string, customerName: string, orderId: string, reason?: string) {
    const idempotencyKey = `order_cancelled:${orderId}`;
    await this.enqueueEmail(
      to,
      `Order #${String(orderId).substring(0, 8)} Cancelled`,
      'OrderCancelledEmail',
      React.createElement(OrderCancelledEmail, {
        orderId: String(orderId),
        customerName,
        reason,
      }),
      { orderId, reason },
      idempotencyKey
    );
  }

  async sendWelcomeEmail(to: string, name: string) {
    const idempotencyKey = `welcome:${to}`;
    await this.enqueueEmail(
      to,
      'Welcome to Me Nestham by Bhanni!',
      'WelcomeEmail',
      React.createElement(WelcomeEmail, { fullName: name }),
      {},
      idempotencyKey
    );
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const appUrl = process.env.APP_URL || 'https://www.menesthambybhanni.com';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    await this.enqueueEmail(
      to,
      'Reset Your Password - Me Nestham by Bhanni',
      'PasswordResetEmail',
      React.createElement(PasswordResetEmail, { resetLink: resetUrl })
    );
  }

  // --- Shipping Service Compatibility Aliases ---

  async sendShipmentCreatedEmail(order: any) {
    await this.sendOrderShippedEmail(order);
  }

  async sendPickupScheduledEmail(order: any) {
    await this.sendOrderPackedEmail(order.shipping_address?.email || '', order.shipping_address?.full_name || 'Customer', order.id);
  }

  async sendAdminShipmentCancelledEmail(order: any) {
    const adminEmail = process.env.CONTACT_NOTIFICATION_EMAIL || 'funnycolours123@gmail.com';
    await this.enqueueEmail(
      adminEmail,
      `[ADMIN ALERT] Shipment Cancelled for Order #${String(order.id).substring(0, 8)}`,
      'AdminShipmentCancelledEmail',
      React.createElement(OrderCancelledEmail, {
        orderId: String(order.id),
        customerName: order.shipping_address?.full_name || 'Customer',
        reason: 'Shipment booking cancelled via carrier API',
      }),
      { orderId: order.id }
    );
  }

  // --- Admin Notification Triggers ---

  async sendAdminNewOrderEmail(order: any) {
    const adminEmail = process.env.CONTACT_NOTIFICATION_EMAIL || 'funnycolours123@gmail.com';
    const idempotencyKey = `admin_new_order:${order.id}`;

    await this.enqueueEmail(
      adminEmail,
      `[ADMIN ALERT] New Order Received #${String(order.id).substring(0, 8)}`,
      'AdminNewOrderEmail',
      React.createElement(NewOrderAdminEmail, {
        orderId: String(order.id),
        grandTotal: order.grand_total || order.total || 0,
        customerName: order.shipping_address?.full_name || 'Customer',
        totalItems: order.items?.length || 0,
      }),
      { orderId: order.id },
      idempotencyKey
    );
  }

  async sendAdminPaymentFailedEmail(orderId: string, customerName: string, customerEmail: string, amount: number, errorMessage?: string) {
    const adminEmail = process.env.CONTACT_NOTIFICATION_EMAIL || 'funnycolours123@gmail.com';
    const idempotencyKey = `admin_payment_failed:${orderId}:${Date.now()}`;

    await this.enqueueEmail(
      adminEmail,
      `[ADMIN ALERT] Payment Failed for Order #${String(orderId).substring(0, 8)}`,
      'AdminPaymentFailedEmail',
      React.createElement(AdminPaymentFailedEmail, {
        orderId: String(orderId),
        customerName,
        customerEmail,
        amount,
        errorMessage,
      }),
      { orderId, amount, errorMessage },
      idempotencyKey
    );
  }

  async sendAdminLowStockEmail(productName: string, productSlug: string, remainingStock: number) {
    const adminEmail = process.env.CONTACT_NOTIFICATION_EMAIL || 'funnycolours123@gmail.com';
    const idempotencyKey = `admin_low_stock:${productSlug}:${remainingStock}`;

    await this.enqueueEmail(
      adminEmail,
      `[ADMIN ALERT] Low Stock Alert: ${productName}`,
      'LowStockAlertEmail',
      React.createElement(LowStockAlertEmail, {
        productName,
        productSlug,
        currentStock: remainingStock,
      }),
      { productSlug, remainingStock },
      idempotencyKey
    );
  }

  async sendCustomerContactConfirmation(name: string, email: string, subject: string, message: string) {
    const idempotencyKey = `contact_receipt:${email}:${Date.now()}`;
    await this.enqueueEmail(
      email,
      'We received your message - Me Nestham by Bhanni',
      'CustomerContactConfirmationEmail',
      React.createElement(CustomerContactConfirmationEmail, { customerName: name }),
      { subject },
      idempotencyKey
    );
  }

  async sendContactAdminNotification(contactData: { name: string; email: string; phone: string; subject: string; message: string }) {
    const adminEmail = process.env.CONTACT_NOTIFICATION_EMAIL || 'funnycolours123@gmail.com';
    const idempotencyKey = `contact_admin_alert:${contactData.email}:${Date.now()}`;

    await this.enqueueEmail(
      adminEmail,
      `[New Contact Form] ${contactData.subject} from ${contactData.name}`,
      'ContactAdminAlertEmail',
      React.createElement(ContactAdminAlertEmail, contactData),
      contactData,
      idempotencyKey
    );
  }
}
