-- Consolidated Migration: Variant-Specific Images & Media System
-- Run this script in your Supabase SQL Editor to update table schemas.

-- 1. Create or update public.variant_images table with storage_path as source of truth
CREATE TABLE IF NOT EXISTS public.variant_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  storage_path TEXT NULL,
  image_url TEXT NULL,
  media_type TEXT DEFAULT 'image',
  alt_text TEXT NULL,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all requested columns exist if table was previously created
ALTER TABLE public.variant_images
ADD COLUMN IF NOT EXISTS storage_path TEXT NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT NULL,
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image',
ADD COLUMN IF NOT EXISTS alt_text TEXT NULL,
ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- 2. Create Performance Index
CREATE INDEX IF NOT EXISTS idx_variant_images_variant_id ON public.variant_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_images_sorting ON public.variant_images(variant_id, is_primary DESC, sort_order ASC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.variant_images ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Allow public read access for variant_images" ON public.variant_images;
CREATE POLICY "Allow public read access for variant_images" ON public.variant_images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin write access for variant_images" ON public.variant_images;
CREATE POLICY "Allow admin write access for variant_images" ON public.variant_images
  USING (
    (auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text
  );

-- 5. Update create_order_atomic to select the primary or first variant image for order_items snapshot
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
      
      -- Look for primary or first variant-specific image ordered by is_primary DESC, sort_order ASC
      SELECT image_url INTO item_image
      FROM public.variant_images
      WHERE variant_id = item_row.variant_id
      ORDER BY is_primary DESC, sort_order ASC, created_at ASC
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
