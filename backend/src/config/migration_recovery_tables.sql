-- Consolidated Schema Migration: Marketing, Wishlists, and Reviews Recovery
-- Run this script in your Supabase SQL Editor to restore missing tables.

-- 1. Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'percentage', 'fixed', 'free_shipping', 'buy_x_get_y'
  discount_value NUMERIC(12,2) DEFAULT 0 CHECK (discount_value >= 0),
  maximum_discount NUMERIC(12,2) NULL CHECK (maximum_discount IS NULL OR maximum_discount >= 0),
  minimum_order_amount NUMERIC(12,2) DEFAULT 0 CHECK (minimum_order_amount >= 0),
  usage_limit INTEGER NULL CHECK (usage_limit IS NULL OR usage_limit >= 0),
  usage_per_customer INTEGER NULL CHECK (usage_per_customer IS NULL OR usage_per_customer >= 0),
  times_used INTEGER DEFAULT 0 CHECK (times_used >= 0),
  buy_quantity INTEGER DEFAULT 0 CHECK (buy_quantity >= 0),
  get_quantity INTEGER DEFAULT 0 CHECK (get_quantity >= 0),
  free_product_id UUID NULL,
  applicable_categories JSONB DEFAULT '[]'::jsonb,
  applicable_products JSONB DEFAULT '[]'::jsonb,
  excluded_products JSONB DEFAULT '[]'::jsonb,
  excluded_categories JSONB DEFAULT '[]'::jsonb,
  starts_at TIMESTAMP WITH TIME ZONE NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  is_first_order BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  stackable BOOLEAN DEFAULT false,
  is_automatic BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Coupon Usage Table
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL CHECK (discount_amount >= 0),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Coupon Failures Table
CREATE TABLE IF NOT EXISTS public.coupon_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  reason TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Flash Sales Table
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  banner TEXT,
  products JSONB DEFAULT '[]'::jsonb, -- array of product IDs
  discount NUMERIC(12,2) NOT NULL CHECK (discount >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Gift Cards Table
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  balance NUMERIC(12,2) NOT NULL CHECK (balance >= 0),
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Gift Card Usage Table
CREATE TABLE IF NOT EXISTS public.gift_card_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  amount_used NUMERIC(12,2) NOT NULL CHECK (amount_used > 0),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Promotion Audit Logs Table
CREATE TABLE IF NOT EXISTS public.promotion_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'DUPLICATE', 'ENABLE', 'DISABLE'
  target_type TEXT NOT NULL, -- 'COUPON', 'FLASH_SALE', 'ANNOUNCEMENT', 'GIFT_CARD'
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create Promotions Dummy Table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create Wishlists Table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, product_id)
);

-- 11. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Add columns to Cart and Orders tables
ALTER TABLE public.cart ADD COLUMN IF NOT EXISTS coupon_code TEXT NULL;
ALTER TABLE public.cart ADD COLUMN IF NOT EXISTS gift_card_code TEXT NULL;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax NUMERIC(12,2) DEFAULT 0 CHECK (tax >= 0);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_card_code TEXT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gift_card_discount NUMERIC(12,2) DEFAULT 0 CHECK (gift_card_discount >= 0);

-- Ensure Foreign Keys on coupons table for free_product_id if public.products exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'coupons_free_product_id_fkey') THEN
      ALTER TABLE public.coupons ADD CONSTRAINT coupons_free_product_id_fkey FOREIGN KEY (free_product_id) REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 13. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_card_usage_gift_card_id ON public.gift_card_usage(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_promotion_audit_logs_target ON public.promotion_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product ON public.wishlists(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

-- 14. Enable Row Level Security (RLS)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 15. Row Level Security Policies
-- Coupons
DROP POLICY IF EXISTS "Public can select coupons" ON public.coupons;
CREATE POLICY "Public can select coupons" ON public.coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;
CREATE POLICY "Admins can update coupons" ON public.coupons FOR ALL USING ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

-- Coupon usage
DROP POLICY IF EXISTS "Users can select own coupon usage" ON public.coupon_usage;
CREATE POLICY "Users can select own coupon usage" ON public.coupon_usage FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can select all coupon usage" ON public.coupon_usage;
CREATE POLICY "Admins can select all coupon usage" ON public.coupon_usage FOR SELECT USING ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);
DROP POLICY IF EXISTS "Users can insert own coupon usage" ON public.coupon_usage;
CREATE POLICY "Users can insert own coupon usage" ON public.coupon_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coupon failures
DROP POLICY IF EXISTS "Admins can manage coupon failures" ON public.coupon_failures;
CREATE POLICY "Admins can manage coupon failures" ON public.coupon_failures FOR ALL USING ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);
DROP POLICY IF EXISTS "Users can insert coupon failures" ON public.coupon_failures;
CREATE POLICY "Users can insert coupon failures" ON public.coupon_failures FOR INSERT WITH CHECK (true);

-- Flash sales
DROP POLICY IF EXISTS "Public can select flash sales" ON public.flash_sales;
CREATE POLICY "Public can select flash sales" ON public.flash_sales FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage flash sales" ON public.flash_sales;
CREATE POLICY "Admins can manage flash sales" ON public.flash_sales FOR ALL USING ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

-- Announcements
DROP POLICY IF EXISTS "Public can select announcements" ON public.announcements;
CREATE POLICY "Public can select announcements" ON public.announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

