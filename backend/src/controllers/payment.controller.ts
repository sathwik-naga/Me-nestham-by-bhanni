import { Request, Response, NextFunction } from 'express';
import { RazorpayService } from '../services/razorpay.service';
import { OrderRepository } from '../repositories/order.repository';
import { AppError } from '../middleware/error';
import { supabaseAdmin } from '../lib/supabase';
import { EmailService } from '../services/email.service';
import { EmailRepository } from '../repositories/email.repository';
import { ResendProvider } from '../providers/resend.provider';
import logger from '../utils/logger';

const razorpayService = new RazorpayService();
const orderRepository = new OrderRepository();
const emailService = new EmailService(new EmailRepository(), new ResendProvider());

export class PaymentController {
  /**
   * POST /api/payments/create-order
   */
  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: User session not found', 401);
      }

      const { amount, currency, receipt } = req.body;
      
      const razorpayOrder = await razorpayService.createRazorpayOrder(amount, currency, receipt);
      
      // Update local order with the razorpay_order_id immediately
      await orderRepository.updateOrderPayment(receipt, {
        razorpay_order_id: razorpayOrder.id,
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Razorpay order created successfully',
        data: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/verify
   */
  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: User session not found', 401);
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const isVerified = razorpayService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isVerified) {
        logger.warn(`Signature verification failed for razorpay_order_id ${razorpay_order_id}`);
        // Notify admin of payment verification failure
        const order = await orderRepository.getOrderByRazorpayOrderId(razorpay_order_id);
        if (order) {
          const email = order.shipping_address?.email || req.user?.email || '';
          const name = order.shipping_address?.full_name || (req.user as any)?.name || 'Customer';
          await emailService.sendAdminPaymentFailedEmail(order.id, name, email, (order as any).grand_total || (order as any).total || 0, 'Invalid signature during Razorpay verification');
        }
        throw new AppError('Payment verification failed: Invalid signature', 400);
      }

      const order = await orderRepository.getOrderByRazorpayOrderId(razorpay_order_id);
      if (!order) {
        logger.error(`Order not found for razorpay_order_id ${razorpay_order_id}`);
        throw new AppError('Order not found', 404);
      }

      const updatedOrder = await orderRepository.updateOrderPayment(order.id, {
        payment_status: 'paid',
        status: 'confirmed',
        razorpay_payment_id,
        razorpay_signature,
        paid_at: new Date().toISOString(),
        payment_method: 'razorpay',
      });

      logger.info(`Order payment successfully verified. Order ID: ${order.id}`);

      // Trigger payment confirmation email in background
      setImmediate(async () => {
        try {
          const email = order.shipping_address?.email || req.user?.email || '';
          const name = order.shipping_address?.full_name || (req.user as any)?.name || 'Customer';
          if (email) {
            await emailService.sendPaymentConfirmationEmail(
              email,
              name,
              order.id,
              razorpay_payment_id,
              (order as any).grand_total || (order as any).total || 0,
              'Razorpay'
            );
          }
        } catch (emailErr) {
          logger.warn(`Failed to send payment confirmation email: ${emailErr}`);
        }
      });

      res.status(200).json({
        status: 'success',
        message: 'Payment verified successfully',
        data: { order: updatedOrder },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/payments/webhook
   */
  async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      if (!signature) {
        logger.warn('Webhook signature missing');
        throw new AppError('Unauthorized: Webhook signature is required', 401);
      }

      const rawBody = req.rawBody ? req.rawBody.toString('utf-8') : JSON.stringify(req.body);
      const isVerified = razorpayService.verifyWebhookSignature(rawBody, signature);

      if (!isVerified) {
        logger.warn('Webhook signature verification failed');
        throw new AppError('Forbidden: Invalid webhook signature', 403);
      }

      const event = req.body;
      logger.info(`Webhook event received: ${event.event}`);

      if (event.event === 'payment.captured') {
        const paymentEntity = event.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        
        if (razorpayOrderId) {
          const order = await orderRepository.getOrderByRazorpayOrderId(razorpayOrderId);
          if (order) {
            if (order.payment_status !== 'paid') {
              await orderRepository.updateOrderPayment(order.id, {
                payment_status: 'paid',
                status: 'confirmed',
                razorpay_payment_id: paymentEntity.id,
                paid_at: new Date().toISOString(),
                payment_method: paymentEntity.method,
              });
              logger.info(`Webhook payment.captured: updated order ${order.id} to paid`);

              // Trigger confirmation email
              setImmediate(async () => {
                try {
                  const updatedOrder = await orderRepository.getOrderById(order.id);
                  if (updatedOrder) {
                    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(updatedOrder.user_id);
                    const email = user?.email || updatedOrder.shipping_address?.email || '';
                    const fullName = updatedOrder.shipping_address?.full_name || user?.user_metadata?.full_name || 'Customer';
                    if (email) {
                      await emailService.sendPaymentConfirmationEmail(
                        email,
                        fullName,
                        updatedOrder.id,
                        paymentEntity.id || 'N/A',
                        (updatedOrder as any).grand_total || (updatedOrder as any).total || 0,
                        paymentEntity.method || 'Razorpay'
                      );
                    }
                  }
                } catch (emailErr) {
                  logger.error(`Failed to send payment success notification: ${emailErr}`);
                }
              });
            } else {
              logger.info(`Webhook payment.captured: order ${order.id} is already paid`);
            }
          } else {
            logger.warn(`Webhook payment.captured: order not found for razorpay_order_id ${razorpayOrderId}`);
          }
        }
      } else if (event.event === 'payment.failed') {
        const paymentEntity = event.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;
        
        if (razorpayOrderId) {
          const order = await orderRepository.getOrderByRazorpayOrderId(razorpayOrderId);
          if (order) {
            await orderRepository.updateOrderPayment(order.id, {
              payment_status: 'failed',
            });
            logger.info(`Webhook payment.failed: updated order ${order.id} status to failed`);

            // Trigger admin alert
            setImmediate(async () => {
              try {
                const failedOrder = await orderRepository.getOrderById(order.id);
                if (failedOrder) {
                  const email = failedOrder.shipping_address?.email || '';
                  const name = failedOrder.shipping_address?.full_name || 'Customer';
                  await emailService.sendAdminPaymentFailedEmail(
                    failedOrder.id,
                    name,
                    email,
                    (failedOrder as any).grand_total || (failedOrder as any).total || 0,
                    'Razorpay payment failed webhook event'
                  );
                }
              } catch (emailErr) {
                logger.error(`Failed to send admin payment failed notification: ${emailErr}`);
              }
            });
          } else {
            logger.warn(`Webhook payment.failed: order not found for razorpay_order_id ${razorpayOrderId}`);
          }
        }
      } else {
        logger.info(`Webhook event ignored: ${event.event}`);
      }

      res.status(200).json({
        status: 'success',
        message: 'Webhook processed successfully',
        data: {},
      });
    } catch (error) {
      next(error);
    }
  }
}
