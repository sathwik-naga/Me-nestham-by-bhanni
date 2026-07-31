import logger from '../utils/logger';
import { AppError } from '../middleware/error';
import { ShippingRepository } from '../repositories/shipping.repository';
import { OrderRepository } from '../repositories/order.repository';
import { Order } from '../interfaces/order.interface';
import { supabaseAdmin } from '../lib/supabase';
import { EmailService } from './email.service';
import { EmailRepository } from '../repositories/email.repository';
import { ResendProvider } from '../providers/resend.provider';

const emailService = new EmailService(new EmailRepository(), new ResendProvider());

// Declare module-level token cache
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // Epoch timestamp

export class ShippingService {
  constructor(
    private shippingRepository: ShippingRepository,
    private orderRepository: OrderRepository
  ) {}

  /**
   * Log in to Shiprocket and cache token
   */
  private async loginShiprocket(): Promise<void> {
    logger.info('Authenticating with Shiprocket API...');
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    const apiBase = process.env.SHIPROCKET_API_BASE || 'https://apiv2.shiprocket.in';

    if (!email || !password) {
      logger.error('Shiprocket email or password configuration is missing');
      throw new AppError('Shipping service authentication is unconfigured', 500);
    }

    try {
      const response = await fetch(`${apiBase}/v1/external/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        logger.error(`Shiprocket login failed: ${JSON.stringify(errorData)}`);
        throw new AppError('Shiprocket authentication failed', response.status || 500);
      }

      const data = (await response.json()) as any;
      if (!data.token) {
        throw new AppError('Invalid response from Shiprocket authentication', 500);
      }

      cachedToken = data.token;
      // Shiprocket tokens are valid for 10 days (240 hours). We set cache validity.
      tokenExpiresAt = Date.now() + 9.5 * 24 * 3600 * 1000;
      logger.info('Shiprocket authentication successful, token cached.');
    } catch (err) {
      logger.error(`Error authenticating with Shiprocket: ${err}`);
      if (err instanceof AppError) throw err;
      throw new AppError('Failed to authenticate with Shiprocket', 500);
    }
  }

  /**
   * Retrieve active authentication token (renewing if expired or inside buffer window)
   */
  private async getAuthToken(): Promise<string> {
    const now = Date.now();
    const bufferSec = Number(process.env.SHIPROCKET_TOKEN_EXPIRY_BUFFER || '300');
    if (cachedToken && tokenExpiresAt > now + bufferSec * 1000) {
      return cachedToken;
    }
    await this.loginShiprocket();
    return cachedToken!;
  }

  /**
   * Universal Shiprocket request wrapper with automatic 401 retry
   */
  private async requestShiprocket(endpoint: string, options: any, isRetry = false): Promise<any> {
    const apiBase = process.env.SHIPROCKET_API_BASE || 'https://apiv2.shiprocket.in';
    const token = await this.getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401 && !isRetry) {
        logger.warn('Received 401 from Shiprocket. Refreshing token and retrying...');
        await this.loginShiprocket();
        return this.requestShiprocket(endpoint, options, true);
      }

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        logger.error(`Shiprocket request to ${endpoint} failed with status ${response.status}: ${JSON.stringify(errorData)}`);
        throw new AppError(
          errorData.message || `Shiprocket request failed: ${response.statusText}`,
          response.status || 400
        );
      }

      return await response.json();
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Network or unexpected error calling Shiprocket: ${err}`);
      throw new AppError('Logistics communication failure.', 500);
    }
  }

