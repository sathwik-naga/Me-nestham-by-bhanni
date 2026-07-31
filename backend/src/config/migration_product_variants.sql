-- Consolidated Schema Migration: Amazon/Shopify-style Product Variant System
-- Run this script in your Supabase SQL Editor to update table schemas.

-- 1. Alter public.product_variants table to add the requested columns
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2) NULL,
ADD COLUMN IF NOT EXISTS weight NUMERIC(12,2) NULL,
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Create public.variant_options table (scalable options architecture)
CREATE TABLE IF NOT EXISTS public.variant_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL, -- e.g., 'Size', 'Color', 'Material', 'Pack Size'
  option_value TEXT NOT NULL, -- e.g., '2 Inch', 'Red', 'Cotton', 'Pack of 12'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(variant_id, option_name)
);

-- 3. Create public.variant_images table
CREATE TABLE IF NOT EXISTS public.variant_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_variant_options_variant_id ON public.variant_options(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_images_variant_id ON public.variant_images(variant_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_images ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- Policies for variant_options
CREATE POLICY "Allow public read access for variant_options" ON public.variant_options
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write access for variant_options" ON public.variant_options
  USING (
    (auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text
  );

-- Policies for variant_images
CREATE POLICY "Allow public read access for variant_images" ON public.variant_images
  FOR SELECT USING (true);

CREATE POLICY "Allow admin write access for variant_images" ON public.variant_images
  USING (
    (auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text
  );

-- 7. Seed initial default values for existing variants
UPDATE public.product_variants
SET is_default = true
WHERE id IN (
  SELECT DISTINCT ON (product_id) id 
  FROM public.product_variants 
  ORDER BY product_id, created_at ASC
) AND is_default = false;

-- Migrate existing size/color columns into variant_options dynamically
INSERT INTO public.variant_options (variant_id, option_name, option_value)
SELECT id, 'Size', size 
FROM public.product_variants 
WHERE size IS NOT NULL AND size <> ''
ON CONFLICT (variant_id, option_name) DO UPDATE SET option_value = EXCLUDED.option_value;

INSERT INTO public.variant_options (variant_id, option_name, option_value)
SELECT id, 'Color', color 
FROM public.product_variants 
WHERE color IS NOT NULL AND color <> ''
ON CONFLICT (variant_id, option_name) DO UPDATE SET option_value = EXCLUDED.option_value;

INSERT INTO public.variant_options (variant_id, option_name, option_value)
SELECT id, 'Material', material 
FROM public.product_variants 
WHERE material IS NOT NULL AND material <> ''
ON CONFLICT (variant_id, option_name) DO UPDATE SET option_value = EXCLUDED.option_value;

-- 8. Add variant columns to public.cart_items and public.order_items tables
ALTER TABLE public.cart_items 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE;

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variant_sku TEXT NULL,
ADD COLUMN IF NOT EXISTS variant_name TEXT NULL,
ADD COLUMN IF NOT EXISTS variant_size TEXT NULL,
ADD COLUMN IF NOT EXISTS variant_color TEXT NULL;

-- 9. Recreate create_order_atomic function to support product variants
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
  variant_row RECORD;
  subtotal_var NUMERIC(12,2) := 0;
  items_count_var INT := 0;
  item_unit_price NUMERIC(12,2);
  item_stock INT;
  item_name TEXT;
  item_sku TEXT;
  item_image TEXT;
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

  -- 3. Lock product and variant rows and calculate backend subtotal
  FOR item_row IN 
    SELECT product_id, variant_id, quantity FROM public.cart_items WHERE cart_id = cart_id_var
  LOOP
    -- Query product with row locking
    SELECT name, slug, price, stock, is_active, image_url, sku
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

    -- If a variant is selected, fetch/verify variant details
    IF item_row.variant_id IS NOT NULL THEN
      SELECT sku, price, sale_price, stock, size, color, name
      INTO variant_row
      FROM public.product_variants
      WHERE id = item_row.variant_id
      FOR UPDATE;

      IF variant_row IS NULL THEN
        RAISE EXCEPTION 'Variant ID % does not exist for product %', item_row.variant_id, product_row.name;
      END IF;

      item_stock := COALESCE(variant_row.stock, 0);
      item_unit_price := COALESCE(variant_row.sale_price, variant_row.price);
    ELSE
      item_stock := product_row.stock;
      item_unit_price := product_row.price;
    END IF;

    IF item_stock < item_row.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product % (variant). Available: %, Requested: %', 
        product_row.name, item_stock, item_row.quantity;
    END IF;

    -- Update totals
    subtotal_var := subtotal_var + (item_unit_price * item_row.quantity);
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
    SELECT product_id, variant_id, quantity FROM public.cart_items WHERE cart_id = cart_id_var
  LOOP
    -- Query product details again
    SELECT name, slug, price, image_url, sku
    INTO product_row 
    FROM public.products 
    WHERE id = item_row.product_id;

    IF item_row.variant_id IS NOT NULL THEN
      SELECT sku, price, sale_price, stock, size, color, name
      INTO variant_row
      FROM public.product_variants
      WHERE id = item_row.variant_id;

      item_sku := variant_row.sku;
      item_unit_price := COALESCE(variant_row.sale_price, variant_row.price);
      item_name := product_row.name || ' (' || COALESCE(variant_row.name, 'Default Variant') || ')';
      
      -- Look for variant-specific image or fallback to main product image
      SELECT image_url INTO item_image
      FROM public.variant_images
      WHERE variant_id = item_row.variant_id
      ORDER BY position ASC
      LIMIT 1;

      IF item_image IS NULL THEN
        item_image := product_row.image_url;
      END IF;

      -- Insert snapshot order item with variant details
      INSERT INTO public.order_items (
        order_id,
        product_id,
        variant_id,
        product_name,
        product_slug,
        unit_price,
        quantity,
        subtotal,
        featured_image,
        variant_sku,
        variant_name,
        variant_size,
        variant_color
      ) VALUES (
        order_id_var,
        item_row.product_id,
        item_row.variant_id,
        item_name,
        product_row.slug,
        item_unit_price,
        item_row.quantity,
        (item_unit_price * item_row.quantity),
        item_image,
        variant_row.sku,
        variant_row.name,
        variant_row.size,
        variant_row.color
      );

      -- Decrement variant stock atomically
      UPDATE public.product_variants
      SET stock = stock - item_row.quantity
      WHERE id = item_row.variant_id;
    ELSE
      -- Standard non-variant product
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
    END IF;
  END LOOP;

  -- 6. Clear shopping cart
  UPDATE public.cart 
  SET coupon_code = NULL, gift_card_code = NULL 
  WHERE id = cart_id_var;
  
  DELETE FROM public.cart_items WHERE cart_id = cart_id_var;

  RETURN order_id_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


