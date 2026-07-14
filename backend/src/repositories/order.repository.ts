import { supabaseAdmin } from '../lib/supabase';
import { Order, OrderStatus, PaymentStatus, CheckoutInput } from '../interfaces/order.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class OrderRepository {
  /**
   * Invoke database-level transaction via Postgres RPC to create an order atomically
   */
  async createOrderAtomic(userId: string, input: CheckoutInput): Promise<string> {
    try {
      const { data: orderId, error } = await supabaseAdmin.rpc('create_order_atomic', {
        p_user_id: userId,
        p_billing_address: input.billing_address,
        p_shipping_address: input.shipping_address,
        p_shipping_fee: input.shipping_fee || 0,
        p_discount: input.discount || 0,
      });

      if (error) {
        logger.warn(`Database checkout transaction failed for user ${userId}: ${error.message}`);
        // Extract descriptive error messages raised by the RPC function
        if (
          error.message.includes('empty') ||
          error.message.includes('stock') ||
          error.message.includes('active') ||
          error.message.includes('exist')
        ) {
          throw new AppError(error.message, 400);
        }
        throw new AppError('Internal transaction failure during order processing', 500);
      }

      return orderId as string;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error in createOrderAtomic: ${err}`);
      throw new AppError('Internal server error during atomic order transaction', 500);
    }
  }

  /**
   * Retrieve order and its snapshotted items by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error(`Database error fetching order ${orderId}: ${error.message}`);
        throw new AppError('Failed to retrieve order records', 500);
      }

      return data as Order;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error in getOrderById: ${err}`);
      throw new AppError('Internal server error during order details retrieval', 500);
    }
  }

  /**
   * Fetch paginated list of orders for a specific user
   */
  async getUserOrders(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ orders: Order[]; total: number }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        logger.error(`Database error fetching user orders for user ${userId}: ${error.message}`);
        throw new AppError('Failed to retrieve user orders list', 500);
      }

      return {
        orders: (data || []) as Order[],
        total: count || 0,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error in getUserOrders: ${err}`);
      throw new AppError('Internal server error during user orders retrieval', 500);
    }
  }

  /**
   * Fetch paginated list of all orders across the system (Admin only)
   */
  async getAllOrders(page: number, limit: number): Promise<{ orders: Order[]; total: number }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        logger.error(`Database error fetching all orders: ${error.message}`);
        throw new AppError('Failed to retrieve system orders list', 500);
      }

      return {
        orders: (data || []) as Order[],
        total: count || 0,
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error in getAllOrders: ${err}`);
      throw new AppError('Internal server error during system orders retrieval', 500);
    }
  }

  /**
   * Update status details of an existing order (Admin only)
   */
  async updateOrderStatus(
    orderId: string,
    updates: { status?: OrderStatus; payment_status?: PaymentStatus }
  ): Promise<Order> {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating order ${orderId}: ${error.message}`);
        throw new AppError('Failed to update order status details', 500);
      }

      return data as Order;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error in updateOrderStatus: ${err}`);
      throw new AppError('Internal server error during order state modifications', 500);
    }
  }
}
