import Razorpay from 'razorpay';
import crypto from 'crypto';
import env from '../config/env';
import logger from '../utils/logger';
import { AppError } from '../middleware/error';

export interface RazorpayOrder {
  id: string;
  amount: number | string;
  currency: string;
  receipt?: string;
  status: string;
}

export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    const keyId = env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const keySecret = env.RAZORPAY_KEY_SECRET || 'razorpay_secret_placeholder';
    
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  /**
   * Create order in Razorpay
   */
  async createRazorpayOrder(amount: number, currency: string, receipt: string): Promise<RazorpayOrder> {
    try {
      logger.info(`Creating Razorpay order. Amount: ${amount}, Currency: ${currency}, Receipt: ${receipt}`);
      
      const options = {
        amount, // in paise
        currency,
        receipt,
      };

      const order = await this.razorpay.orders.create(options);
      logger.info(`Razorpay order created successfully. ID: ${order.id}`);
      return order as RazorpayOrder;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to create Razorpay order: ${errMsg}`);
      throw new AppError('Failed to initialize transaction with payment provider', 500);
    }
  }

  /**
   * Verify signature of payment confirmation
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      logger.info(`Verifying payment signature for Order: ${orderId}, Payment: ${paymentId}`);
      
      const keySecret = env.RAZORPAY_KEY_SECRET || 'razorpay_secret_placeholder';
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isVerified = expectedSignature === signature;
      if (isVerified) {
        logger.info(`Signature verification succeeded for Order: ${orderId}`);
      } else {
        logger.warn(`Signature verification failed for Order: ${orderId}. Expected ${expectedSignature}, got ${signature}`);
      }
      return isVerified;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Error during signature verification: ${errMsg}`);
      return false;
    }
  }

  /**
   * Validate webhook signature from Razorpay
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      logger.info(`Verifying Razorpay webhook signature`);
      
      const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_placeholder';
      const isVerified = Razorpay.validateWebhookSignature(
        body,
        signature,
        webhookSecret
      );
      
      if (isVerified) {
        logger.info('Webhook signature verified successfully');
      } else {
        logger.warn('Webhook signature verification failed');
      }
      return isVerified;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error(`Error verifying webhook signature: ${errMsg}`);
      return false;
    }
  }
}
