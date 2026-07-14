import { Product } from './product.interface';

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product | null;
}

export interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  items: CartItem[];
}

export interface CartSummary {
  totalItems: number; // total quantity of all items combined
  subtotal: number;
  shipping: number;
  discount: number;
  grandTotal: number;
}

export interface CartResponse {
  cart: {
    items: CartItem[];
    summary: CartSummary;
  };
}
