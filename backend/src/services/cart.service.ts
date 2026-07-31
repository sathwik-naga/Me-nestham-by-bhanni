import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { PromotionRepository } from '../repositories/promotion.repository';
import { couponEngine } from '../utils/coupon.engine';
import { couponValidator } from '../utils/coupon.validator';
import { CartResponse, CartSummary, CartItem } from '../interfaces/cart.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class CartService {
  private promotionRepository = new PromotionRepository();

  constructor(
    private cartRepository: CartRepository,
    private productRepository: ProductRepository
  ) {}

  /**
   * Helper to compile and structure cart items and totals summary using backend Promotion Engine
   */
  private async compileCartResponse(
    userId: string,
    items: CartItem[],
    couponCode?: string | null,
    giftCardCode?: string | null
  ): Promise<CartResponse> {
    let totalItems = 0;
    let subtotal = 0;

    items.forEach((item) => {
      totalItems += item.quantity;
      if (item.product) {
        const itemPrice = item.variant
          ? (item.variant.sale_price !== null && item.variant.sale_price !== undefined ? item.variant.sale_price : item.variant.price)
          : item.product.price;
        subtotal += item.quantity * itemPrice;
      }
    });

    let discount = 0;
    let appliedCouponObj = null;
    let finalCouponCode: string | null = null;

    // 1. Evaluate user context and automatic promotions
    const userOrdersCount = await this.promotionRepository.getUserTotalOrdersCount(userId);
    const automaticPromos = await this.promotionRepository.getAutomaticPromotions();
    const activeAutoPromo = couponEngine.evaluateAutomaticPromotions(
      automaticPromos,
      items,
      userOrdersCount,
      subtotal
    );

    // 2. Evaluate manual coupon code
    if (couponCode) {
      const coupon = await this.promotionRepository.getByCode(couponCode);
      if (coupon) {
        const userCouponUsageCount = await this.promotionRepository.getUserCouponUsageCount(userId, coupon.id);
        const validation = couponValidator.validateCoupon(
          coupon,
          items,
          userOrdersCount,
          userCouponUsageCount,
          subtotal
        );

        if (validation.isValid) {
          // Combination conflict resolution
          if (activeAutoPromo && !coupon.stackable) {
            if (activeAutoPromo.priority > coupon.priority) {
              appliedCouponObj = activeAutoPromo;
              discount = couponEngine.calculateDiscount(activeAutoPromo, items);
            } else {
              appliedCouponObj = coupon;
              discount = couponEngine.calculateDiscount(coupon, items);
              finalCouponCode = coupon.code;
            }
          } else {
            appliedCouponObj = coupon;
            discount = couponEngine.calculateDiscount(coupon, items);
            finalCouponCode = coupon.code;
          }
        } else {
          // If manual coupon invalid, fallback to auto promo if eligible
          if (activeAutoPromo) {
            appliedCouponObj = activeAutoPromo;
            discount = couponEngine.calculateDiscount(activeAutoPromo, items);
          }
          // Log coupon failure
          await this.promotionRepository.createFailure({
            user_id: userId,
            code: couponCode,
            reason: validation.error || 'Validation failed',
          });
          // Remove invalid code from cart to clean state
          const cart = await this.cartRepository.getOrCreateCart(userId);
          await this.cartRepository.removeCouponCode(cart.id);
        }
      } else if (activeAutoPromo) {
        appliedCouponObj = activeAutoPromo;
        discount = couponEngine.calculateDiscount(activeAutoPromo, items);
      }
    } else if (activeAutoPromo) {
      appliedCouponObj = activeAutoPromo;
      discount = couponEngine.calculateDiscount(activeAutoPromo, items);
    }

    // 3. Calculate shipping
    let shipping = 0;
    const isFreeShipping = appliedCouponObj && appliedCouponObj.type === 'free_shipping';
    if (subtotal === 0) {
      shipping = 0;
    } else if (isFreeShipping) {
      shipping = 0;
    } else {
      shipping = (subtotal - discount) >= 499 ? 0 : 99;
    }

    // 4. Calculate Tax
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = parseFloat((taxableAmount * 0.18).toFixed(2));

    // 5. Evaluate Gift Card
    let giftCardDiscount = 0;
    let finalGiftCardCode: string | null = null;
    if (giftCardCode) {
      const giftCard = await this.promotionRepository.getGiftCardByCode(giftCardCode);
      if (giftCard) {
        const gcVal = couponValidator.validateGiftCard(giftCard);
        if (gcVal.isValid) {
          const grandTotalBeforeGc = taxableAmount + shipping + tax;
          giftCardDiscount = Math.min(Number(giftCard.balance), grandTotalBeforeGc);
          finalGiftCardCode = giftCard.code;
        } else {
          // Clean invalid gift card code
          const cart = await this.cartRepository.getOrCreateCart(userId);
          await this.cartRepository.removeGiftCardCode(cart.id);
        }
      }
    }

    const grandTotal = parseFloat((taxableAmount + shipping + tax - giftCardDiscount).toFixed(2));

    const summary: CartSummary = {
      totalItems,
      subtotal,
      shipping,
      discount,
      tax,
      giftCardDiscount,
      grandTotal,
      couponCode: finalCouponCode,
      giftCardCode: finalGiftCardCode,
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
    return this.compileCartResponse(userId, items, cart.coupon_code, cart.gift_card_code);
  }

  /**
   * Add a product item to user's cart (performing checks on stock and active states)
   */
  async addItemToCart(userId: string, productId: string, quantity: number, variantId?: string | null): Promise<CartResponse> {
    logger.info(`Adding product ID ${productId} (Variant ID: ${variantId}, Qty: ${quantity}) to user ID ${userId} cart`);

    // 1. Verify product exists
    const product = await this.productRepository.getById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // 2. Verify product is active
    if (!product.is_active) {
      throw new AppError('This product is no longer active or available', 400);
    }

    // 3. Determine stock limit
    let stockLimit = product.stock;
    if (variantId && product.variants) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) {
        stockLimit = variant.stock !== undefined ? variant.stock : (variant.stock_quantity || 0);
      }
    }

    // 4. Verify stock is positive
    if (stockLimit <= 0) {
      throw new AppError('This option is currently out of stock', 400);
    }

    // 5. Retrieve/Create Cart
    const cart = await this.cartRepository.getOrCreateCart(userId);

    // 6. Check if item already exists in cart
    const existingItem = await this.cartRepository.getCartItemByProduct(cart.id, productId, variantId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      // Verify quantity doesn't exceed stock limit
      if (newQuantity > stockLimit) {
        throw new AppError(`Cannot add more items. Only ${stockLimit} items are in stock, and you already have ${existingItem.quantity} in your cart.`, 400);
      }

      await this.cartRepository.updateCartItemQuantity(existingItem.id, newQuantity);
    } else {
      // Verify quantity doesn't exceed stock limit
      if (quantity > stockLimit) {
        throw new AppError(`Cannot add items. Only ${stockLimit} items are in stock.`, 400);
      }

      await this.cartRepository.createCartItem(cart.id, productId, quantity, variantId);
    }

    // Retrieve full items and return updated cart
    const items = await this.cartRepository.getCartItems(cart.id);
    return await this.compileCartResponse(userId, items, cart.coupon_code, cart.gift_card_code);
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
    return await this.compileCartResponse(userId, items, cart.coupon_code, cart.gift_card_code);
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
    return await this.compileCartResponse(userId, items, cart.coupon_code, cart.gift_card_code);
  }

  /**
   * Clear entire cart items
   */
  async clearUserCart(userId: string): Promise<CartResponse> {
    logger.info(`Clearing cart items for user ${userId}`);
    const cart = await this.cartRepository.getOrCreateCart(userId);
    await this.cartRepository.clearCart(cart.id);
    return await this.compileCartResponse(userId, [], null, null);
  }
}
