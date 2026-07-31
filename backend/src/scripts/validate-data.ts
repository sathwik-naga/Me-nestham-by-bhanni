import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, 'data');

interface ValidationReport {
  timestamp: string;
  success: boolean;
  totalChecks: number;
  failures: string[];
  warnings: string[];
}

async function run() {
  console.log('--- Starting Multi-Point Database Validation ---');
  
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    success: true,
    totalChecks: 0,
    failures: [],
    warnings: []
  };

  function addFailure(msg: string) {
    report.success = false;
    report.failures.push(msg);
    console.error(`❌ FAILURE: ${msg}`);
  }

  function addWarning(msg: string) {
    report.warnings.push(msg);
    console.warn(`⚠️ WARNING: ${msg}`);
  }

  // 1. Fetch all data
  const { data: categories } = await supabaseAdmin.from('categories').select('*');
  const { data: products } = await supabaseAdmin.from('products').select('*');
  const { data: images } = await supabaseAdmin.from('product_images').select('*');
  const { data: variants } = await supabaseAdmin.from('product_variants').select('*');

  const cats = categories || [];
  const prods = products || [];
  const imgs = images || [];
  const vars = variants || [];

  console.log(`Auditing: ${cats.length} categories, ${prods.length} products, ${imgs.length} images, ${vars.length} variants.`);

  // 2. Validate categories
  report.totalChecks++;
  const catSlugs = new Set<string>();
  for (const cat of cats) {
    if (!cat.name) addFailure(`Category ${cat.id} is missing a name`);
    if (!cat.slug) addFailure(`Category ${cat.id} is missing a slug`);
    else {
      if (catSlugs.has(cat.slug)) addFailure(`Duplicate category slug found: ${cat.slug}`);
      catSlugs.add(cat.slug);
    }
  }

  // 3. Validate products
  const prodIds = new Set(prods.map(p => p.id));
  const prodSkus = new Set<string>();
  const prodSlugs = new Set<string>();

  for (const prod of prods) {
    report.totalChecks++;
    
    // Check missing category
    if (!prod.category_id) {
      addFailure(`Product "${prod.name}" (${prod.id}) has no category_id`);
    } else {
      const catExists = cats.some(c => c.id === prod.category_id);
      if (!catExists) addFailure(`Product "${prod.name}" references non-existent category ID: ${prod.category_id}`);
    }

    // Check duplicate slug
    if (!prod.slug) {
      addFailure(`Product "${prod.name}" (${prod.id}) has no slug`);
    } else {
      if (prodSlugs.has(prod.slug)) addFailure(`Duplicate product slug: ${prod.slug}`);
      prodSlugs.add(prod.slug);
    }

    // Check duplicate SKU
    if (!prod.sku) {
      addWarning(`Product "${prod.name}" (${prod.id}) has no SKU`);
    } else {
      if (prodSkus.has(prod.sku)) addFailure(`Duplicate product SKU: ${prod.sku}`);
      prodSkus.add(prod.sku);
    }

    // Check price > 0
    if (prod.price <= 0) {
      addFailure(`Product "${prod.name}" price is ${prod.price} (must be > 0)`);
    }

    // Check stock
    if (prod.stock < 0) {
      addFailure(`Product "${prod.name}" stock is ${prod.stock} (cannot be negative)`);
    }

    // Check missing Alt text or SEO titles
    if (!prod.seo_title) {
      addWarning(`Product "${prod.name}" is missing SEO title`);
    }
    if (!prod.seo_description) {
      addWarning(`Product "${prod.name}" is missing SEO description`);
    }

    // Check featured image existence
    const productImgs = imgs.filter(img => img.product_id === prod.id);
    const hasFeaturedImg = productImgs.some(img => img.is_featured);
    if (productImgs.length > 0 && !hasFeaturedImg) {
      addFailure(`Product "${prod.name}" has images but none are marked as featured`);
    }
    if (!prod.image_url) {
      addFailure(`Product "${prod.name}" is missing main image_url`);
    }
  }

  // 4. Validate images
  const imgUrls = new Set<string>();
  const imgFilenames = new Set<string>();

  for (const img of imgs) {
    report.totalChecks++;
    
    // Check orphaned image
    if (!prodIds.has(img.product_id)) {
      addFailure(`Orphaned image ${img.id} references non-existent product: ${img.product_id}`);
    }

    // Check alt text
    if (!img.alt_text) {
      addWarning(`Image ${img.id} is missing alt_text`);
    }

    // Check duplicate storage paths
    if (imgUrls.has(img.image_url)) {
      addWarning(`Duplicate image URL path: ${img.image_url}`);
    }
    imgUrls.add(img.image_url);

    // Check image filenames
    try {
      const filename = path.basename(new URL(img.image_url).pathname);
      if (imgFilenames.has(filename)) {
        addWarning(`Duplicate image filename in storage: ${filename}`);
      }
      imgFilenames.add(filename);
    } catch (e) {
      addFailure(`Invalid image URL structure: ${img.image_url}`);
    }
  }

  // 5. Validate variants
  const varSkus = new Set<string>();
  for (const v of vars) {
    report.totalChecks++;

    // Check orphaned variant
    if (!prodIds.has(v.product_id)) {
      addFailure(`Orphaned variant ${v.id} references non-existent product: ${v.product_id}`);
    }

    // Check duplicate SKU
    if (varSkus.has(v.sku)) {
      addFailure(`Duplicate variant SKU: ${v.sku}`);
    }
    varSkus.add(v.sku);

    // Check variant price
    const parentProd = prods.find(p => p.id === v.product_id);
    if (parentProd && v.price <= 0) {
      addFailure(`Variant ${v.sku} has invalid price: ${v.price}`);
    }

    // Check variant stock
    if (v.stock < 0) {
      addFailure(`Variant ${v.sku} has negative stock: ${v.stock}`);
    }
  }

  // 6. Test a sample storage URL path
  if (imgs.length > 0) {
    report.totalChecks++;
    const testUrl = imgs[0].image_url;
    console.log(`Verifying sample storage URL: ${testUrl}...`);
    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ Sample image URL returned HTTP 200 OK.`);
      } else {
        addFailure(`Sample image URL returned status ${response.status}: ${testUrl}`);
      }
    } catch (err: any) {
      addFailure(`Failed to fetch sample image URL: ${err.message}`);
    }
  }

  // Save report to data/
  fs.writeFileSync(path.join(DATA_DIR, 'validation-report.json'), JSON.stringify(report, null, 2));

  console.log(`\n========================================`);
  console.log(`VALIDATION SUMMARY`);
  console.log(`========================================`);
  console.log(`Total checks: ${report.totalChecks}`);
  console.log(`Failures: ${report.failures.length}`);
  console.log(`Warnings: ${report.warnings.length}`);
  console.log(`Status: ${report.success ? 'PASSED' : 'FAILED'}`);
  console.log(`========================================`);

  process.exit(report.success ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal validation error:', err);
  process.exit(1);
});
