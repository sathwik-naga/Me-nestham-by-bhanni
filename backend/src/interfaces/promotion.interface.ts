export interface Coupon {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  discount_value: number;
  maximum_discount: number | null;
  minimum_order_amount: number;
  usage_limit: number | null;
  usage_per_customer: number | null;
  times_used: number;
  buy_quantity: number;
  get_quantity: number;
  free_product_id: string | null;
  applicable_categories: string[];
  applicable_products: string[];
  excluded_products: string[];
  excluded_categories: string[];
  starts_at: string | null;
  expires_at: string | null;
  is_first_order: boolean;
  is_active: boolean;
  stackable: boolean;
  is_automatic: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string;
  discount_amount: number;
  used_at: string;
}

export interface CouponFailure {
  id: string;
  user_id: string | null;
  code: string;
  reason: string;
  attempted_at: string;
}

export interface FlashSale {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  banner: string | null;
  products: string[]; // Product IDs
  discount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GiftCardUsage {
  id: string;
  gift_card_id: string;
  user_id: string;
  order_id: string;
  amount_used: number;
  used_at: string;
}

export interface PromotionAuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
}

export interface MarketingStats {
  totalCouponsCreated: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalRedemptions: number;
  revenueInfluenced: number;
  averageDiscountPerOrder: number;
  revenueSavedByCustomers: number;
  averageDiscountPercentage: number;
  topPerformingCampaigns: {
    code: string;
    title: string;
    times_used: number;
    total_discount: number;
    total_revenue: number;
  }[];
  topFailedCoupons: {
    code: string;
    reason: string;
    count: number;
  }[];
  dailyUsage: { date: string; count: number }[];
  weeklyUsage: { date: string; count: number }[];
  monthlyUsage: { date: string; count: number }[];
  flashSalePerformance: {
    id: string;
    title: string;
    revenue: number;
    orders_count: number;
  }[];
}
