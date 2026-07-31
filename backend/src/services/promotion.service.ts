import { PromotionRepository } from '../repositories/promotion.repository';
import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { couponValidator } from '../utils/coupon.validator';
import { couponEngine } from '../utils/coupon.engine';
import {
  Coupon,
  FlashSale,
  Announcement,
  GiftCard,
  MarketingStats
} from '../interfaces/promotion.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class PromotionService {
  private cartRepository = new CartRepository();
  private productRepository = new ProductRepository();

  constructor(private promotionRepository: PromotionRepository) {}

  // ==========================================
  // COUPON SERVICE METHODS
  // ==========================================

  async createCoupon(adminUserId: string | null, coupon: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'times_used'>): Promise<Coupon> {
    logger.info(`Admin ${adminUserId} creating coupon: ${coupon.code || 'Automatic'}`);
    const newCoupon = await this.promotionRepository.createCoupon(coupon);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'CREATE',
      target_type: 'COUPON',
      target_id: newCoupon.id,
      details: { code: newCoupon.code, is_automatic: newCoupon.is_automatic },
    });

    return newCoupon;
  }

  async updateCoupon(adminUserId: string | null, id: string, updates: Partial<Omit<Coupon, 'id' | 'created_at' | 'updated_at'>>): Promise<Coupon> {
    logger.info(`Admin ${adminUserId} updating coupon ID: ${id}`);
    const updated = await this.promotionRepository.updateCoupon(id, updates);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'UPDATE',
      target_type: 'COUPON',
      target_id: id,
      details: { code: updated.code, updates },
    });

    return updated;
  }

  async deleteCoupon(adminUserId: string | null, id: string): Promise<void> {
    logger.info(`Admin ${adminUserId} deleting coupon ID: ${id}`);
    const existing = await this.promotionRepository.getById(id);
    await this.promotionRepository.deleteCoupon(id);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'DELETE',
      target_type: 'COUPON',
      target_id: id,
      details: { code: existing?.code || '' },
    });
  }

  async duplicateCoupon(adminUserId: string | null, id: string): Promise<Coupon> {
    logger.info(`Admin ${adminUserId} duplicating coupon ID: ${id}`);
    const existing = await this.promotionRepository.getById(id);
    if (!existing) {
      throw new AppError('Source coupon for duplication not found', 404);
    }

    const duplicatedCode = existing.code ? `${existing.code}_COPY` : null;

    const copyData: Omit<Coupon, 'id' | 'created_at' | 'updated_at' | 'times_used'> = {
      code: duplicatedCode,
      title: `${existing.title} (Copy)`,
      description: existing.description,
      type: existing.type,
      discount_value: existing.discount_value,
      maximum_discount: existing.maximum_discount,
      minimum_order_amount: existing.minimum_order_amount,
      usage_limit: existing.usage_limit,
      usage_per_customer: existing.usage_per_customer,
      buy_quantity: existing.buy_quantity,
      get_quantity: existing.get_quantity,
      free_product_id: existing.free_product_id,
      applicable_categories: existing.applicable_categories,
      applicable_products: existing.applicable_products,
      excluded_products: existing.excluded_products,
      excluded_categories: existing.excluded_categories,
      starts_at: existing.starts_at,
      expires_at: existing.expires_at,
      is_first_order: existing.is_first_order,
      is_active: false, // inactive copy by default
      stackable: existing.stackable,
      is_automatic: existing.is_automatic,
      priority: existing.priority,
    };

    const newCoupon = await this.promotionRepository.createCoupon(copyData);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'DUPLICATE',
      target_type: 'COUPON',
      target_id: newCoupon.id,
      details: { source_id: id, code: newCoupon.code },
    });

    return newCoupon;
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    return this.promotionRepository.getByCode(code);
  }

  async listCoupons(
    page: number,
    limit: number,
    search?: string,
    sortBy?: string,
    sortOrder?: string,
    isAutomatic?: boolean
  ): Promise<{ coupons: Coupon[]; total: number; page: number; limit: number; totalPages: number }> {
    const { coupons, count } = await this.promotionRepository.getAllCoupons(
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      isAutomatic
    );
    return {
      coupons,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    };
  }

  // ==========================================
  // COUPON VALIDATION & CALCULATIONS
  // ==========================================

  async validateCoupon(userId: string, code: string): Promise<{ isValid: boolean; error?: string; coupon?: Coupon; discount?: number }> {
    // 1. Fetch coupon details
    const coupon = await this.promotionRepository.getByCode(code);
    if (!coupon) {
      // Log failed attempt
      await this.promotionRepository.createFailure({
        user_id: userId,
        code,
        reason: 'Coupon code does not exist',
      });
      return { isValid: false, error: 'Invalid coupon code.' };
    }

    // 2. Fetch user state
    const userOrdersCount = await this.promotionRepository.getUserTotalOrdersCount(userId);
    const userCouponUsageCount = await this.promotionRepository.getUserCouponUsageCount(userId, coupon.id);

    // 3. Fetch cart items
    const cart = await this.cartRepository.getOrCreateCart(userId);
    const cartItems = await this.cartRepository.getCartItems(cart.id);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

    // 4. Validate coupon properties
    const validation = couponValidator.validateCoupon(
      coupon,
      cartItems,
      userOrdersCount,
      userCouponUsageCount,
      subtotal
    );

    if (!validation.isValid) {
      // Log failed attempt
      await this.promotionRepository.createFailure({
        user_id: userId,
        code,
        reason: validation.error || 'Validation failed',
      });
      return { isValid: false, error: validation.error };
    }

    // Check combinations/priority conflicts (if there's an automatic promotion applied or a higher priority)
    // Find active automatic promotions
    const automaticPromos = await this.promotionRepository.getAutomaticPromotions();
    const activeAutoPromo = couponEngine.evaluateAutomaticPromotions(automaticPromos, cartItems, userOrdersCount, subtotal);

    if (activeAutoPromo && !coupon.stackable) {
      // Conflict: higher priority promotion is already applied or cannot combine
      if (activeAutoPromo.priority > coupon.priority) {
        const errorMsg = 'A higher priority automatic promotion is already applied and cannot be combined with this coupon.';
        await this.promotionRepository.createFailure({ user_id: userId, code, reason: errorMsg });
        return { isValid: false, error: errorMsg };
      } else {
        const errorMsg = 'This coupon cannot be combined with the currently applied promotion.';
        await this.promotionRepository.createFailure({ user_id: userId, code, reason: errorMsg });
        return { isValid: false, error: errorMsg };
      }
    }

    // 5. Calculate discount amount
    const discount = couponEngine.calculateDiscount(coupon, cartItems);

    return {
      isValid: true,
      coupon,
      discount,
    };
  }

  async applyCoupon(userId: string, code: string): Promise<Coupon> {
    const validation = await this.validateCoupon(userId, code);
    if (!validation.isValid || !validation.coupon) {
      throw new AppError(validation.error || 'Failed to validate coupon', 400);
    }

    const cart = await this.cartRepository.getOrCreateCart(userId);
    await this.cartRepository.applyCouponCode(cart.id, validation.coupon.code!);

    return validation.coupon;
  }

  async removeCoupon(userId: string): Promise<void> {
    const cart = await this.cartRepository.getOrCreateCart(userId);
    await this.cartRepository.removeCouponCode(cart.id);
  }

  async trackUsage(userId: string, code: string, orderId: string, discountAmount: number): Promise<void> {
    const coupon = await this.promotionRepository.getByCode(code);
    if (coupon) {
      await this.promotionRepository.incrementUsageCount(coupon.id);
      await this.promotionRepository.createUsage({
        coupon_id: coupon.id,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount,
      });
    }
  }

  // ==========================================
  // GIFT CARDS
  // ==========================================

  async getGiftCardByCode(code: string): Promise<GiftCard | null> {
    return this.promotionRepository.getGiftCardByCode(code);
  }

  async validateGiftCard(code: string): Promise<{ isValid: boolean; error?: string; giftCard?: GiftCard }> {
    const giftCard = await this.promotionRepository.getGiftCardByCode(code);
    if (!giftCard) {
      return { isValid: false, error: 'Gift card not found' };
    }

    const validation = couponValidator.validateGiftCard(giftCard);
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }

    return { isValid: true, giftCard };
  }

  async applyGiftCard(userId: string, code: string): Promise<GiftCard> {
    const validation = await this.validateGiftCard(code);
    if (!validation.isValid || !validation.giftCard) {
      throw new AppError(validation.error || 'Invalid gift card', 400);
    }

    const cart = await this.cartRepository.getOrCreateCart(userId);
    await this.cartRepository.applyGiftCardCode(cart.id, validation.giftCard.code);

    return validation.giftCard;
  }

  async removeGiftCard(userId: string): Promise<void> {
    const cart = await this.cartRepository.getOrCreateCart(userId);
    await this.cartRepository.removeGiftCardCode(cart.id);
  }

  async createGiftCard(adminUserId: string | null, gc: Omit<GiftCard, 'id' | 'created_at' | 'updated_at'>): Promise<GiftCard> {
    const newGc = await this.promotionRepository.createGiftCard(gc);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'CREATE',
      target_type: 'GIFT_CARD',
      target_id: newGc.id,
      details: { code: newGc.code, balance: newGc.balance },
    });

    return newGc;
  }

  async updateGiftCard(adminUserId: string | null, id: string, updates: Partial<Omit<GiftCard, 'id' | 'created_at' | 'updated_at'>>): Promise<GiftCard> {
    const updated = await this.promotionRepository.updateGiftCard(id, updates);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'UPDATE',
      target_type: 'GIFT_CARD',
      target_id: id,
      details: { code: updated.code, updates },
    });

    return updated;
  }

  async deleteGiftCard(adminUserId: string | null, id: string): Promise<void> {
    const existing = await this.promotionRepository.getGiftCardById(id);
    await this.promotionRepository.deleteGiftCard(id);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'DELETE',
      target_type: 'GIFT_CARD',
      target_id: id,
      details: { code: existing?.code || '' },
    });
  }

  async listGiftCards(page: number, limit: number, search?: string) {
    const { giftCards, count } = await this.promotionRepository.listGiftCards(page, limit, search);
    return {
      giftCards,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    };
  }

  // ==========================================
  // FLASH SALES
  // ==========================================

  async getActiveFlashSale() {
    return this.promotionRepository.getActiveFlashSale();
  }

  async createFlashSale(adminUserId: string | null, fs: Omit<FlashSale, 'id' | 'created_at' | 'updated_at'>): Promise<FlashSale> {
    const newFs = await this.promotionRepository.createFlashSale(fs);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'CREATE',
      target_type: 'FLASH_SALE',
      target_id: newFs.id,
      details: { title: newFs.title },
    });

    return newFs;
  }

  async updateFlashSale(adminUserId: string | null, id: string, updates: Partial<Omit<FlashSale, 'id' | 'created_at' | 'updated_at'>>): Promise<FlashSale> {
    const updated = await this.promotionRepository.updateFlashSale(id, updates);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'UPDATE',
      target_type: 'FLASH_SALE',
      target_id: id,
      details: { title: updated.title, updates },
    });

    return updated;
  }

  async deleteFlashSale(adminUserId: string | null, id: string): Promise<void> {
    const existing = await this.promotionRepository.getActiveFlashSale(); // fallback lookups
    await this.promotionRepository.deleteFlashSale(id);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'DELETE',
      target_type: 'FLASH_SALE',
      target_id: id,
      details: { title: existing?.title || '' },
    });
  }

  async listFlashSales(page: number, limit: number) {
    const { flashSales, count } = await this.promotionRepository.listFlashSales(page, limit);
    return {
      flashSales,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    };
  }

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================

  async getActiveAnnouncement() {
    return this.promotionRepository.getActiveAnnouncement();
  }

  async createAnnouncement(adminUserId: string | null, ann: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>): Promise<Announcement> {
    const newAnn = await this.promotionRepository.createAnnouncement(ann);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'CREATE',
      target_type: 'ANNOUNCEMENT',
      target_id: newAnn.id,
      details: { text: newAnn.text },
    });

    return newAnn;
  }

  async updateAnnouncement(adminUserId: string | null, id: string, updates: Partial<Omit<Announcement, 'id' | 'created_at' | 'updated_at'>>): Promise<Announcement> {
    const updated = await this.promotionRepository.updateAnnouncement(id, updates);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'UPDATE',
      target_type: 'ANNOUNCEMENT',
      target_id: id,
      details: { text: updated.text, updates },
    });

    return updated;
  }

  async deleteAnnouncement(adminUserId: string | null, id: string): Promise<void> {
    await this.promotionRepository.deleteAnnouncement(id);

    await this.promotionRepository.createAuditLog({
      user_id: adminUserId,
      action: 'DELETE',
      target_type: 'ANNOUNCEMENT',
      target_id: id,
      details: {},
    });
  }

  async listAnnouncements(page: number, limit: number) {
    const { announcements, count } = await this.promotionRepository.listAnnouncements(page, limit);
    return {
      announcements,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    };
  }

  // ==========================================
  // SIMULATION ENDPOINT
  // ==========================================

  async simulatePromotion(draftCoupon: Coupon, mockItems: any[]): Promise<{
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    grandTotal: number;
  }> {
    // Structure mockItems as CartItems
    const cartItems = mockItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      product: item.product, // expects price, category, etc.
    })) as any[];

    const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

    // Evaluate draft coupon
    let discount = 0;
    let freeShippingCoupon = false;

    // We skip global validation parameters (like starts_at, usage_limit, is_first_order) to simulate the discount impact itself
    const eligible = cartItems.some((item) => couponEngine.isItemEligible(draftCoupon, item));

    if (eligible && draftCoupon.is_active && subtotal >= draftCoupon.minimum_order_amount) {
      discount = couponEngine.calculateDiscount(draftCoupon, cartItems);
      if (draftCoupon.type === 'free_shipping') {
        freeShippingCoupon = true;
      }
    }

    let shipping = 0;
    if (freeShippingCoupon) {
      shipping = 0;
    } else {
      shipping = (subtotal - discount) >= 499 ? 0 : 99;
    }

    const tax = parseFloat(((subtotal - discount) * 0.18).toFixed(2));
    const grandTotal = parseFloat((subtotal - discount + shipping + tax).toFixed(2));

    return {
      subtotal,
      discount,
      shipping,
      tax,
      grandTotal,
    };
  }

  // ==========================================
  // BULK & STATS
  // ==========================================

  async bulkUpdate(adminUserId: string | null, targetTable: 'coupons' | 'gift_cards', ids: string[], action: 'ENABLE' | 'DISABLE' | 'DELETE'): Promise<void> {
    logger.info(`Admin ${adminUserId} running bulk ${action} on ${targetTable} for ${ids.length} items`);
    
    if (action === 'DELETE') {
      await this.promotionRepository.bulkDelete(targetTable, ids);
    } else {
      await this.promotionRepository.bulkUpdateStatus(targetTable, ids, action === 'ENABLE');
    }

    // Insert audit log entries
    for (const id of ids) {
      await this.promotionRepository.createAuditLog({
        user_id: adminUserId,
        action: action,
        target_type: targetTable === 'coupons' ? 'COUPON' : 'GIFT_CARD',
        target_id: id,
        details: { bulk: true },
      });
    }
  }

  async getMarketingStats(): Promise<MarketingStats> {
    return this.promotionRepository.getMarketingStats();
  }
}