  /**
   * Automatically synchronize order state based on shipping/fulfillment updates
   */
  async syncOrderStatus(orderId: string, shippingStatus: string): Promise<void> {
    const statusLower = shippingStatus.toLowerCase();
    const orderStatusUpdates: { status?: any; payment_status?: any } = {};

    if (statusLower.includes('pickup scheduled') || statusLower.includes('pickup_scheduled')) {
      orderStatusUpdates.status = 'processing';
    } else if (
      statusLower.includes('in transit') ||
      statusLower.includes('in_transit') ||
      statusLower.includes('out for delivery') ||
      statusLower.includes('out_for_delivery')
    ) {
      orderStatusUpdates.status = 'shipped';
    } else if (statusLower.includes('delivered')) {
      orderStatusUpdates.status = 'delivered';
      orderStatusUpdates.payment_status = 'paid';
    } else if (statusLower.includes('cancelled')) {
      orderStatusUpdates.status = 'cancelled';
    }

    if (Object.keys(orderStatusUpdates).length > 0) {
      logger.info(`Syncing order status for order ${orderId} based on shipping status "${shippingStatus}": ${JSON.stringify(orderStatusUpdates)}`);
      await this.orderRepository.updateOrderStatus(orderId, orderStatusUpdates);
    }
  }

  /**
   * Create an adhoc shipment/order in Shiprocket
   */
  async createShipment(orderId: string): Promise<Order> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // 1. Validation checks
    const shippingAddress = order.shipping_address;
    if (!shippingAddress) {
      throw new AppError('Shipping address does not exist for this order.', 400);
    }

    const name = shippingAddress.full_name || '';
    const phone = shippingAddress.phone || '';
    const pinCode = shippingAddress.postal_code || '';

    if (!name.trim()) {
      throw new AppError('Customer name is missing from the shipping address.', 400);
    }
    if (!phone.trim()) {
      throw new AppError('Customer phone number is missing from the shipping address.', 400);
    }
    if (!pinCode.trim()) {
      throw new AppError('PIN code is missing from the shipping address.', 400);
    }

    if (!order.items || order.items.length === 0) {
      throw new AppError('Order contains no products.', 400);
    }

    const isPaid = order.payment_status === 'paid';
    const isCod = order.payment_method === 'COD';
    const isConfirmed = order.status === 'confirmed';
    if (!isPaid && !(isCod && isConfirmed)) {
      throw new AppError('Payment status must be Paid or COD confirmed to create shipment.', 400);
    }

    // Format date: YYYY-MM-DD HH:MM
    const dateObj = new Date(order.created_at);
    const orderDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

    // Split recipient name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '.';

    // Billing address defaults to shipping if absent
    const billingAddress = order.billing_address || shippingAddress;
    const bNameParts = (billingAddress.full_name || 'Customer').trim().split(' ');
    const bFirstName = bNameParts[0] || 'Customer';
    const bLastName = bNameParts.slice(1).join(' ') || '.';

    const shippingLine = `${shippingAddress.address_line1} ${shippingAddress.address_line2 || ''}`.trim();
    const billingLine = `${billingAddress.address_line1} ${billingAddress.address_line2 || ''}`.trim();

    const orderItems = order.items.map((item) => ({
      name: item.product_name,
      sku: item.product_slug,
      units: item.quantity,
      selling_price: item.unit_price,
      discount: 0,
      tax: 0,
    }));

    const payload = {
      order_id: order.id,
      order_date: orderDate,
      pickup_location: 'Primary',
      billing_customer_name: bFirstName,
      billing_last_name: bLastName,
      billing_address: billingLine,
      billing_city: billingAddress.city,
      billing_pincode: billingAddress.postal_code,
      billing_state: billingAddress.state,
      billing_country: billingAddress.country || 'India',
      billing_email: billingAddress.email || order.shipping_address?.email || 'customer@example.com',
      billing_phone: billingAddress.phone,
      shipping_is_billing: false,
      shipping_customer_name: firstName,
      shipping_last_name: lastName,
      shipping_address: shippingLine,
      shipping_city: shippingAddress.city,
      shipping_pincode: shippingAddress.postal_code,
      shipping_state: shippingAddress.state,
      shipping_country: shippingAddress.country || 'India',
      shipping_email: shippingAddress.email || 'customer@example.com',
      shipping_phone: shippingAddress.phone,
      order_items: orderItems,
      payment_method: order.payment_method === 'COD' ? 'COD' : 'Prepaid',
      sub_total: order.subtotal,
      length: 15,
      breadth: 15,
      height: 10,
      weight: 0.5,
    };

