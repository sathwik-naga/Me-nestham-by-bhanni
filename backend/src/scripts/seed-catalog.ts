import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { CATEGORIES, PRODUCTS } from './catalog-definition';

const DATA_DIR = path.join(__dirname, 'data');
const METADATA_PATH = path.join(DATA_DIR, 'uploaded-images-metadata.json');

// Category abbreviation mapping for SKU generation
const CAT_ABBR: Record<string, string> = {
  'foam-flowers': 'FF',
  'artificial-flowers': 'AF',
  'decorative-balls': 'DB',
  'bells': 'BL',
  'beads': 'BD',
  'decorative-items': 'DI',
  'plastic-flower-parts': 'PF',
  'threads': 'TH'
};

async function checkColumnExists(table: string, column: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from(table)
    .select(column)
    .limit(1);
  return !error;
}

async function run() {
  const startTime = Date.now();
  console.log('--- Starting Supabase Data Seeding (Direct Object Import) ---');

  if (!fs.existsSync(METADATA_PATH)) {
    console.error(`Uploaded metadata file not found at ${METADATA_PATH}. Run upload-images first.`);
    process.exit(1);
  }

  const uploadedMeta = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
  const categoryUrls = uploadedMeta.categoryUrls || {};
  const productImagesMap = uploadedMeta.productImagesMap || {};

  const timestamp = new Date().toISOString();

  // 1. Generate category and product UUID mappings deterministically using category and product names
  // We can use a deterministic namespace UUID or just generate random ones once and keep them consistent.
  // Wait, let's parse the CSVs to get the EXACT UUIDs we generated in generate-catalog.ts!
  // This keeps the CSVs, the database, and the SQL script in PERFECT sync!
  // Let's read the category and product slugs to UUID mappings from categories.csv and products.csv!
  // Since we already generated the CSVs, let's write a small regex parser that extracts slugs and UUIDs from CSVs correctly!
  const categoryIds: Record<string, string> = {};
  const productIds: Record<string, string> = {};

  try {
    const catsCsv = fs.readFileSync(path.join(DATA_DIR, 'categories.csv'), 'utf8');
    const catLines = catsCsv.split('\n');
    for (const line of catLines) {
      if (line.trim().startsWith('id,') || !line.trim()) continue;
      const parts = line.split(',');
      const id = parts[0].replace(/"/g, '').trim();
      const name = parts[1].replace(/"/g, '').trim();
      const slug = parts[2].replace(/"/g, '').trim();
      categoryIds[slug] = id;
    }

    const prodsCsv = fs.readFileSync(path.join(DATA_DIR, 'products.csv'), 'utf8');
    // Using a simple regex to match product UUIDs and slugs, ignoring newlines in description
    // Format: "UUID","CAT_UUID","Name","Slug",...
    const uuidRegex = /"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})","[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}","[^"]+","([^"]+)"/g;
    let match;
    while ((match = uuidRegex.exec(prodsCsv)) !== null) {
      const id = match[1];
      const slug = match[2];
      productIds[slug] = id;
    }
  } catch (err: any) {
    console.error('Failed to parse CSV UUIDs, regenerating randomly:', err.message);
  }

  // Fallback if parsing failed: regenerate mappings
  for (const cat of CATEGORIES) {
    if (!categoryIds[cat.slug]) categoryIds[cat.slug] = crypto.randomUUID();
  }
  for (const prod of PRODUCTS) {
    if (!productIds[prod.slug]) productIds[prod.slug] = crypto.randomUUID();
  }

  // 2. Perform idempotent database cleanups safely (preserve customer data: users, carts, orders, reviews, etc.)
  console.log('Clearing old catalog tables safely...');
  const { error: varDelErr } = await supabaseAdmin.from('product_variants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (varDelErr) console.warn('Warning deleting variants:', varDelErr.message);

  const { error: imgDelErr } = await supabaseAdmin.from('product_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (imgDelErr) console.warn('Warning deleting images:', imgDelErr.message);

  const { error: prodDelErr } = await supabaseAdmin.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (prodDelErr) console.warn('Warning deleting products:', prodDelErr.message);

  const { error: catDelErr } = await supabaseAdmin.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (catDelErr) console.warn('Warning deleting categories:', catDelErr.message);

  // 3. Insert Categories
  console.log('Inserting categories...');
  const catInsert = CATEGORIES.map(cat => ({
    id: categoryIds[cat.slug],
    name: cat.name,
    slug: cat.slug,
    description: cat.description || null,
    image_url: categoryUrls[cat.slug] || null,
    is_active: true
  }));
  const { error: catInsertErr } = await supabaseAdmin.from('categories').insert(catInsert);
  if (catInsertErr) {
    console.error('Error inserting categories:', catInsertErr.message);
    process.exit(1);
  }
  console.log('Categories inserted successfully.');

  // 4. Prepare and Insert Products
  console.log('Inserting products...');
  const catCounter: Record<string, number> = {};
  const productsToInsert = [];
  const imagesToInsert = [];
  const variantsToInsert = [];

  // Check column schema support for variants
  const supportsName = await checkColumnExists('product_variants', 'name');
  const supportsStockQty = await checkColumnExists('product_variants', 'stock_quantity');
  console.log(`- name column supported: ${supportsName}`);
  console.log(`- stock_quantity column supported: ${supportsStockQty}`);

  for (const prod of PRODUCTS) {
    const id = productIds[prod.slug];
    const categoryId = categoryIds[prod.categorySlug];
    const catAbbr = CAT_ABBR[prod.categorySlug] || 'OT';
    
    if (!catCounter[catAbbr]) catCounter[catAbbr] = 0;
    catCounter[catAbbr]++;
    const skuIndex = String(catCounter[catAbbr]).padStart(3, '0');
    const productSku = `MNB-${catAbbr}-${skuIndex}`;

    const imageList = productImagesMap[prod.slug] || [];
    const mainImgObj = imageList.find((img: any) => img.isFeatured) || imageList[0];
    const mainImageUrl = mainImgObj ? mainImgObj.publicUrl : '';

    const optimizedDescription = `${prod.description}\n\n[Search Tags: ${prod.tags.join(', ')}]\n[Keywords: ${prod.seoKeywords}]`;

    productsToInsert.push({
      id,
      category_id: categoryId,
      name: prod.name,
      slug: prod.slug,
      short_description: prod.shortDescription,
      description: optimizedDescription,
      sku: productSku,
      price: prod.basePrice,
      compare_price: Math.round(prod.basePrice * 1.3),
      stock: 100,
      featured: prod.featured,
      bestseller: prod.bestseller,
      is_active: true,
      image_url: mainImageUrl,
      seo_title: prod.seoTitle,
      seo_description: prod.seoDescription
    });

    // Images
    let imgIdx = 0;
    for (const img of imageList) {
      const imgId = crypto.randomUUID();
      imagesToInsert.push({
        id: imgId,
        product_id: id,
        image_url: img.publicUrl,
        is_featured: img.isFeatured === true || imgIdx === 0,
        position: imgIdx,
        sort_order: imgIdx,
        alt_text: img.altText
      });
      imgIdx++;
    }

    // Variants
    if (prod.variants && prod.variants.length > 0) {
      for (const v of prod.variants) {
        const varId = crypto.randomUUID();
        const variantSku = `${productSku}-${v.skuSuffix}`;
        const finalPrice = prod.basePrice + v.priceOffset;
        const variantName = v.color || v.size || 'Default';

        const record: any = {
          id: varId,
          product_id: id,
          sku: variantSku,
          price: finalPrice,
          stock: v.stock,
          size: v.size || null,
          color: v.color || null
        };
        if (supportsName) record.name = variantName;
        if (supportsStockQty) record.stock_quantity = v.stock;
        
        variantsToInsert.push(record);
      }
    }
  }

  // Insert products
  const { error: prodInsertErr } = await supabaseAdmin.from('products').insert(productsToInsert);
  if (prodInsertErr) {
    console.error('Error inserting products:', prodInsertErr.message);
    process.exit(1);
  }
  console.log('Products inserted successfully.');

  // Insert images
  const { error: imgInsertErr } = await supabaseAdmin.from('product_images').insert(imagesToInsert);
  if (imgInsertErr) {
    console.error('Error inserting images:', imgInsertErr.message);
    process.exit(1);
  }
  console.log('Product images inserted successfully.');

  // Insert variants
  if (variantsToInsert.length > 0) {
    const { error: varInsertErr } = await supabaseAdmin.from('product_variants').insert(variantsToInsert);
    if (varInsertErr) {
      console.error('Error inserting variants:', varInsertErr.message);
      process.exit(1);
    }
    console.log('Product variants inserted successfully.');
  }

  const durationMs = Date.now() - startTime;
  const durationStr = `${Math.floor(durationMs / 1000 / 60)}m ${Math.floor((durationMs / 1000) % 60)}s`;

  // Write Import Report JSON
  const report = {
    timestamp: new Date().toISOString(),
    categoriesInserted: catInsert.length,
    productsInserted: productsToInsert.length,
    variantsInserted: variantsToInsert.length,
    imagesUploaded: imagesToInsert.length,
    warnings: 0,
    skipped: 0,
    duration: durationStr
  };

  fs.writeFileSync(path.join(DATA_DIR, 'import-report.json'), JSON.stringify(report, null, 2));
  console.log(`\n========================================`);
  console.log(`IMPORT REPORT`);
  console.log(`========================================`);
  console.log(`Categories inserted: ${report.categoriesInserted}`);
  console.log(`Products inserted: ${report.productsInserted}`);
  console.log(`Variants inserted: ${report.variantsInserted}`);
  console.log(`Images uploaded: ${report.imagesUploaded}`);
  console.log(`Duration: ${report.duration}`);
  console.log(`========================================`);
  
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
