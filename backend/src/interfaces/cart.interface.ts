import { Product } from './product.interface';

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product | null;
  variant?: any | null;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  coupon_code?: string | null;
  gift_card_code?: string | null;
  items: CartItem[];
}

export interface CartSummary {
  totalItems: number; // total quantity of all items combined
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  giftCardDiscount: number;
  grandTotal: number;
  couponCode?: string | null;
  giftCardCode?: string | null;
}

export interface CartResponse {
  cart: {
    items: CartItem[];
    summary: CartSummary;
  };
}