    try {
      const result = await this.requestShiprocket('/v1/external/orders/create/adhoc', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const shipmentId = String(result.shipment_id);
      const shiprocketOrderId = String(result.order_id);

      if (!shipmentId || !shiprocketOrderId) {
        throw new AppError('Shiprocket did not return valid shipment and order IDs', 500);
      }

      // Update local order table
      const initialEvents = [
        {
          status: 'Created',
          date: new Date().toISOString(),
          note: 'Shipment created on Shiprocket platform.'
        }
      ];

      const updatedOrder = await this.shippingRepository.updateShipment(orderId, {
        shipment_id: shipmentId,
        shiprocket_order_id: shiprocketOrderId,
        shipping_status: 'created',
        tracking_events: initialEvents,
      });

      // Trigger shipment email
      setImmediate(async () => {
        try {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(updatedOrder.user_id);
          const email = user?.email || updatedOrder.shipping_address?.email || '';
          const fullName = updatedOrder.shipping_address?.full_name || user?.user_metadata?.full_name || 'Customer';
          if (email) {
            await emailService.sendShipmentCreatedEmail(updatedOrder);
          }
        } catch (err) {
          logger.error(`Failed sending shipment created email: ${err}`);
        }
      });

      return updatedOrder;
    } catch (err) {
      logger.error(`Error in createShipment service: ${err}`);
      if (err instanceof AppError) throw err;
      throw new AppError('Unable to create shipment.', 500);
    }
  }

