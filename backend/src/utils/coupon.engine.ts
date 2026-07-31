import { Coupon } from '../interfaces/promotion.interface';
import { CartItem } from '../interfaces/cart.interface';

export class CouponEngine {
  /**
   * Helper to check if a product is eligible for a given coupon
   */
  isItemEligible(coupon: Coupon, item: CartItem): boolean {
    const productId = item.product_id;
    const categorySlug = item.product?.category?.slug || '';
    const categoryId = item.product?.category?.id || item.product?.category_id || '';

    // 1. Check exclusions first
    const isExcludedProduct = coupon.excluded_products?.includes(productId);
    const isExcludedCategory = 
      coupon.excluded_categories?.includes(categorySlug) || 
      coupon.excluded_categories?.includes(categoryId);

    if (isExcludedProduct || isExcludedCategory) {
      return false;
    }

    const hasRestrictions =
      (coupon.applicable_products && coupon.applicable_products.length > 0) ||
      (coupon.applicable_categories && coupon.applicable_categories.length > 0);

    if (!hasRestrictions) {
      return true;
    }

    // 2. Check inclusions
    const isApplicableProduct = coupon.applicable_products?.includes(productId);
    const isApplicableCategory = 
      coupon.applicable_categories?.includes(categorySlug) || 
      coupon.applicable_categories?.includes(categoryId);

    return !!(isApplicableProduct || isApplicableCategory);
  }

  /**
   * Calculate the discount amount for a validated coupon on the current cart items
   */
  calculateDiscount(coupon: Coupon, cartItems: CartItem[]): number {
    let discount = 0;

    // Filter eligible items
    const eligibleItems = cartItems.filter((item) => this.isItemEligible(coupon, item));
    if (eligibleItems.length === 0) {
      return 0;
    }

    const eligibleSubtotal = eligibleItems.reduce((sum, item) => {
      const price = Number(item.product?.price || 0);
      return sum + price * item.quantity;
    }, 0);

    switch (coupon.type) {
      case 'percentage': {
        discount = (eligibleSubtotal * coupon.discount_value) / 100;
        if (coupon.maximum_discount !== null && discount > coupon.maximum_discount) {
          discount = coupon.maximum_discount;
        }
        break;
      }
      case 'fixed': {
        discount = coupon.discount_value;
        if (discount > eligibleSubtotal) {
          discount = eligibleSubtotal; // discount cannot exceed eligible items total
        }
        break;
      }
      case 'free_shipping': {
        // Handled separately during shipping calculations, discount amount returned is 0
        discount = 0;
        break;
      }
      case 'buy_x_get_y': {
        const buyQty = coupon.buy_quantity || 1;
        const getQty = coupon.get_quantity || 0;
        const factor = buyQty + getQty;

        if (factor > 0 && getQty > 0) {
          eligibleItems.forEach((item) => {
            const price = Number(item.product?.price || 0);
            const freeItems = Math.floor(item.quantity / factor) * getQty;
            discount += freeItems * price;
          });
        }
        break;
      }
      default:
        discount = 0;
    }

    return parseFloat(discount.toFixed(2));
  }

  /**
   * Evaluate automatic promotions and return the highest priority applicable promotion (if any)
   */
  evaluateAutomaticPromotions(
    automaticPromotions: Coupon[],
    cartItems: CartItem[],
    userOrdersCount: number,
    subtotal: number
  ): Coupon | null {
    if (!automaticPromotions || automaticPromotions.length === 0) {
      return null;
    }

    // Sort by priority DESC (highest priority evaluated first)
    const sortedPromos = [...automaticPromotions].sort((a, b) => b.priority - a.priority);

    for (const promo of sortedPromos) {
      // Basic checks for automatic promo
      if (!promo.is_active) continue;

      const now = new Date();
      if (promo.starts_at && new Date(promo.starts_at) > now) continue;
      if (promo.expires_at && new Date(promo.expires_at) < now) continue;

      // Minimum order amount check
      if (subtotal < promo.minimum_order_amount) continue;

      // First order check
      if (promo.is_first_order && userOrdersCount > 0) continue;

      // Global usage limit check
      if (promo.usage_limit !== null && promo.times_used >= promo.usage_limit) continue;

      // Verify at least one cart item is eligible
      const hasEligible = cartItems.some((item) => this.isItemEligible(promo, item));
      if (!hasEligible) continue;

      // If it passes all criteria, we apply this automatic promotion!
      return promo;
    }

    return null;
  }
}
export const couponEngine = new CouponEngine();
