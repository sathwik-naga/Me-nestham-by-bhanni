-- Migration: Phase 5.1 Database Performance Optimization & Composite Indexing
-- Run this script in your Supabase SQL Editor to speed up database queries (<100ms average).

-- 1. Enable Trigram extension for fast fuzzy text searching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Products Table Composite & Specialized Indexes
CREATE INDEX IF NOT EXISTS idx_products_category_active_price ON public.products (category_id, is_active, price);
CREATE INDEX IF NOT EXISTS idx_products_featured_active ON public.products (featured, is_active) WHERE featured = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_bestseller_active ON public.products (bestseller, is_active) WHERE bestseller = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_created_active ON public.products (created_at DESC) WHERE is_active = true;

-- Trigram GIN Index for Instant Search on Product Name & Description
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);

-- 3. Orders Table Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);

-- 4. Reviews & Wishlist Composite Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON public.reviews (product_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_created ON public.wishlists (user_id, created_at DESC);

-- 5. Email OTPs Performance Index
CREATE INDEX IF NOT EXISTS idx_email_otps_query ON public.email_otps (email, is_verified, is_invalidated, expires_at);
