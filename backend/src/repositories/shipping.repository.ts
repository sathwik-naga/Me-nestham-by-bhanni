import { supabaseAdmin } from '../lib/supabase';
import { Order } from '../interfaces/order.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class ShippingRepository {
  /**
   * Update shipment fields for an order in the database
   */
  async updateShipment(orderId: string, updates: Partial<Order>): Promise<Order> {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating shipping fields for order ${orderId}: ${error.message}`);
        throw new AppError('Failed to update shipment records', 500);
      }

      return data as Order;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error updating shipment repository: ${err}`);
      throw new AppError('Internal server error during shipment modification', 500);
    }
  }

  /**
   * Get shipment fields for an order from the database
   */
  async getShipment(orderId: string): Promise<Order> {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', orderId)
        .single();

      if (error) {
        logger.error(`Database error fetching shipping fields for order ${orderId}: ${error.message}`);
        throw new AppError('Failed to fetch shipment details', 500);
      }

      return data as Order;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error fetching shipment repository: ${err}`);
      throw new AppError('Internal server error during shipment retrieval', 500);
    }
  }
}
