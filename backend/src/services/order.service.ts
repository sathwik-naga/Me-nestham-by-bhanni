import { OrderRepository } from '../repositories/order.repository';
import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { Order, OrderStatus, PaymentStatus, CheckoutInput } from '../interfaces/order.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private cartRepository: CartRepository,
    private productRepository: ProductRepository
  ) {}

  /**
   * Run client address validation, verify stock/active limits, and invoke atomic db RPC checkout transaction
   */
  async placeOrder(userId: string, input: CheckoutInput): Promise<Order> {
    logger.info(`Starting checkout process for user ID: ${userId}`);

    // 1. Fetch user's cart
    const cart = await this.cartRepository.getOrCreateCart(userId);
    const cartItems = await this.cartRepository.getCartItems(cart.id);

    // 2. Verify cart is not empty
    if (!cartItems || cartItems.length === 0) {
      throw new AppError('Your shopping cart is empty', 400);
    }

    // 3. Defensive validations on prices/stock before hitting DB RPC
    for (const item of cartItems) {
      const product = await this.productRepository.getById(item.product_id);
      if (!product) {
        throw new AppError(`Product details not found for ID: ${item.product_id}`, 404);
      }

      if (!product.is_active) {
        throw new AppError(`Product "${product.name}" is no longer active and cannot be purchased`, 400);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}". Only ${product.stock} left in stock.`, 400);
      }

      if (item.quantity <= 0) {
        throw new AppError(`Invalid item quantity of ${item.quantity} for "${product.name}"`, 400);
      }
    }

    // 4. Run atomic checkout in Postgres
    const orderId = await this.orderRepository.createOrderAtomic(userId, input);

    // 5. Fetch fully snapshotted order details
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order) {
      throw new AppError('Order database snapshot not found after checkout creation', 500);
    }

    logger.info(`Checkout successfully completed. Order ID: ${orderId}`);
    return order;
  }

  /**
   * Fetch details of a single order (Enforces owner or admin credentials check)
   */
  async getOrderDetails(userId: string, isAdmin: boolean, orderId: string): Promise<Order> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order) {
      throw new AppError('Order records not found', 404);
    }

    // Enforce authorization bounds
    if (!isAdmin && order.user_id !== userId) {
      throw new AppError('You are not authorized to view this order record', 403);
    }

    return order;
  }

  /**
   * Retrieve list of orders with pagination details (Admin sees all, Users see own)
   */
  async listOrders(
    userId: string,
    isAdmin: boolean,
    page: number,
    limit: number
  ): Promise<{ orders: Order[]; total: number; page: number; limit: number; totalPages: number }> {
    let result: { orders: Order[]; total: number };

    if (isAdmin) {
      logger.info(`Admin retrieval of system orders list (Page: ${page}, Limit: ${limit})`);
      result = await this.orderRepository.getAllOrders(page, limit);
    } else {
      logger.info(`User ${userId} retrieval of orders list (Page: ${page}, Limit: ${limit})`);
      result = await this.orderRepository.getUserOrders(userId, page, limit);
    }

    const totalPages = Math.ceil(result.total / limit) || 1;

    return {
      orders: result.orders,
      total: result.total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Modify status states of an order (Admin only)
   */
  async updateOrderState(
    orderId: string,
    updates: { status?: OrderStatus; payment_status?: PaymentStatus }
  ): Promise<Order> {
    logger.info(`Admin status update request for order ID: ${orderId} (Status: ${updates.status}, Payment: ${updates.payment_status})`);

    const order = await this.orderRepository.getOrderById(orderId);
    if (!order) {
      throw new AppError('Order records not found', 404);
    }

    const updatedOrder = await this.orderRepository.updateOrderStatus(orderId, updates);
    return updatedOrder;
  }
}
