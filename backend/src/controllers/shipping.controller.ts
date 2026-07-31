import { Request, Response, NextFunction } from 'express';
import { ShippingService } from '../services/shipping.service';
import { ShippingRepository } from '../repositories/shipping.repository';
import { OrderRepository } from '../repositories/order.repository';
import { AppError } from '../middleware/error';
import { supabaseAdmin } from '../lib/supabase';
import logger from '../utils/logger';

const shippingRepository = new ShippingRepository();
const orderRepository = new OrderRepository();
const shippingService = new ShippingService(shippingRepository, orderRepository);

export class ShippingController {
  /**
   * Create order/shipment in Shiprocket
   */
  async createShipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        throw new AppError('orderId is required', 400);
      }

      const order = await shippingService.createShipment(orderId);
      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate AWB for shipment
   */
  async generateAwb(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        throw new AppError('orderId is required', 400);
      }

      const order = await shippingService.generateAwb(orderId);
      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Schedule pickup for shipment
   */
  async schedulePickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        throw new AppError('orderId is required', 400);
      }

      const order = await shippingService.schedulePickup(orderId);
      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate Label URL
   */
  async generateLabel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        throw new AppError('orderId is required', 400);
      }

      const order = await shippingService.generateLabel(orderId);
      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate Invoice URL
   */
  async generateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        throw new AppError('orderId is required', 400);
      }

      const order = await shippingService.generateInvoice(orderId);
      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate Manifest URL
   */
  async generateManifest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        throw new AppError('orderId is required', 400);
      }

      const order = await shippingService.generateManifest(orderId);
      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel shipment in Shiprocket
   */
  async cancelShipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      const order = await shippingService.cancelShipment(orderId);
      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get shipment information
   */
  async getShipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      const order = await shippingRepository.getShipment(orderId);

      if (req.user?.role !== 'admin' && order.user_id !== req.user?.id) {
        throw new AppError('Forbidden: Access is denied for this order shipping details', 403);
      }

      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track shipment activities
   */
  async trackShipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId } = req.params;
      
      // Authorization pre-check
      const order = await orderRepository.getOrderById(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (req.user?.role !== 'admin' && order.user_id !== req.user?.id) {
        throw new AppError('Forbidden: Access is denied for this order tracking details', 403);
      }

      const trackingDetails = await shippingService.trackShipment(orderId);
      res.status(200).json({
        status: 'success',
        data: trackingDetails,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public Webhook endpoint for Shiprocket logistics updates
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body;
      logger.info(`Received Shiprocket webhook payload: ${JSON.stringify(payload)}`);

      const awb = payload.awb || payload.awb_code;
      const shipmentId = String(payload.shipment_id || '');
      const shippingStatus = payload.current_status || payload.status || '';
      const statusCode = Number(payload.current_status_code || null);

      if (!shipmentId) {
        res.status(400).json({ status: 'fail', message: 'shipment_id is missing from webhook payload' });
        return;
      }

      // Find order in database by shipment_id
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('shipment_id', shipmentId)
        .single();

      if (error || !order) {
        logger.warn(`Webhook received for untracked shipment_id: ${shipmentId}`);
        res.status(200).json({ status: 'ignored', message: 'Shipment not found locally' });
        return;
      }

      const orderId = order.id;

      // Map scans/activities into tracking_events
      let timelineEvents = Array.isArray(order.tracking_events) ? order.tracking_events : [];
      if (Array.isArray(payload.scans)) {
        timelineEvents = payload.scans.map((scan: any) => ({
          status: scan.activity || scan.status || shippingStatus,
          date: scan.date || new Date().toISOString(),
          note: `${scan.location || 'Hub'} — ${scan.activity || ''}`.trim()
        }));
      } else if (shippingStatus) {
        timelineEvents = [
          ...timelineEvents,
          {
            status: shippingStatus,
            date: new Date().toISOString(),
            note: 'Status updated via webhook'
          }
        ];
      }

      // Update fields
      const updates: any = {
        shipping_status: shippingStatus,
        shipping_status_code: statusCode,
        tracking_events: timelineEvents,
      };

      if (awb) {
        updates.awb_code = awb;
        updates.tracking_number = awb;
        updates.tracking_url = `https://shiprocket.co/tracking/${awb}`;
      }

      if (payload.courier_name) {
        updates.courier_name = payload.courier_name;
      }

      if (payload.etd || payload.estimated_delivery) {
        updates.estimated_delivery = payload.etd || payload.estimated_delivery;
      }

      if (shippingStatus.toLowerCase() === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      if (shippingStatus.toLowerCase().includes('transit')) {
        updates.shipped_at = new Date().toISOString();
      }

      const updatedOrder = await shippingRepository.updateShipment(orderId, updates);

      // Sync order status
      await shippingService.syncOrderStatus(orderId, shippingStatus);

      // Trigger email updates
      await shippingService.triggerShippingStatusEmails(updatedOrder, shippingStatus);

      res.status(200).json({ status: 'success', message: 'Webhook processed successfully' });
    } catch (error) {
      logger.error(`Error processing Shiprocket webhook: ${error}`);
      next(error);
    }
  }
}
