-- Database Backup - Me Nestham By Bhanni
-- Generated: 2026-07-24T19:05:10.509Z

SET session_replication_role = 'replica';

-- Table: public.categories
DELETE FROM public.categories;
INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) VALUES ('0a8a8547-14e9-45e0-8b9a-83cd1226bd1b', 'Polyester Cloth Petals', 'polyester-cloth-petals', 'Premium polyester cloth petals', NULL, true, '2026-07-12T15:57:09.269217+00:00', '2026-07-12T15:57:09.269217+00:00');

-- Table: public.products
DELETE FROM public.products;
INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES ('95cce5eb-e7d2-4268-8142-5341013f8dcc', '0a8a8547-14e9-45e0-8b9a-83cd1226bd1b', 'Marigold Garland Pack', 'marigold-garland-pack', NULL, 'Premium artificial marigold flowers for decorations.', NULL, 220, 280, 45, true, false, false, 'https://example.com/marigold.jpg', NULL, NULL, '2026-07-14T10:48:57.061755+00:00', '2026-07-14T10:48:57.061755+00:00');
INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES ('d6c23648-6396-4eec-a22e-45801144ec57', '0a8a8547-14e9-45e0-8b9a-83cd1226bd1b', 'Rose Petal Pack', 'rose-petal-pack', 'Premium polyester cloth petals', 'High-quality polyester cloth petals for decoration and garland making.', NULL, 299, 349, 83, true, true, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/WhatsApp%20Image%202026-07-12%20at%209.22.43%20PM.jpeg', NULL, NULL, '2026-07-12T16:00:57.652598+00:00', '2026-07-12T16:00:57.652598+00:00');
INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES ('5a21520a-b9e1-41de-b184-2ada1c22b5b1', '0a8a8547-14e9-45e0-8b9a-83cd1226bd1b', 'GOLDEN BALLS', 'golden-balls', NULL, 'Exquisitely handcrafted by heritage artisans, this premium GOLDEN BALLS brings together centuries of traditional craftsmanship and refined modern aesthetics. Made from carefully selected, ethically sourced materials in the category of polyester-cloth-petals, it represents the perfect embodiment of Indian art and cultural pride. Every line is hand-carved, and every detail represents the master maker''s lifetime dedication to perfection. Ideal as a legacy centerpiece or a thoughtful premium gift for someone special. Tagged under: Handmade, Artisan, Heritage.', NULL, 80, 120, 10, false, true, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/temp/o1x58aa/whatsapp-image-2026-07-21-at-1-1784614573337-o7lk.webp', NULL, NULL, '2026-07-21T06:17:35.897529+00:00', '2026-07-21T06:17:35.897529+00:00');

-- Table: public.product_images
DELETE FROM public.product_images;

-- Table: public.product_variants
DELETE FROM public.product_variants;

SET session_replication_role = 'origin';
