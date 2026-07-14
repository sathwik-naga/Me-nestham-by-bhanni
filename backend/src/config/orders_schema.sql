-- 1. Create Order Status Enums if they do not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
    CREATE TYPE order_status_enum AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');
  END IF;
END
$$;

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status order_status_enum NOT NULL DEFAULT 'pending',
  payment_status payment_status_enum NOT NULL DEFAULT 'pending',
  total_items INT NOT NULL CHECK (total_items >= 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  discount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  grand_total NUMERIC(12,2) NOT NULL CHECK (grand_total >= 0),
  billing_address JSONB NOT NULL,
  shipping_address JSONB NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Order Items Table (Immutable Snapshot representation)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  featured_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Indexes for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 5. Row Level Security Policies (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Select/Insert policies for orders
CREATE POLICY "Users can select their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can select all orders" ON public.orders
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text
  );

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (
    (auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text
  );

-- Select policies for order items
CREATE POLICY "Users can select their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can select all order items" ON public.order_items
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'admin'::text
  );

CREATE POLICY "Users can insert order items matching owned orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

-- 6. Atomic checkout transaction RPC function
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id UUID,
  p_billing_address JSONB,
  p_shipping_address JSONB,
  p_shipping_fee NUMERIC,
  p_discount NUMERIC
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
    (subtotal_var + p_shipping_fee - p_discount),
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

  -- 6. Clear shopping cart
  DELETE FROM public.cart_items WHERE cart_id = cart_id_var;

  RETURN order_id_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
