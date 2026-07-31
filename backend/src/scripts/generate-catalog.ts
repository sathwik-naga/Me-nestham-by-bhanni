import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { CATEGORIES, PRODUCTS, CategoryDef, ProductDef, VariantDef } from './catalog-definition';

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADED_METADATA_PATH = path.join(DATA_DIR, 'uploaded-images-metadata.json');

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

function formatCsvCell(val: any): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  // Double-quote value and escape inner quotes by doubling them
  return `"${str.replace(/"/g, '""')}"`;
}

async function run() {
  console.log('--- Generating CSV and SQL Seed Files ---');

  if (!fs.existsSync(UPLOADED_METADATA_PATH)) {
    console.error(`Uploaded metadata file not found at ${UPLOADED_METADATA_PATH}. Run upload-images first.`);
    process.exit(1);
  }

  const uploadedMeta = JSON.parse(fs.readFileSync(UPLOADED_METADATA_PATH, 'utf8'));
  const categoryUrls = uploadedMeta.categoryUrls || {};
  const productImagesMap = uploadedMeta.productImagesMap || {};

  // Track counts for the final import report
  let categoryCount = 0;
  let productCount = 0;
  let variantCount = 0;
  let imageCount = 0;

  // Generate deterministic/consistent UUID mappings
  const categoryIds: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    categoryIds[cat.slug] = crypto.randomUUID();
  }

  const productIds: Record<string, string> = {};
  for (const prod of PRODUCTS) {
    productIds[prod.slug] = crypto.randomUUID();
  }

  const timestamp = new Date().toISOString();

  // CSV Builders
  let categoriesCsv = 'id,name,slug,description,image_url,is_active,created_at,updated_at\n';
  let productsCsv = 'id,category_id,name,slug,short_description,description,sku,price,compare_price,stock,featured,bestseller,is_active,image_url,seo_title,seo_description,created_at,updated_at\n';
  let variantsCsv = 'id,product_id,sku,price,stock,size,color,name,stock_quantity,created_at\n';
  let imagesCsv = 'id,product_id,image_url,is_featured,position,sort_order,alt_text,created_at\n';

  // SQL Builder
  let sqlScript = `-- Supabase Catalog Insertion Script\n`;
  sqlScript += `-- Generated: ${timestamp}\n\n`;
  sqlScript += `-- Align product_variants table columns with backend code first\n`;
  sqlScript += `ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS name TEXT;\n`;
  sqlScript += `ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;\n\n`;
  
  // Safe transaction cleanups (avoid touching users, orders, carts, etc.)
  sqlScript += `BEGIN;\n\n`;
  sqlScript += `-- Clean existing catalog tables only\n`;
  sqlScript += `DELETE FROM public.product_variants;\n`;
  sqlScript += `DELETE FROM public.product_images;\n`;
  sqlScript += `DELETE FROM public.products;\n`;
  sqlScript += `DELETE FROM public.categories;\n\n`;

  // 1. Process Categories
  console.log('Generating category rows...');
  for (const cat of CATEGORIES) {
    const id = categoryIds[cat.slug];
    const imageUrl = categoryUrls[cat.slug] || '';
    
    categoriesCsv += [
      id,
      cat.name,
      cat.slug,
      cat.description,
      imageUrl,
      'true',
      timestamp,
      timestamp
    ].map(formatCsvCell).join(',') + '\n';

    sqlScript += `INSERT INTO public.categories (id, name, slug, description, image_url, is_active, created_at, updated_at) VALUES (\n`;
    sqlScript += `  '${id}', '${cat.name}', '${cat.slug}', '${cat.description}', ${imageUrl ? `'${imageUrl}'` : 'NULL'}, true, '${timestamp}', '${timestamp}'\n`;
    sqlScript += `) ON CONFLICT (id) DO UPDATE SET\n`;
    sqlScript += `  name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, image_url = EXCLUDED.image_url, updated_at = EXCLUDED.updated_at;\n\n`;
    
    categoryCount++;
  }

  // Abbreviation tracking for numbering SKUs
  const catCounter: Record<string, number> = {};

  // 2. Process Products, Images, and Variants
  console.log('Generating product, variant, and image rows...');
  for (const prod of PRODUCTS) {
    const id = productIds[prod.slug];
    const categoryId = categoryIds[prod.categorySlug];
    const catAbbr = CAT_ABBR[prod.categorySlug] || 'OT';
    
    // Auto-increment product SKU
    if (!catCounter[catAbbr]) catCounter[catAbbr] = 0;
    catCounter[catAbbr]++;
    const skuIndex = String(catCounter[catAbbr]).padStart(3, '0');
    const productSku = `MNB-${catAbbr}-${skuIndex}`;

    // Get main image URL
    const imageList = productImagesMap[prod.slug] || [];
    const mainImgObj = imageList.find((img: any) => img.isFeatured) || imageList[0];
    const mainImageUrl = mainImgObj ? mainImgObj.publicUrl : '';

    // Search optimization field: combine name, tags, category name, and keywords
    const keywordsStr = `${prod.name} ${prod.tags.join(' ')} ${prod.categorySlug.replace('-', ' ')} ${prod.seoKeywords}`;
    const optimizedDescription = `${prod.description}\n\n[Search Tags: ${prod.tags.join(', ')}]\n[Keywords: ${prod.seoKeywords}]`;

    // Write product CSV row
    productsCsv += [
      id,
      categoryId,
      prod.name,
      prod.slug,
      prod.shortDescription,
      optimizedDescription,
      productSku,
      prod.basePrice,
      Math.round(prod.basePrice * 1.3), // compare_price (+30% markup)
      100, // stock default
      prod.featured ? 'true' : 'false',
      prod.bestseller ? 'true' : 'false',
      'true', // is_active
      mainImageUrl,
      prod.seoTitle,
      prod.seoDescription,
      timestamp,
      timestamp
    ].map(formatCsvCell).join(',') + '\n';

    sqlScript += `INSERT INTO public.products (id, category_id, name, slug, short_description, description, sku, price, compare_price, stock, featured, bestseller, is_active, image_url, seo_title, seo_description, created_at, updated_at) VALUES (\n`;
    sqlScript += `  '${id}', '${categoryId}', '${prod.name}', '${prod.slug}', '${prod.shortDescription}', '${optimizedDescription.replace(/'/g, "''")}', '${productSku}', ${prod.basePrice}, ${Math.round(prod.basePrice * 1.3)}, 100, ${prod.featured}, ${prod.bestseller}, true, '${mainImageUrl}', '${prod.seoTitle.replace(/'/g, "''")}', '${prod.seoDescription.replace(/'/g, "''")}', '${timestamp}', '${timestamp}'\n`;
    sqlScript += `);\n\n`;

    productCount++;

    // 3. Process Product Images
    let imgIdx = 0;
    for (const img of imageList) {
      const imgId = crypto.randomUUID();
      const sortOrder = imgIdx;
      
      imagesCsv += [
        imgId,
        id,
        img.publicUrl,
        img.isFeatured ? 'true' : 'false',
        imgIdx,
        sortOrder,
        img.altText,
        timestamp
      ].map(formatCsvCell).join(',') + '\n';

      sqlScript += `INSERT INTO public.product_images (id, product_id, image_url, is_featured, position, sort_order, alt_text, created_at) VALUES (\n`;
      sqlScript += `  '${imgId}', '${id}', '${img.publicUrl}', ${img.isFeatured}, ${imgIdx}, ${sortOrder}, '${img.altText.replace(/'/g, "''")}', '${timestamp}'\n`;
      sqlScript += `);\n`;

      imgIdx++;
      imageCount++;
    }
    sqlScript += `\n`;

    // 4. Process Product Variants
    if (prod.variants && prod.variants.length > 0) {
      let varIdx = 0;
      for (const v of prod.variants) {
        const varId = crypto.randomUUID();
        const variantSku = `${productSku}-${v.skuSuffix}`;
        const finalPrice = prod.basePrice + v.priceOffset;
        const variantName = v.color || v.size || 'Default';
        
        variantsCsv += [
          varId,
          id,
          variantSku,
          finalPrice,
          v.stock,
          v.size || '',
          v.color || '',
          variantName,
          v.stock, // stock_quantity
          timestamp
        ].map(formatCsvCell).join(',') + '\n';

        sqlScript += `INSERT INTO public.product_variants (id, product_id, sku, price, stock, size, color, name, stock_quantity, created_at) VALUES (\n`;
        sqlScript += `  '${varId}', '${id}', '${variantSku}', ${finalPrice}, ${v.stock}, ${v.size ? `'${v.size}'` : 'NULL'}, ${v.color ? `'${v.color}'` : 'NULL'}, '${variantName}', ${v.stock}, '${timestamp}'\n`;
        sqlScript += `);\n`;

        varIdx++;
        variantCount++;
      }
      sqlScript += `\n`;
    }
  }

  sqlScript += `COMMIT;\n`;

  // Write all CSV files
  fs.writeFileSync(path.join(DATA_DIR, 'categories.csv'), categoriesCsv);
  fs.writeFileSync(path.join(DATA_DIR, 'products.csv'), productsCsv);
  fs.writeFileSync(path.join(DATA_DIR, 'product_variants.csv'), variantsCsv);
  fs.writeFileSync(path.join(DATA_DIR, 'product_images.csv'), imagesCsv);
  
  // Write SQL script
  fs.writeFileSync(path.join(DATA_DIR, 'insert_catalog.sql'), sqlScript);

  console.log(`CSV files generated successfully inside data/ folder:`);
  console.log(`- categories.csv (${categoryCount} records)`);
  console.log(`- products.csv (${productCount} records)`);
  console.log(`- product_variants.csv (${variantCount} records)`);
  console.log(`- product_images.csv (${imageCount} records)`);
  console.log(`- insert_catalog.sql`);

  // Write temporary stats so Seeding script can generate a detailed log report
  fs.writeFileSync(
    path.join(DATA_DIR, 'temp-generation-stats.json'),
    JSON.stringify({ categoryCount, productCount, variantCount, imageCount }, null, 2)
  );

  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error during file generation:', err);
  process.exit(1);
});
