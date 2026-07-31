-- Supabase Catalog Insertion Script
-- Generated: 2026-07-24T19:08:32.556Z

-- Align product_variants table columns with backend code first
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

BEGIN;

-- Clean existing catalog tables only
DELETE FROM public.product_variants;
DELETE FROM public.product_images;
DELETE FROM public.products;
DELETE FROM public.categories;

INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) VALUES (
  '29cc1f46-b200-4519-8080-b2972d36ba5b', 'Foam Flowers', 'foam-flowers', 'Vibrant, soft-touch premium foam flower packs for garland making and home accents.', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/categories/foam-flowers.png', true, '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;

INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) VALUES (
  'f5139b07-6ca4-4085-801e-d0d636d84b21', 'Artificial Flowers', 'artificial-flowers', 'Realistic satin roses and ribbon flower separators with stems for garland craft.', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/categories/artificial-flowers.png', true, '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;

INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) VALUES (
  '6a2ef138-fac5-45bd-bc2e-24a7368c6fbb', 'Decorative Balls', 'decorative-balls', 'Gold thread wrapped zari balls in small and large sizes to add a majestic shine.', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/categories/decorative-balls.png', true, '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;

INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) VALUES (
  '97275516-d560-4b92-8fc0-425f89348e44', 'Bells', 'bells', 'Metallic conical filigree bells with hollow designs for traditional hangings.', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/categories/bells.png', true, '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;

INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) VALUES (
  '1ea680cc-7735-4cbb-8721-6bb2366ead52', 'Beads', 'beads', 'Ribbed barrel and pumpkin white plastic spacer beads for structuring garlands.', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/categories/beads.png', true, '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;

INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) VALUES (
  'e9dc4845-6e4a-4036-9870-63a890681db8', 'Decorative Items', 'decorative-items', 'MDF felt-backed lotus hangings and hand-painted Kamadhenu cow pairs for festivals.', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/categories/decorative-items.png', true, '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;

INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) VALUES (
  '07db75af-b331-474d-9918-d6ee6fdf400b', 'Plastic Flower Parts', 'plastic-flower-parts', 'Snowflake, jasmine, lily, and cup-shaped plastic backings and separators for garland framing.', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/categories/plastic-flower-parts.png', true, '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;

INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) VALUES (
  '4ed2c9f6-b6eb-4f88-8e9e-2156600848fe', 'Threads', 'threads', 'Break-resistant cotton garland threads for heavy flower and bead threading.', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/categories/threads.png', true, '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  'b6bc6cfb-5890-4ba3-971e-4b21b7174656', '29cc1f46-b200-4519-8080-b2972d36ba5b', 'Premium Foam Flowers Pack (100pcs)', 'premium-foam-flowers-pack', 'Pack of 100 premium artificial foam flowers for garland making.', 'Premium high-density soft foam flowers, designed for long-lasting visual appeal. Perfect for garland making, wedding decorations, and festive home styling. Durable, vibrant, and soft-touch.

[Search Tags: Foam, Garland, Decoration, Wedding, DIY, Artificial, Festival, Craft, Temple, Home Decor]
[Keywords: foam flowers, artificial flowers, garland materials, wedding decor, DIY craft, festive supplies]', 'MNB-FF-001', 150, 195, 100, true, true, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-collage.png', 'Buy Premium Foam Flowers Pack of 100 | Me Nestham', 'Purchase high-quality artificial foam flowers for garland making & home decor. Available in 19 vibrant colors with bulk pricing at Me Nestham.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'e322e732-9f47-4965-94fa-71727796181f', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-collage.png', true, 0, 0, 'Premium Foam Flowers Pack (100pcs)', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '12be3782-8647-4765-ac24-aaa10d1dc282', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-white.png', false, 1, 1, 'Premium Foam Flowers Pack (100pcs) - White', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'e43b6823-f6e2-47eb-a0ec-29e66bde39c6', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-red-orange.png', false, 2, 2, 'Premium Foam Flowers Pack (100pcs) - Red-orange', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '632df094-683b-41a8-800d-0040080843af', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-dark-blue.png', false, 3, 3, 'Premium Foam Flowers Pack (100pcs) - Dark-blue', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '13bf0a98-9f7b-4c52-8599-50e5bceb0bf3', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-aqua.png', false, 4, 4, 'Premium Foam Flowers Pack (100pcs) - Aqua', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '9f33741f-b668-41a8-bf82-b399c8924663', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-magenta.png', false, 5, 5, 'Premium Foam Flowers Pack (100pcs) - Magenta', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '8c544bf0-8e05-4304-9fa9-b2fd43babca2', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-teal.png', false, 6, 6, 'Premium Foam Flowers Pack (100pcs) - Teal', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '64f541e9-ae87-4d7a-a44d-6a9288d5222b', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-lavender.png', false, 7, 7, 'Premium Foam Flowers Pack (100pcs) - Lavender', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '5cd63684-97fa-46ff-9445-7e246ec1f6a2', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-dark-green.png', false, 8, 8, 'Premium Foam Flowers Pack (100pcs) - Dark-green', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '9fca5751-e011-4142-975d-28d6d1d49eec', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-silver.png', false, 9, 9, 'Premium Foam Flowers Pack (100pcs) - Silver', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '3c8755e0-46cd-42b6-82c0-549a14bd646a', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-yellow.png', false, 10, 10, 'Premium Foam Flowers Pack (100pcs) - Yellow', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '362d33ea-e6c6-40cb-9310-a56fd38abb7d', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-maroon.png', false, 11, 11, 'Premium Foam Flowers Pack (100pcs) - Maroon', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '1e531ca5-3300-432c-80ec-c19020a7e36a', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-peach.png', false, 12, 12, 'Premium Foam Flowers Pack (100pcs) - Peach', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'a2c757b9-5813-4664-a0c3-ac74c9fce6f2', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-coral.png', false, 13, 13, 'Premium Foam Flowers Pack (100pcs) - Coral', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'c210747f-db52-43d6-9291-6382ed84f6b7', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-gold.png', false, 14, 14, 'Premium Foam Flowers Pack (100pcs) - Gold', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '57f26609-7dc4-45b7-bce3-c3583faf3a42', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-pink.png', false, 15, 15, 'Premium Foam Flowers Pack (100pcs) - Pink', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'e27a7448-889c-46bf-9846-a75886f5b5d7', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-orange.png', false, 16, 16, 'Premium Foam Flowers Pack (100pcs) - Orange', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'd3daf65e-2a9d-435a-a4fe-71153681921a', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-light-blue.png', false, 17, 17, 'Premium Foam Flowers Pack (100pcs) - Light-blue', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '4a31881c-04cc-4c62-8cd2-731aee19287d', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-lime-green.png', false, 18, 18, 'Premium Foam Flowers Pack (100pcs) - Lime-green', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'b87c0f2e-8bd1-4e24-9323-40652a72b98e', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/foam-flowers/premium-foam-flowers-pack-purple.png', false, 19, 19, 'Premium Foam Flowers Pack (100pcs) - Purple', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'dfc455e2-f571-43fc-9faa-dbc204b7865a', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-WHT', 150, 100, NULL, 'White', 'White', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '707eba88-a608-43a1-bf26-0103b9da5652', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-RDO', 150, 100, NULL, 'Red-Orange', 'Red-Orange', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '6ac04c3c-40ec-4968-93ad-9994c101efb1', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-DBL', 150, 100, NULL, 'Dark Blue', 'Dark Blue', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '5500bbc9-d218-490c-87b8-f3029d08ccf1', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-AQU', 150, 100, NULL, 'Aqua', 'Aqua', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '82f660ab-108d-48d6-9cba-b9a6574f0cdc', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-MAG', 150, 100, NULL, 'Magenta', 'Magenta', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'b5c76d7b-f5b9-42fa-b166-c5bb4f3460d5', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-TEA', 150, 100, NULL, 'Teal', 'Teal', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '732c9077-8300-4c19-b83e-8f06bc1cf425', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-LAV', 150, 100, NULL, 'Lavender', 'Lavender', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '72f957f2-464c-4eb7-928b-2e96df99156e', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-DGR', 150, 100, NULL, 'Dark Green', 'Dark Green', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'b67095b7-5558-4bf9-b508-3bfb0ad6e446', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-SLV', 150, 100, NULL, 'Silver', 'Silver', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '03e44285-aca3-4653-8b1c-0767a85b33af', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-YEL', 150, 100, NULL, 'Yellow', 'Yellow', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '77b1d517-b9c2-4246-a637-ff199e77f429', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-MAR', 150, 100, NULL, 'Maroon', 'Maroon', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '61f5bebe-ef78-434b-b81b-9da22b9affd1', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-PCH', 150, 100, NULL, 'Peach', 'Peach', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'e03c158b-6cef-4395-9fe2-1348e24b9706', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-CRL', 150, 100, NULL, 'Coral', 'Coral', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '4d9a6cbc-556d-4edc-b2ac-43450869d83a', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-GLD', 150, 100, NULL, 'Gold', 'Gold', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '152a49d6-bb27-4f43-b906-f42444c8a0ad', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-PNK', 150, 100, NULL, 'Pink', 'Pink', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'ddd53627-5b71-4ee6-8b15-8bc1c4e97df6', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-ORG', 150, 100, NULL, 'Orange', 'Orange', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '06cab066-8cef-4f06-ac6b-9fe86f59cad6', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-LBL', 150, 100, NULL, 'Light Blue', 'Light Blue', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'c1eb98ab-089a-42e6-98a5-9b5e18a1aa1c', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-LGR', 150, 100, NULL, 'Lime Green', 'Lime Green', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'f9323e17-8c35-4536-8761-312fe358c97a', 'b6bc6cfb-5890-4ba3-971e-4b21b7174656', 'MNB-FF-001-PRP', 150, 100, NULL, 'Purple', 'Purple', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  'a19e6bc5-620e-4c38-97d2-92a8505ab9a4', '6a2ef138-fac5-45bd-bc2e-24a7368c6fbb', 'Handcrafted Small Gold Zari Balls (10pcs)', 'handcrafted-small-gold-zari-balls', 'Set of 10 small gold zari balls for traditional garland crafting.', 'Exquisite handcrafted small gold zari balls (~3cm diameter) wrapped with high-quality gold thread. Adds a premium traditional touch to garlands, wall hanging crafts, and festive backdrops.

[Search Tags: Gold, Zari, Ball, Garland, Decoration, Wedding, DIY, Craft, Temple, Home Decor]
[Keywords: gold zari balls, small zari balls, garland accessories, craft balls, indian decoration]', 'MNB-DB-001', 80, 104, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/decorative-balls/handcrafted-small-gold-zari-balls-main.png', 'Handcrafted Small Gold Zari Balls (Pack of 10) | Me Nestham', 'Shop beautiful 3cm gold zari balls for garland making & crafts. Pack of 10 at the best price. Authentic festive decor supplies.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '269e1575-3338-4ef9-800d-9308fad06043', 'a19e6bc5-620e-4c38-97d2-92a8505ab9a4', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/decorative-balls/handcrafted-small-gold-zari-balls-main.png', true, 0, 0, 'Handcrafted Small Gold Zari Balls (10pcs)', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  'b5b31b23-129d-423a-b1c3-7d892cf8584f', '97275516-d560-4b92-8fc0-425f89348e44', 'Conical Golden Filigree Bells (10pcs)', 'conical-golden-filigree-bells', 'Pack of 10 elegant conical golden filigree bells for decorations.', 'High-quality conical golden filigree bells. Features beautiful metallic patterns that reflect light brilliantly, perfect for wedding garlands, door hangings, and decorative crafts.

[Search Tags: Bells, Gold, Filigree, Garland, Decoration, Wedding, DIY, Craft, Temple, Home Decor]
[Keywords: golden bells, filigree bells, conical bells, garland bells, decorative bells]', 'MNB-BL-001', 90, 117, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/bells/conical-golden-filigree-bells-main.png', 'Conical Golden Filigree Bells (Pack of 10) | Me Nestham', 'Premium quality golden filigree bells for garland making and traditional hangings. Pack of 10 bells at ₹90 only.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '5d0247de-cc8f-435b-90c1-28d47dd3e112', 'b5b31b23-129d-423a-b1c3-7d892cf8584f', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/bells/conical-golden-filigree-bells-main.png', true, 0, 0, 'Conical Golden Filigree Bells (10pcs)', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  'c09f6f44-c922-438a-a0bc-c7c9d3394d21', 'f5139b07-6ca4-4085-801e-d0d636d84b21', 'Metallic Gold Ribbon Flowers', 'metallic-gold-ribbon-flowers', 'Shiny metallic gold ribbon flowers for garland separators and crafts.', 'Elegant golden artificial ribbon flowers with a subtle green stem. Very versatile for garland separators, wrapping accents, and floral jewelry making.

[Search Tags: Gold, Ribbon, Flower, Garland, Artificial, Decoration, DIY, Craft, Temple, Home Decor]
[Keywords: gold ribbon flowers, artificial gold flowers, garland flowers, flower spacers]', 'MNB-AF-001', 10, 13, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/artificial-flowers/metallic-gold-ribbon-flowers-main.png', 'Metallic Gold Ribbon Flowers (Pack of 10/100) | Me Nestham', 'Purchase shiny golden ribbon flowers with green stems. Perfect separator beads for making garland garlands. Packs of 10 and 100 available.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'e417dae7-deb3-4b29-8d16-96b5370f99c0', 'c09f6f44-c922-438a-a0bc-c7c9d3394d21', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/artificial-flowers/metallic-gold-ribbon-flowers-main.png', true, 0, 0, 'Metallic Gold Ribbon Flowers', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'daaeeb6d-558e-4696-aab6-a56507a67169', 'c09f6f44-c922-438a-a0bc-c7c9d3394d21', 'MNB-AF-001-10P', 10, 100, 'Pack of 10', NULL, 'Pack of 10', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '84f8ded2-0576-48b3-a709-1006d7f6dc80', 'c09f6f44-c922-438a-a0bc-c7c9d3394d21', 'MNB-AF-001-100P', 95, 100, 'Pack of 100', NULL, 'Pack of 100', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  'bb6e65dd-6893-4ee9-ae1e-d8e8f8d0f9bf', '1ea680cc-7735-4cbb-8721-6bb2366ead52', 'Ribbed Barrel Plastic Spacer Beads', 'ribbed-barrel-plastic-spacer-beads', 'Ribbed barrel white plastic beads for garland spacer separators.', 'High-quality white plastic beads in a ribbed barrel shape. Extremely durable, lightweight, and smooth-edged, ideal as garland-making spacer beads.

[Search Tags: Beads, Plastic, Barrel, Spacer, Garland, DIY, Craft, Temple, Home Decor]
[Keywords: barrel beads, ribbed spacer beads, white plastic beads, garland spacer beads]', 'MNB-BD-001', 40, 52, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/beads/ribbed-barrel-plastic-spacer-beads-main.png', 'Ribbed Barrel Plastic Spacer Beads | Me Nestham', 'Buy premium white ribbed barrel plastic beads by weight. Ideal for garland making, DIY decorations, and crafts. 100g and 250g options.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '0e695527-2581-4a5d-8fd0-a724a5bbb39b', 'bb6e65dd-6893-4ee9-ae1e-d8e8f8d0f9bf', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/beads/ribbed-barrel-plastic-spacer-beads-main.png', true, 0, 0, 'Ribbed Barrel Plastic Spacer Beads', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'e4dfdeb1-4745-426d-a29e-7b9469f68a74', 'bb6e65dd-6893-4ee9-ae1e-d8e8f8d0f9bf', 'MNB-BD-001-100G', 40, 100, '100 grams', NULL, '100 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'e0763d1c-fedc-4a03-b381-62655d822433', 'bb6e65dd-6893-4ee9-ae1e-d8e8f8d0f9bf', 'MNB-BD-001-250G', 100, 100, '250 grams', NULL, '250 grams', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  'c9898aad-bd1b-44e6-9f9e-5a1bb8e31945', '1ea680cc-7735-4cbb-8721-6bb2366ead52', 'Ribbed Pumpkin Plastic Spacer Beads', 'ribbed-pumpkin-plastic-spacer-beads', 'Ribbed pumpkin white plastic beads for garland spacer separators.', 'Elegant white plastic beads in a ribbed pumpkin shape. Adds texture and class to handmade garlands, torans, and traditional backdrops.

[Search Tags: Beads, Plastic, Pumpkin, Spacer, Garland, DIY, Craft, Temple, Home Decor]
[Keywords: pumpkin beads, ribbed pumpkin beads, plastic beads, spacer beads]', 'MNB-BD-002', 40, 52, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/beads/ribbed-pumpkin-plastic-spacer-beads-main.png', 'Ribbed Pumpkin Plastic Spacer Beads | Me Nestham', 'Elegant white pumpkin-shaped ribbed beads. High-quality plastic spacer beads for traditional garlands. Available in 100g and 250g packs.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '18ccf0d7-612f-4d16-b2d2-c7e27000083c', 'c9898aad-bd1b-44e6-9f9e-5a1bb8e31945', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/beads/ribbed-pumpkin-plastic-spacer-beads-main.png', true, 0, 0, 'Ribbed Pumpkin Plastic Spacer Beads', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'd4cac632-1e3e-4e47-9253-68de609feeba', 'c9898aad-bd1b-44e6-9f9e-5a1bb8e31945', 'MNB-BD-002-100G', 40, 100, '100 grams', NULL, '100 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '83a087ed-dab4-4570-bd49-c2843a25e844', 'c9898aad-bd1b-44e6-9f9e-5a1bb8e31945', 'MNB-BD-002-250G', 100, 100, '250 grams', NULL, '250 grams', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  '74e5dc0c-1da9-4bcb-8f14-32051ef80c80', 'e9dc4845-6e4a-4036-9870-63a890681db8', 'MDF Laser Cut Red Lotus Wall Hangings (10pcs)', 'mdf-laser-cut-red-lotus-wall-hangings', 'Pack of 10 MDF laser-cut red felt lotus wall hanging cutouts.', 'Beautiful laser-cut wooden MDF lotus flower shapes backed with premium red fabric/felt. Perfect for festive wall decor, backdrop styling, and DIY housewarming hangings.

[Search Tags: Lotus, MDF, Wooden, Wall Hanging, Decoration, DIY, Wedding, Festival, Home Decor]
[Keywords: mdf lotus cutouts, wood lotus shapes, red felt lotus, backdrop flower cutouts]', 'MNB-DI-001', 190, 247, 100, true, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/decorative-items/mdf-laser-cut-red-lotus-wall-hangings-main.png', 'MDF Laser Cut Red Lotus Wall Hangings (Pack of 10) | Me Nestham', 'Festive red fabric-backed wooden MDF lotus cutouts. Pack of 10 lotuses for ₹190. Elegant traditional home decor accessory.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '08e51747-d92b-43e6-8113-490fc7ef7d72', '74e5dc0c-1da9-4bcb-8f14-32051ef80c80', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/decorative-items/mdf-laser-cut-red-lotus-wall-hangings-main.png', true, 0, 0, 'MDF Laser Cut Red Lotus Wall Hangings (10pcs)', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  'ee22c2bd-1925-4e49-aa45-c81a208f5127', 'f5139b07-6ca4-4085-801e-d0d636d84b21', 'Artificial Satin Rose Flowers', 'artificial-satin-rose-flowers', 'Pack of 10 premium artificial satin roses for garland making.', 'Premium artificial satin roses for garland making and floral crafts. Features natural-looking layered petals, available in classic vibrant colors.

[Search Tags: Rose, Satin, Flower, Artificial, Garland, DIY, Craft, Wedding, Decoration, Home Decor]
[Keywords: satin roses, artificial roses, craft rose flowers, garland making roses]', 'MNB-AF-002', 80, 104, 100, true, true, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/artificial-flowers/artificial-satin-rose-flowers-collage.png', 'Premium Artificial Satin Rose Flowers (Pack of 10) | Me Nestham', 'High-quality satin rose flowers in Red, Yellow, White, and Pink. Pack of 10 roses for garland separators & wedding decor.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'b06e84d4-1961-42b0-bd19-d44c68daf2cc', 'ee22c2bd-1925-4e49-aa45-c81a208f5127', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/artificial-flowers/artificial-satin-rose-flowers-collage.png', true, 0, 0, 'Artificial Satin Rose Flowers', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '027aef76-7b12-4ff4-966d-7b28cd097d6e', 'ee22c2bd-1925-4e49-aa45-c81a208f5127', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/artificial-flowers/artificial-satin-rose-flowers-yellow.png', false, 1, 1, 'Artificial Satin Rose Flowers - Yellow', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '16c6b795-e371-40cb-8a41-166579d11db8', 'ee22c2bd-1925-4e49-aa45-c81a208f5127', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/artificial-flowers/artificial-satin-rose-flowers-white.png', false, 2, 2, 'Artificial Satin Rose Flowers - White', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '664dd2d1-57e0-44dc-b73c-e5b1ae924e93', 'ee22c2bd-1925-4e49-aa45-c81a208f5127', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/artificial-flowers/artificial-satin-rose-flowers-pink.png', false, 3, 3, 'Artificial Satin Rose Flowers - Pink', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'a4d7cb00-01c8-46cd-aa02-cb8c56703975', 'ee22c2bd-1925-4e49-aa45-c81a208f5127', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/artificial-flowers/artificial-satin-rose-flowers-red.png', false, 4, 4, 'Artificial Satin Rose Flowers - Red', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '0e76954f-1b88-496c-b2b7-823275ac9103', 'ee22c2bd-1925-4e49-aa45-c81a208f5127', 'MNB-AF-002-RED', 80, 100, NULL, 'Red', 'Red', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '9dd28455-5b47-4955-a0e4-fa722219a1bf', 'ee22c2bd-1925-4e49-aa45-c81a208f5127', 'MNB-AF-002-YEL', 80, 100, NULL, 'Yellow', 'Yellow', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '74e22beb-db9e-45f6-ad46-13139fb995ed', 'ee22c2bd-1925-4e49-aa45-c81a208f5127', 'MNB-AF-002-WHT', 80, 100, NULL, 'White', 'White', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '80c029dd-b363-4e6a-aa2f-be36233e97c6', 'ee22c2bd-1925-4e49-aa45-c81a208f5127', 'MNB-AF-002-PNK', 80, 100, NULL, 'Pink', 'Pink', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  'e961b905-74c0-414d-8b46-37ab1d6e6ba5', '07db75af-b331-474d-9918-d6ee6fdf400b', 'Snowflake Plastic Flower Separators', 'snowflake-plastic-flower-separators', 'Snowflake shape white plastic flower separators for garland backing.', 'Durable white plastic flower separators in a classic 8-arm snowflake design. Widely used in professional garland crafting to give structure, balance, and volume.

[Search Tags: Plastic, Separators, Snowflake, Garland, Spacer, DIY, Craft, Festival, Home Decor]
[Keywords: snowflake separator, plastic separator, garland backing, spacer, flower parts]', 'MNB-PF-001', 200, 260, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/snowflake-plastic-flower-separators-main.png', 'Snowflake Plastic Flower Separators for Garlands | Me Nestham', 'Traditional 8-arm white snowflake plastic separators for garland backing. High quality, light weight. 250g, 500g, and 1kg options available.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '8d1d8dfb-f492-4275-98b4-8279a6d3e1a9', 'e961b905-74c0-414d-8b46-37ab1d6e6ba5', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/snowflake-plastic-flower-separators-main.png', true, 0, 0, 'Snowflake Plastic Flower Separators', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '6959e373-cf9a-4476-a24e-daa216da259f', 'e961b905-74c0-414d-8b46-37ab1d6e6ba5', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/snowflake-plastic-flower-separators-packaging.png', false, 1, 1, 'Snowflake Plastic Flower Separators - Packaging', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'f01eb7b8-3af6-45f7-a515-f2664a4386ad', 'e961b905-74c0-414d-8b46-37ab1d6e6ba5', 'MNB-PF-001-250G', 200, 100, '250 grams', NULL, '250 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '11ed893a-d3bf-43f0-8035-5101f2badcc7', 'e961b905-74c0-414d-8b46-37ab1d6e6ba5', 'MNB-PF-001-500G', 400, 100, '500 grams', NULL, '500 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '5117a3a4-6d76-4a48-b0dd-fe1738e1fb09', 'e961b905-74c0-414d-8b46-37ab1d6e6ba5', 'MNB-PF-001-1KG', 800, 100, '1kg', NULL, '1kg', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  '9ea93086-e56c-40f3-8480-f03558fa91e1', '07db75af-b331-474d-9918-d6ee6fdf400b', 'Six-Arm Cup Plastic Flower Separators', 'six-arm-cup-plastic-flower-separators', '6-arm cup shape white plastic flower separators for professional garland making.', 'Structured 6-arm plastic flower cup separators. Features mini cups at the tips of the arms to hold flower petals or beads securely in place.

[Search Tags: Plastic, Separators, Cup, Garland, Spacer, DIY, Craft, Festival, Home Decor]
[Keywords: six-arm cup separator, plastic separators, garland spacer, flower cup]', 'MNB-PF-002', 200, 260, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/six-arm-cup-plastic-flower-separators-main.png', 'Six-Arm Cup Plastic Flower Separators | Me Nestham', 'Professional 6-arm cup design plastic flower separators for garland making. Available in 250g, 500g, and 1kg bags. Best prices online.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '97006d2f-263c-4ca3-acd7-2eb7fe91fbaf', '9ea93086-e56c-40f3-8480-f03558fa91e1', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/six-arm-cup-plastic-flower-separators-main.png', true, 0, 0, 'Six-Arm Cup Plastic Flower Separators', '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'a16650da-649e-4e95-bdb9-db07d9f842d7', '9ea93086-e56c-40f3-8480-f03558fa91e1', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/six-arm-cup-plastic-flower-separators-closeup.png', false, 1, 1, 'Six-Arm Cup Plastic Flower Separators - Closeup', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '5678a943-551c-4675-99bd-bbe738cb1f85', '9ea93086-e56c-40f3-8480-f03558fa91e1', 'MNB-PF-002-250G', 200, 100, '250 grams', NULL, '250 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '06a49446-23cf-4c77-b1df-0e904c272b67', '9ea93086-e56c-40f3-8480-f03558fa91e1', 'MNB-PF-002-500G', 400, 100, '500 grams', NULL, '500 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '4671de2e-1e13-4495-b4c3-6d342b3fda3e', '9ea93086-e56c-40f3-8480-f03558fa91e1', 'MNB-PF-002-1KG', 800, 100, '1kg', NULL, '1kg', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  'b3641dbe-f819-4a12-8097-68495890c9d1', 'e9dc4845-6e4a-4036-9870-63a890681db8', 'MDF Hand-Painted Kamadhenu Cow Cutouts (Pair)', 'mdf-hand-painted-kamadhenu-cow-cutouts', 'Pair of MDF hand-painted Kamadhenu cow wall cutouts.', 'Traditional hand-painted white Kamadhenu cow cutouts made on premium MDF board. Depicts the sacred cow with gold and red accents, perfect as a pair for door frames and home altars.

[Search Tags: Cow, Kamadhenu, MDF, Wall Hanging, Pair, Wedding, Festival, Home Decor]
[Keywords: kamadhenu cow cutout, mdf cow cutouts, hand-painted cow decor, side door hangings]', 'MNB-DI-002', 75, 98, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/decorative-items/mdf-hand-painted-kamadhenu-cow-cutouts-main.png', 'MDF Hand-Painted Kamadhenu Cow Cutouts (Pair) | Me Nestham', 'Traditional pair of hand-painted MDF Kamadhenu cow cutouts for festive decorations and door side hangings. Shop online at ₹75 only.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '7cec14f6-74d4-4b8e-9f8a-fe6b9140e793', 'b3641dbe-f819-4a12-8097-68495890c9d1', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/decorative-items/mdf-hand-painted-kamadhenu-cow-cutouts-main.png', true, 0, 0, 'MDF Hand-Painted Kamadhenu Cow Cutouts (Pair)', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  'b4dc98a3-7c8b-4c3c-b273-9e758cfba26b', '6a2ef138-fac5-45bd-bc2e-24a7368c6fbb', 'Handcrafted Large Gold Zari Balls (10pcs)', 'handcrafted-large-gold-zari-balls', 'Set of 10 large gold zari balls for heavy garland crafting.', 'Large handcrafted gold zari balls (~4cm diameter). Wrapped with glittering gold threads, ideal for heavy wedding garlands and majestic festival hanging decor.

[Search Tags: Gold, Zari, Ball, Large, Garland, Decoration, Wedding, Festival, Home Decor]
[Keywords: gold zari balls, large zari balls, heavy zari balls, garland accessories]', 'MNB-DB-002', 160, 208, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/decorative-balls/handcrafted-large-gold-zari-balls-main.png', 'Handcrafted Large Gold Zari Balls (Pack of 10) | Me Nestham', 'Premium 4cm large gold zari balls wrapped in thread. Pack of 10 balls for heavy garlands and grand festive decor. Buy online.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'd0781c05-bd05-431f-8856-9ce0d7736bc9', 'b4dc98a3-7c8b-4c3c-b273-9e758cfba26b', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/decorative-balls/handcrafted-large-gold-zari-balls-main.png', true, 0, 0, 'Handcrafted Large Gold Zari Balls (10pcs)', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  '838dc544-8dc4-479a-94f8-ec6feb21c1c3', '07db75af-b331-474d-9918-d6ee6fdf400b', 'Trumpet Lily Shape Plastic Flower Separators', 'trumpet-lily-shape-plastic-flower-separators', 'Lily trumpet shape plastic separators for garland borders.', 'Delicate white plastic flower separators in a lily/trumpet shape. Fits snugly at the ends of garland segments to hold details together.

[Search Tags: Plastic, Separators, Lily, Trumpet, Garland, Spacer, DIY, Craft]
[Keywords: lily separator, trumpet separator, plastic separators, garland end cap]', 'MNB-PF-003', 200, 260, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/trumpet-lily-shape-plastic-flower-separators-main.png', 'Trumpet/Lily Shape Plastic Garland Separators | Me Nestham', 'Flower trumpet/lily shaped plastic separators for garland endings. High durability, lightweight. Available in 250g, 500g, and 1kg.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '5240c437-173f-47e0-885e-ab98b44afa9e', '838dc544-8dc4-479a-94f8-ec6feb21c1c3', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/trumpet-lily-shape-plastic-flower-separators-main.png', true, 0, 0, 'Trumpet Lily Shape Plastic Flower Separators', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '7f59fcf2-ffbe-4e44-8a90-8f6c82ebf243', '838dc544-8dc4-479a-94f8-ec6feb21c1c3', 'MNB-PF-003-250G', 200, 100, '250 grams', NULL, '250 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '64e92e47-b537-434e-bb88-610fcb1c8ed1', '838dc544-8dc4-479a-94f8-ec6feb21c1c3', 'MNB-PF-003-500G', 400, 100, '500 grams', NULL, '500 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'a5aae45e-8b37-49de-86e2-722f2dbf1c83', '838dc544-8dc4-479a-94f8-ec6feb21c1c3', 'MNB-PF-003-1KG', 800, 100, '1kg', NULL, '1kg', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  '21fcaeb1-9190-4230-bcb1-44652b1da9eb', '07db75af-b331-474d-9918-d6ee6fdf400b', 'Eight-Pointed Bud Plastic Flower Separators', 'eight-pointed-bud-plastic-flower-separators', '8-pointed star bud shape plastic separators for garlands.', 'Eight-pointed star bud plastic separators. Excellent spacer components that provide multi-directional support and volume for garlands.

[Search Tags: Plastic, Separators, Bud, Star, Garland, Spacer, DIY, Craft]
[Keywords: star bud separators, 8-pointed separators, plastic flower backing, spacer]', 'MNB-PF-004', 200, 260, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/eight-pointed-bud-plastic-flower-separators-main.png', '8-Pointed Bud Plastic Garland Separators | Me Nestham', 'Standard 8-pointed star bud plastic spacer separators for garland volume. Shop 250g, 500g, and 1kg options at Me Nestham.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'e6f26003-5ae4-4f49-9a4a-53aaf1e6abb8', '21fcaeb1-9190-4230-bcb1-44652b1da9eb', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/eight-pointed-bud-plastic-flower-separators-main.png', true, 0, 0, 'Eight-Pointed Bud Plastic Flower Separators', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '622b48da-1ee2-4332-898f-3ce77c18056d', '21fcaeb1-9190-4230-bcb1-44652b1da9eb', 'MNB-PF-004-250G', 200, 100, '250 grams', NULL, '250 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '5710c572-a0cb-4f02-b1ab-c2dc75f67ce5', '21fcaeb1-9190-4230-bcb1-44652b1da9eb', 'MNB-PF-004-500G', 400, 100, '500 grams', NULL, '500 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'db29e118-de5c-4d5d-9bbb-c73a92c193c2', '21fcaeb1-9190-4230-bcb1-44652b1da9eb', 'MNB-PF-004-1KG', 800, 100, '1kg', NULL, '1kg', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  '8d132ffa-3746-4416-a86a-d514d9183bd2', '07db75af-b331-474d-9918-d6ee6fdf400b', 'Six-Arm Bell Plastic Flower Separators', 'six-arm-bell-plastic-flower-separators', '6-arm bell shape plastic separators for blossom garlands.', 'Traditional six-arm bell shaped plastic separators. Ideal for spacer backings that give a flared blossom look to artificial garland arrangements.

[Search Tags: Plastic, Separators, Bell, Garland, Spacer, DIY, Craft]
[Keywords: bell separators, 6-arm bell, plastic spacer, blossom separators]', 'MNB-PF-005', 200, 260, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/six-arm-bell-plastic-flower-separators-main.png', 'Six-Arm Bell Plastic Garland Separators | Me Nestham', 'Premium six-arm bell shaped plastic separators for floral garland crafts. Weight options: 250g, 500g, 1kg. High-quality production.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '8f473970-7596-4f6e-bf10-acd3b331d7f4', '8d132ffa-3746-4416-a86a-d514d9183bd2', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/six-arm-bell-plastic-flower-separators-main.png', true, 0, 0, 'Six-Arm Bell Plastic Flower Separators', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '0083fb51-9b73-4358-8632-b02b74d342e4', '8d132ffa-3746-4416-a86a-d514d9183bd2', 'MNB-PF-005-250G', 200, 100, '250 grams', NULL, '250 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'f6e32407-a304-42a0-8e48-fde79cbb3871', '8d132ffa-3746-4416-a86a-d514d9183bd2', 'MNB-PF-005-500G', 400, 100, '500 grams', NULL, '500 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'dfbca886-4049-4847-8768-be08aa4a5d9a', '8d132ffa-3746-4416-a86a-d514d9183bd2', 'MNB-PF-005-1KG', 800, 100, '1kg', NULL, '1kg', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  '965bcc54-3288-417c-99a5-0444e05066b9', '07db75af-b331-474d-9918-d6ee6fdf400b', 'Jasmine Shape Plastic Flower Separators', 'jasmine-shape-plastic-flower-separators', '6-petal jasmine shape plastic flower separators for crafts.', 'Elegant six-petal jasmine shape plastic flower separators. Perfect backing shapes for recreating jasmine and bud garland patterns.

[Search Tags: Plastic, Separators, Jasmine, Garland, Spacer, DIY, Craft]
[Keywords: jasmine separators, six-petal jasmine, plastic spacer, jasmine garland parts]', 'MNB-PF-006', 200, 260, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/jasmine-shape-plastic-flower-separators-main.png', 'Jasmine Shape Plastic Garland Separators | Me Nestham', 'Six-petal jasmine design plastic separators for traditional Indian garlands. Buy online in 250g, 500g, and 1kg packs.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  '1ea8ffee-d26d-47b7-a617-a867a82eec68', '965bcc54-3288-417c-99a5-0444e05066b9', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/plastic-flower-parts/jasmine-shape-plastic-flower-separators-main.png', true, 0, 0, 'Jasmine Shape Plastic Flower Separators', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  '608eb1a4-bad8-4557-8f86-e4facbb17d2e', '965bcc54-3288-417c-99a5-0444e05066b9', 'MNB-PF-006-250G', 200, 100, '250 grams', NULL, '250 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'b94f9670-293d-4d22-82ca-bdc8e49eb649', '965bcc54-3288-417c-99a5-0444e05066b9', 'MNB-PF-006-500G', 400, 100, '500 grams', NULL, '500 grams', 100, '2026-07-24T19:08:32.556Z'
);
INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (
  'c8a9c4e4-e126-448b-8c34-f4434749ae84', '965bcc54-3288-417c-99a5-0444e05066b9', 'MNB-PF-006-1KG', 800, 100, '1kg', NULL, '1kg', 100, '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (
  '1f703795-dccf-4ca3-8b8a-b035bc6fa0ad', '4ed2c9f6-b6eb-4f88-8e9e-2156600848fe', 'Kit Cotton Garland Thread No. 10', 'kit-cotton-garland-thread-no-10', 'Heavy duty white cotton garland making thread No. 10.', 'Premium cotton garland making thread (No. 10 size). Strong, smooth, and highly break-resistant. Trusted by professional garland makers across India.

[Search Tags: Threads, Cotton, Garland, Strength, DIY, Craft, Garland Making]
[Keywords: garland thread, cotton thread, thread roll, no 10 thread, heavy duty thread]', 'MNB-TH-001', 30, 39, 100, false, false, true, 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/threads/kit-cotton-garland-thread-no-10-main.png', 'Kit Cotton Garland Thread No. 10 (1 Roll) | Me Nestham', 'Buy strong, break-resistant No. 10 white cotton thread for garland making. Best quality for heavy festive garlands. Only ₹30 per roll.', '2026-07-24T19:08:32.556Z', '2026-07-24T19:08:32.556Z'
);

INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (
  'dcdd9769-9cb7-47c0-a740-4b27a58a79db', '1f703795-dccf-4ca3-8b8a-b035bc6fa0ad', 'https://tqpybretaouglwcgzqvb.supabase.co/storage/v1/object/public/product-images/products/threads/kit-cotton-garland-thread-no-10-main.png', true, 0, 0, 'Kit Cotton Garland Thread No. 10', '2026-07-24T19:08:32.556Z'
);

COMMIT;
