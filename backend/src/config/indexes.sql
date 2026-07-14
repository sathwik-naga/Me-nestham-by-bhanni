-- Database Indexes for Me Nestham By Bhanni E-Commerce Platform
-- Execute these queries in your Supabase SQL Editor to optimize query performance.

-- 1. Slugs indexes (Unique constraints or standard indexes for slug lookups)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);

-- 2. Foreign Key indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);

-- 3. Filter and query criteria indexes
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products (bestseller) WHERE bestseller = true;
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories (is_active) WHERE is_active = true;
