import { Coupon, GiftCard } from '../interfaces/promotion.interface';
import { CartItem } from '../interfaces/cart.interface';

export class CouponValidator {
  /**
   * Validate a coupon against customer state and cart contents
   */
  validateCoupon(
    coupon: Coupon,
    cartItems: CartItem[],
    userOrdersCount: number,
    userCouponUsageCount: number,
    subtotal: number
  ): { isValid: boolean; error?: string } {
    // 1. Active check
    if (!coupon.is_active) {
      return { isValid: false, error: 'This coupon is currently disabled' };
    }

    // 2. Scheduling / Temporal bounds checks
    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return { isValid: false, error: 'This coupon campaign has not started yet' };
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return { isValid: false, error: 'This coupon has expired' };
    }

    // 3. Usage limit check (global pool)
    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
      return { isValid: false, error: 'This coupon usage limit has been exceeded' };
    }

    // 4. Per customer limit check
    if (coupon.usage_per_customer !== null && userCouponUsageCount >= coupon.usage_per_customer) {
      return { isValid: false, error: 'You have already reached the maximum usage limit for this coupon' };
    }

    // 5. Minimum order value threshold
    if (subtotal < coupon.minimum_order_amount) {
      return {
        isValid: false,
        error: `Minimum order value of ₹${coupon.minimum_order_amount} required to use this coupon`,
      };
    }

    // 6. First order limit check
    if (coupon.is_first_order && userOrdersCount > 0) {
      return { isValid: false, error: 'This coupon is only valid for your first order' };
    }

    // 7. Product & Category Eligibility checks
    let hasEligibleItem = false;
    
    // If no specific restrictions are set, all items are eligible by default
    const hasRestrictions =
      (coupon.applicable_products && coupon.applicable_products.length > 0) ||
      (coupon.applicable_categories && coupon.applicable_categories.length > 0);

    for (const item of cartItems) {
      const productId = item.product_id;
      const categorySlug = item.product?.category?.slug || '';
      const categoryId = item.product?.category?.id || item.product?.category_id || '';

      // Check exclusions first
      const isExcludedProduct = coupon.excluded_products?.includes(productId);
      const isExcludedCategory = 
        coupon.excluded_categories?.includes(categorySlug) || 
        coupon.excluded_categories?.includes(categoryId);

      if (isExcludedProduct || isExcludedCategory) {
        continue; // excluded
      }

      if (!hasRestrictions) {
        hasEligibleItem = true;
        break;
      }

      // Check inclusions
      const isApplicableProduct = coupon.applicable_products?.includes(productId);
      const isApplicableCategory = 
        coupon.applicable_categories?.includes(categorySlug) || 
        coupon.applicable_categories?.includes(categoryId);

      if (isApplicableProduct || isApplicableCategory) {
        hasEligibleItem = true;
        break;
      }
    }

    if (!hasEligibleItem) {
      return { isValid: false, error: 'None of the items in your cart are eligible for this promotion' };
    }

    return { isValid: true };
  }

  /**
   * Validate gift card status and balance limits
   */
  validateGiftCard(giftCard: GiftCard): { isValid: boolean; error?: string } {
    if (!giftCard.is_active) {
      return { isValid: false, error: 'This gift card is inactive or has been disabled' };
    }

    const now = new Date();
    if (giftCard.expires_at && new Date(giftCard.expires_at) < now) {
      return { isValid: false, error: 'This gift card has expired' };
    }

    if (giftCard.balance <= 0) {
      return { isValid: false, error: 'This gift card has no remaining balance' };
    }

    return { isValid: true };
  }
}
export const couponValidator = new CouponValidator();
