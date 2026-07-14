export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface AddressSnapshot {
  full_name: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  featured_image: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_items: number;
  subtotal: number;
  shipping: number;
  discount: number;
  grand_total: number;
  billing_address: AddressSnapshot;
  shipping_address: AddressSnapshot;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface CheckoutInput {
  billing_address: AddressSnapshot;
  shipping_address: AddressSnapshot;
  shipping_fee?: number;
  discount?: number;
}