-- Gift cards
DROP POLICY IF EXISTS "Users can select active gift cards" ON public.gift_cards;
CREATE POLICY "Users can select active gift cards" ON public.gift_cards FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage gift cards" ON public.gift_cards;
CREATE POLICY "Admins can manage gift cards" ON public.gift_cards FOR ALL USING ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

-- Gift card usage
DROP POLICY IF EXISTS "Users can select own gift card usage" ON public.gift_card_usage;
CREATE POLICY "Users can select own gift card usage" ON public.gift_card_usage FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage gift card usage" ON public.gift_card_usage;
CREATE POLICY "Admins can manage gift card usage" ON public.gift_card_usage FOR ALL USING ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);
DROP POLICY IF EXISTS "Users can insert own gift card usage" ON public.gift_card_usage;
CREATE POLICY "Users can insert own gift card usage" ON public.gift_card_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.promotion_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.promotion_audit_logs FOR SELECT USING ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);
DROP POLICY IF EXISTS "System can insert audit logs" ON public.promotion_audit_logs;
CREATE POLICY "System can insert audit logs" ON public.promotion_audit_logs FOR INSERT WITH CHECK (true);

-- Promotions
DROP POLICY IF EXISTS "Public can select promotions" ON public.promotions;
CREATE POLICY "Public can select promotions" ON public.promotions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
CREATE POLICY "Admins can manage promotions" ON public.promotions FOR ALL USING ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text);

-- Wishlists
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlists" ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- Reviews
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own reviews" ON public.reviews;
CREATE POLICY "Users can manage their own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id);

-- 16. Recreate the atomic order transaction RPC function
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id UUID,
  p_billing_address JSONB,
  p_shipping_address JSONB,
  p_shipping_fee NUMERIC,
  p_discount NUMERIC,
  p_tax NUMERIC,
  p_coupon_code TEXT,
  p_gift_card_code TEXT,
  p_gift_card_discount NUMERIC
)
RETURNS UUID AS $$
DECLARE
  cart_id_var UUID;
  order_id_var UUID;
  item_row RECORD;
  product_row RECORD;
  subtotal_var NUMERIC(12,2) := 0;
  items_count_var INT := 0;
BEGIN
  -- 1. Resolve user's cart ID
  SELECT id INTO cart_id_var FROM public.cart WHERE user_id = p_user_id;
  IF cart_id_var IS NULL THEN
    RAISE EXCEPTION 'Cart not found for user';
  END IF;

  -- 2. Verify that there are items in the cart
  IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = cart_id_var) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- 3. Lock product rows and calculate backend subtotal
  FOR item_row IN 
    SELECT product_id, quantity FROM public.cart_items WHERE cart_id = cart_id_var
  LOOP
    -- Query product with row locking (FOR UPDATE)
    SELECT name, slug, price, stock, is_active, image_url 
    INTO product_row 
    FROM public.products 
    WHERE id = item_row.product_id 
    FOR UPDATE;

    IF product_row IS NULL THEN
      RAISE EXCEPTION 'Product ID % does not exist', item_row.product_id;
    END IF;

    IF NOT product_row.is_active THEN
      RAISE EXCEPTION 'Product % is no longer active', product_row.name;
    END IF;

    IF product_row.stock < item_row.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', 
        product_row.name, product_row.stock, item_row.quantity;
    END IF;

    -- Update totals
    subtotal_var := subtotal_var + (product_row.price * item_row.quantity);
    items_count_var := items_count_var + item_row.quantity;
  END LOOP;

  -- 4. Create Order entry
  INSERT INTO public.orders (
    user_id,
    status,
    payment_status,
    total_items,
    subtotal,
    shipping,
    discount,
    tax,
    coupon_code,
    gift_card_code,
    gift_card_discount,
    grand_total,
    billing_address,
    shipping_address
  ) VALUES (
    p_user_id,
    'pending'::order_status_enum,
    'pending'::payment_status_enum,
    items_count_var,
    subtotal_var,
    p_shipping_fee,
    p_discount,
    p_tax,
    p_coupon_code,
    p_gift_card_code,
    p_gift_card_discount,
    (subtotal_var + p_shipping_fee - p_discount + p_tax - p_gift_card_discount),
    p_billing_address,
    p_shipping_address
  ) RETURNING id INTO order_id_var;

  -- 5. Copy and Snapshot items from cart to order_items, decrementing stock atomically
  FOR item_row IN 
    SELECT product_id, quantity FROM public.cart_items WHERE cart_id = cart_id_var
  LOOP
    -- Query product details again (cached in loop execution, locks exist)
    SELECT name, slug, price, image_url 
    INTO product_row 
    FROM public.products 
    WHERE id = item_row.product_id;

    -- Insert snapshot item
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_slug,
      unit_price,
      quantity,
      subtotal,
      featured_image
    ) VALUES (
      order_id_var,
      item_row.product_id,
      product_row.name,
      product_row.slug,
      product_row.price,
      item_row.quantity,
      (product_row.price * item_row.quantity),
      product_row.image_url
    );

    -- Decrement product stock atomically
    UPDATE public.products 
    SET stock = stock - item_row.quantity 
    WHERE id = item_row.product_id;
  END LOOP;

  -- 6. Clear shopping cart (and also clear coupon_code/gift_card_code from cart table)
  UPDATE public.cart 
  SET coupon_code = NULL, gift_card_code = NULL 
  WHERE id = cart_id_var;
  
  DELETE FROM public.cart_items WHERE cart_id = cart_id_var;

  RETURN order_id_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
