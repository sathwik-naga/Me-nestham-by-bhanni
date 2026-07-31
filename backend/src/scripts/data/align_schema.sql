-- ==============================================================================
-- MIGRATION: Align product_variants table with backend Express code
-- ==============================================================================
-- Execute this script in your Supabase SQL Editor to add the missing columns
-- required by the backend TypeScript interfaces and routes.

-- 1. Add "name" column if it does not exist (Express expects this)
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Add "stock_quantity" column if it does not exist (Express expects this)
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- 3. Sync existing data: set stock_quantity to stock if it exists
UPDATE public.product_variants 
SET stock_quantity = stock 
WHERE stock_quantity IS NULL OR stock_quantity = 0;

-- 4. Sync existing data: set name to a combination of size and color if size/color are present
UPDATE public.product_variants 
SET name = COALESCE(color, '') || CASE WHEN color IS NOT NULL AND size IS NOT NULL THEN ' / ' ELSE '' END || COALESCE(size, '')
WHERE name IS NULL;
