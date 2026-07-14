import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { CartResponse, CartSummary, CartItem } from '../interfaces/cart.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class CartService {
  constructor(
    private cartRepository: CartRepository,
    private productRepository: ProductRepository
  ) {}

  /**
   * Helper to compile and structure cart items and totals summary
   */
  private compileCartResponse(items: CartItem[]): CartResponse {
    let totalItems = 0;
    let subtotal = 0;

    items.forEach((item) => {
      totalItems += item.quantity;
      if (item.product) {
        subtotal += item.quantity * item.product.price;
      }
    });

    const summary: CartSummary = {
      totalItems,
      subtotal,
      shipping: 0, // static default
      discount: 0, // static default
      grandTotal: subtotal,
    };

    return {
      cart: {
        items,
        summary,
      },
    };
  }

  /**
   * Fetch active user cart
   */
  async getCart(userId: string): Promise<CartResponse> {
    const cart = await this.cartRepository.getOrCreateCart(userId);
    const items = await this.cartRepository.getCartItems(cart.id);
    return this.compileCartResponse(items);
  }

  /**
   * Add a product item to user's cart (performing checks on stock and active states)
   */
  async addItemToCart(userId: string, productId: string, quantity: number): Promise<CartResponse> {
    logger.info(`Adding product ID ${productId} (Qty: ${quantity}) to user ID ${userId} cart`);

    // 1. Verify product exists
    const product = await this.productRepository.getById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // 2. Verify product is active
    if (!product.is_active) {
      throw new AppError('This product is no longer active or available', 400);
    }

    // 3. Verify stock is positive
    if (product.stock <= 0) {
      throw new AppError('This product is currently out of stock', 400);
    }

    // 4. Retrieve/Create Cart
    const cart = await this.cartRepository.getOrCreateCart(userId);

    // 5. Check if item already exists in cart
    const existingItem = await this.cartRepository.getCartItemByProduct(cart.id, productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      // Verify quantity doesn't exceed stock limit
      if (newQuantity > product.stock) {
        throw new AppError(`Cannot add more items. Only ${product.stock} items are in stock, and you already have ${existingItem.quantity} in your cart.`, 400);
      }

      await this.cartRepository.updateCartItemQuantity(existingItem.id, newQuantity);
    } else {
      // Verify quantity doesn't exceed stock limit
      if (quantity > product.stock) {
        throw new AppError(`Cannot add items. Only ${product.stock} items are in stock.`, 400);
      }

      await this.cartRepository.createCartItem(cart.id, productId, quantity);
    }

    // Retrieve full items and return updated cart
    const items = await this.cartRepository.getCartItems(cart.id);
    return this.compileCartResponse(items);
  }

  /**
   * Update quantity of cart item
   */
  async updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartResponse> {
    logger.info(`Updating cart item ID ${itemId} quantity to ${quantity} for user ${userId}`);

    const cart = await this.cartRepository.getOrCreateCart(userId);

    // 1. Fetch item and check membership
    const item = await this.cartRepository.getCartItemById(itemId);
    if (!item || item.cart_id !== cart.id) {
      throw new AppError('Cart item not found', 404);
    }

    // 2. If quantity is zero or negative, automatically delete
    if (quantity <= 0) {
      await this.cartRepository.deleteCartItem(itemId);
    } else {
      // 3. Verify stock limit
      const product = await this.productRepository.getById(item.product_id);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (quantity > product.stock) {
        throw new AppError(`Only ${product.stock} items are available in stock.`, 400);
      }

      await this.cartRepository.updateCartItemQuantity(itemId, quantity);
    }

    // Retrieve updated cart items
    const items = await this.cartRepository.getCartItems(cart.id);
    return this.compileCartResponse(items);
  }

  /**
   * Delete item from cart
   */
  async removeItem(userId: string, itemId: string): Promise<CartResponse> {
    logger.info(`Removing cart item ID ${itemId} from user ${userId} cart`);

    const cart = await this.cartRepository.getOrCreateCart(userId);

    const item = await this.cartRepository.getCartItemById(itemId);
    if (!item || item.cart_id !== cart.id) {
      throw new AppError('Cart item not found', 404);
    }

    await this.cartRepository.deleteCartItem(itemId);

    const items = await this.cartRepository.getCartItems(cart.id);
    return this.compileCartResponse(items);
  }

  /**
   * Clear entire cart items
   */
  async clearUserCart(userId: string): Promise<CartResponse> {
    logger.info(`Clearing cart items for user ${userId}`);
    const cart = await this.cartRepository.getOrCreateCart(userId);
    await this.cartRepository.clearCart(cart.id);
    return this.compileCartResponse([]);
  }
}
