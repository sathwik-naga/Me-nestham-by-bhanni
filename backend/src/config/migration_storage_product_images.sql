-- ==============================================================================
-- MIGRATION: Supabase Storage Setup & RLS Policies for "product-images" Bucket
-- ==============================================================================
-- ARCHITECTURAL NOTICE (OPTION A - BACKEND SERVICE ROLE UPLOADS):
-- 1. All image upload, replace, and delete operations are processed through
--    the protected Express backend (/api/admin/upload-image & /api/admin/delete-image).
-- 2. The Express backend verifies the admin's Express JWT token and uploads
--    files using SUPABASE_SERVICE_ROLE_KEY (which bypasses RLS safely server-side).
-- 3. All client-side write policies (INSERT, UPDATE, DELETE) are REMOVED from RLS
--    to prevent unauthorized anonymous/customer uploads.
-- 4. Only SELECT (Public Read Access) is allowed so storefront customers can view images.
-- ==============================================================================

-- 1. Ensure the 'product-images' bucket exists and is set to PUBLIC
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB file size limit in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Remove all public/client-side write policies from storage.objects for product-images
DROP POLICY IF EXISTS "Public Read Access for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Delete for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Upload for product-images authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update for product-images authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Allow Delete for product-images authenticated" ON storage.objects;

-- 3. Policy: Public Read Access (SELECT)
-- Grants public read access so storefront visitors and customers can view product images
CREATE POLICY "Public Read Access for product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
