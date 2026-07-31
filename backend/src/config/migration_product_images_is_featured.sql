-- ==============================================================================
-- MIGRATION: Add is_featured Column & Synchronize sort_order for product_images
-- ==============================================================================

-- 1. Add is_featured column to product_images table if it does not exist
ALTER TABLE public.product_images
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Add position column if it does not exist (for backward compatibility)
ALTER TABLE public.product_images
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- 3. Update existing data: First image (sort_order = 0 or position = 0) is featured
UPDATE public.product_images
SET is_featured = TRUE
WHERE sort_order = 0 OR position = 0;

-- 4. Update remaining images (sort_order > 0 or position > 0) to is_featured = FALSE
UPDATE public.product_images
SET is_featured = FALSE
WHERE sort_order > 0 OR position > 0;

-- 5. Synchronize sort_order and position columns
UPDATE public.product_images
SET position = sort_order
WHERE position IS NULL;

UPDATE public.product_images
SET sort_order = position
WHERE sort_order IS NULL;