  /**
   * Assign AWB code to the shipment
   */
  async generateAwb(orderId: string): Promise<Order> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order || !order.shipment_id) {
      throw new AppError('Order or shipment ID not found. Create shipment first.', 400);
    }

    try {
      const result = await this.requestShiprocket('/v1/external/courier/assign/awb', {
        method: 'POST',
        body: JSON.stringify({
          shipment_id: Number(order.shipment_id),
        }),
      });

      const awbData = result.response?.data;
      if (!awbData || !awbData.awb_code) {
        throw new AppError(result.message || 'AWB generation failed - no AWB code returned', 400);
      }

      const awbCode = awbData.awb_code;
      const courierName = awbData.courier_name || 'Shiprocket Partner';
      const courierCompanyId = awbData.courier_company_id || null;
      const trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;

      const eventNote = `AWB code assigned. Courier partner assigned: ${courierName}.`;
      const currentEvents = Array.isArray(order.tracking_events) ? order.tracking_events : [];
      const updatedEvents = [
        ...currentEvents,
        {
          status: 'AWB Assigned',
          date: new Date().toISOString(),
          note: eventNote
        }
      ];

      const updatedOrder = await this.shippingRepository.updateShipment(orderId, {
        awb_code: awbCode,
        courier_name: courierName,
        courier_company_id: courierCompanyId,
        tracking_number: awbCode,
        tracking_url: trackingUrl,
        shipping_status: 'awb_assigned',
        tracking_events: updatedEvents,
      });

      return updatedOrder;
    } catch (err) {
      logger.error(`Error in generateAwb service: ${err}`);
      if (err instanceof AppError) throw err;
      throw new AppError('AWB generation failed.', 500);
    }
  }

  /**
   * Schedule pickup for shipment
   */
  async schedulePickup(orderId: string): Promise<Order> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order || !order.shipment_id || !order.awb_code) {
      throw new AppError('Order shipment or AWB code is missing. Assign AWB first.', 400);
    }

    try {
      const result = await this.requestShiprocket('/v1/external/courier/generate/pickup', {
        method: 'POST',
        body: JSON.stringify({
          shipment_id: [Number(order.shipment_id)],
        }),
      });

      const currentEvents = Array.isArray(order.tracking_events) ? order.tracking_events : [];
      const updatedEvents = [
        ...currentEvents,
        {
          status: 'Pickup Scheduled',
          date: new Date().toISOString(),
          note: 'Logistics pickup scheduled with courier partner.'
        }
      ];

      const updatedOrder = await this.shippingRepository.updateShipment(orderId, {
        pickup_status: 'scheduled',
        shipping_status: 'pickup_scheduled',
        estimated_delivery: result.response?.estimated_delivery_date || null,
        tracking_events: updatedEvents,
      });

      // Synchronize backend Order status
      await this.syncOrderStatus(orderId, 'pickup_scheduled');

      // Trigger pickup email
      setImmediate(async () => {
        try {
          const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(updatedOrder.user_id);
          const email = user?.email || updatedOrder.shipping_address?.email || '';
          const fullName = updatedOrder.shipping_address?.full_name || user?.user_metadata?.full_name || 'Customer';
          if (email) {
            await emailService.sendPickupScheduledEmail(updatedOrder);
          }
        } catch (err) {
          logger.error(`Failed sending pickup scheduled email: ${err}`);
        }
      });

      return updatedOrder;
    } catch (err) {
      logger.error(`Error in schedulePickup service: ${err}`);
      if (err instanceof AppError) throw err;
      throw new AppError('Pickup scheduling failed.', 500);
    }
  }

  /**
   * Generate label link for download
   */
  async generateLabel(orderId: string): Promise<Order> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order || !order.shipment_id) {
      throw new AppError('Shipment ID not found.', 400);
    }

    try {
      const result = await this.requestShiprocket('/v1/external/courier/generate/label', {
        method: 'POST',
        body: JSON.stringify({
          ids: [Number(order.shipment_id)],
        }),
      });

      const labelUrl = result.label_url;
      if (!labelUrl) {
        throw new AppError('Shiprocket did not return a label URL', 500);
      }

      const updatedOrder = await this.shippingRepository.updateShipment(orderId, {
        label_url: labelUrl,
      });

      return updatedOrder;
    } catch (err) {
      logger.error(`Error in generateLabel service: ${err}`);
      if (err instanceof AppError) throw err;
      throw new AppError('Label generation failed.', 500);
    }
  }

  /**
   * Generate invoice link for download
   */
  async generateInvoice(orderId: string): Promise<Order> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order || !order.shiprocket_order_id) {
      throw new AppError('Shiprocket order ID not found. Create shipment first.', 400);
    }

    try {
      const result = await this.requestShiprocket('/v1/external/orders/print/invoice', {
        method: 'POST',
        body: JSON.stringify({
          ids: [Number(order.shiprocket_order_id)],
        }),
      });

      const invoiceUrl = result.invoice_url;
      if (!invoiceUrl) {
        throw new AppError('Shiprocket did not return an invoice URL', 500);
      }

      const updatedOrder = await this.shippingRepository.updateShipment(orderId, {
        invoice_url: invoiceUrl,
      });

      return updatedOrder;
    } catch (err) {
      logger.error(`Error in generateInvoice service: ${err}`);
      if (err instanceof AppError) throw err;
      throw new AppError('Invoice generation failed.', 500);
    }
  }

  /**
   * Generate and print manifest link for download
   */
  async generateManifest(orderId: string): Promise<Order> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order || !order.shipment_id) {
      throw new AppError('Shipment ID not found.', 400);
    }

    try {
      await this.requestShiprocket('/v1/external/manifests/generate', {
        method: 'POST',
        body: JSON.stringify({
          shipment_id: [Number(order.shipment_id)],
        }),
      });

      const printResult = await this.requestShiprocket('/v1/external/manifests/print', {
        method: 'POST',
        body: JSON.stringify({
          shipment_id: [Number(order.shipment_id)],
        }),
      });

      const manifestUrl = printResult.manifest_url;
      if (!manifestUrl) {
        throw new AppError('Shiprocket did not return a manifest print URL', 500);
      }

      const updatedOrder = await this.shippingRepository.updateShipment(orderId, {
        manifest_url: manifestUrl,
      });

      return updatedOrder;
    } catch (err) {
      logger.error(`Error in generateManifest service: ${err}`);
      if (err instanceof AppError) throw err;
      throw new AppError('Manifest generation failed.', 500);
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(orderId: string): Promise<Order> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order || !order.shiprocket_order_id) {
      throw new AppError('Order or shipment not found.', 400);
    }

    try {
      await this.requestShiprocket('/v1/external/orders/cancel', {
        method: 'POST',
        body: JSON.stringify({
          ids: [Number(order.shiprocket_order_id)],
        }),
      });

      const currentEvents = Array.isArray(order.tracking_events) ? order.tracking_events : [];
      const updatedEvents = [
        ...currentEvents,
        {
          status: 'Cancelled',
          date: new Date().toISOString(),
          note: 'Shipment has been cancelled on request.'
        }
      ];

      const updatedOrder = await this.shippingRepository.updateShipment(orderId, {
        shipping_status: 'cancelled',
        pickup_status: 'cancelled',
        awb_code: null,
        tracking_number: null,
        tracking_url: null,
        tracking_events: updatedEvents,
      });

      await this.syncOrderStatus(orderId, 'cancelled');

      // Trigger cancel alert email to admin
      emailService.sendAdminShipmentCancelledEmail(updatedOrder).catch(err => {
        logger.error(`Failed sending admin shipment cancellation email: ${err}`);
      });

      return updatedOrder;
    } catch (err) {
      logger.error(`Error in cancelShipment service: ${err}`);
      if (err instanceof AppError) throw err;
      throw new AppError('Cancellation failed.', 500);
    }
  }

  /**
   * Pull latest tracking status from Shiprocket
   */
  async trackShipment(orderId: string): Promise<any> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order || !order.awb_code) {
      throw new AppError('AWB code not found for this shipment.', 400);
    }

    try {
      const result = await this.requestShiprocket(`/v1/external/courier/track/awb/${order.awb_code}`, {
        method: 'GET',
      });

      const trackingData = result[order.awb_code]?.tracking_data;
      const shipmentTrack = trackingData?.shipment_track?.[0];
      const shipmentTrackActivities = trackingData?.shipment_track_activities || [];

      if (shipmentTrack && shipmentTrack.current_status) {
        const shippingStatus = shipmentTrack.current_status;
        const statusCode = Number(shipmentTrack.current_status_code || null);
        
        // Map activities to standard timeline logs
        const timelineEvents = shipmentTrackActivities.map((act: any) => ({
          status: act.activity || act.status,
          date: act.date || new Date().toISOString(),
          note: `${act.location || 'Hub'} — ${act.sr_status_label || ''}`.trim()
        }));

        const updatedOrder = await this.shippingRepository.updateShipment(orderId, {
          shipping_status: shippingStatus,
          shipping_status_code: statusCode,
          delivered_at: shippingStatus.toLowerCase() === 'delivered' ? new Date().toISOString() : order.delivered_at,
          shipped_at: shippingStatus.toLowerCase().includes('transit') ? new Date().toISOString() : order.shipped_at,
          tracking_events: timelineEvents.length > 0 ? timelineEvents : order.tracking_events,
        });

        // Sync order status
        await this.syncOrderStatus(orderId, shippingStatus);

        // Trigger shipping state transition emails
        await this.triggerShippingStatusEmails(updatedOrder, shippingStatus);
      }

      return result;
    } catch (err) {
      logger.error(`Error in trackShipment service: ${err}`);
      if (err instanceof AppError) throw err;
      throw new AppError('Tracking details unavailable', 500);
    }
  }

  /**
   * Parse status updates and dispatch relevant customer/admin notifications
   */
  async triggerShippingStatusEmails(order: Order, shippingStatus: string): Promise<void> {
    const statusLower = shippingStatus.toLowerCase();
    
    setImmediate(async () => {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
        const email = user?.email || order.shipping_address?.email || '';
        const fullName = order.shipping_address?.full_name || user?.user_metadata?.full_name || 'Customer';

        if (!email) return;

        if (statusLower.includes('in transit') || statusLower.includes('in_transit') || statusLower === 'shipped') {
          await emailService.sendOrderShippedEmail(email, fullName, String(order.id));
        } else if (statusLower.includes('out for delivery') || statusLower.includes('out_for_delivery')) {
          await emailService.sendOutForDeliveryEmail(email, fullName, String(order.id));
        } else if (statusLower === 'delivered') {
          await emailService.sendDeliveredEmail(email, fullName, String(order.id));
        } else if (statusLower === 'cancelled') {
          await emailService.sendAdminShipmentCancelledEmail(order);
        }
      } catch (err: any) {
        logger.error(`Error in triggerShippingStatusEmails: ${err}`);
      }
    });
  }
}
