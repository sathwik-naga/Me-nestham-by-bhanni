import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';
import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { AppError } from '../middleware/error';

const cartRepository = new CartRepository();
const productRepository = new ProductRepository();
const cartService = new CartService(cartRepository, productRepository);

export class CartController {
  /**
   * GET /api/cart
   */
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: User session not found', 401);
      }

      const result = await cartService.getCart(req.user.id);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/cart/items
   */
  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: User session not found', 401);
      }

      const { product_id, quantity, variant_id } = req.body;
      const result = await cartService.addItemToCart(req.user.id, product_id, quantity, variant_id);

      res.status(200).json({
        status: 'success',
        message: 'Item successfully added to cart',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/cart/items/:itemId
   */
  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: User session not found', 401);
      }

      const { itemId } = req.params;
      const { quantity } = req.body;
      const result = await cartService.updateItemQuantity(req.user.id, itemId, quantity);

      res.status(200).json({
        status: 'success',
        message: 'Cart item quantity updated',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/cart/items/:itemId
   */
  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: User session not found', 401);
      }

      const { itemId } = req.params;
      const result = await cartService.removeItem(req.user.id, itemId);

      res.status(200).json({
        status: 'success',
        message: 'Item removed from cart',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/cart
   */
  async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized: User session not found', 401);
      }

      const result = await cartService.clearUserCart(req.user.id);
      res.status(200).json({
        status: 'success',
        message: 'Cart cleared successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
