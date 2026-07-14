import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { OrderRepository } from '../repositories/order.repository';
import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { AppError } from '../middleware/error';

const orderRepository = new OrderRepository();
const cartRepository = new CartRepository();
const productRepository = new ProductRepository();
const orderService = new OrderService(orderRepository, cartRepository, productRepository);

export class OrderController {
  /**
   * POST /api/orders/checkout
   */
  async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: User session not found', 401);
      }

      const { billing_address, shipping_address, shipping_fee, discount } = req.body;
      const order = await orderService.placeOrder(req.user.id, {
        billing_address,
        shipping_address,
        shipping_fee,
        discount,
      });

      res.status(201).json({
        status: 'success',
        message: 'Order created successfully',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders/:orderId
   */
  async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: User session not found', 401);
      }

      const { orderId } = req.params;
      const isAdmin = req.user.role === 'admin';
      const order = await orderService.getOrderDetails(req.user.id, isAdmin, orderId);

      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/orders
   */
  async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: User session not found', 401);
      }

      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '10', 10)));
      const isAdmin = req.user.role === 'admin';

      const result = await orderService.listOrders(req.user.id, isAdmin, page, limit);

      res.status(200).json({
        status: 'success',
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        data: { orders: result.orders },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/orders/:orderId
   */
  async updateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new AppError('Forbidden: Only administrator users can update order status details', 403);
      }

      const { orderId } = req.params;
      const { status, payment_status } = req.body;
      const order = await orderService.updateOrderState(orderId, { status, payment_status });

      res.status(200).json({
        status: 'success',
        message: 'Order status updated successfully',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  }
}
