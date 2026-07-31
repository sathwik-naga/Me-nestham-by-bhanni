import { supabaseAdmin } from '../lib/supabase';

const tables = [
  'categories',
  'products',
  'product_images',
  'product_variants',
  'cart',
  'cart_items',
  'orders',
  'order_items',
  'wishlists',
  'reviews',
  'promotions',
  'coupons',
  'flash_sales',
  'gift_cards',
  'announcements'
];

async function audit() {
  console.log('--- Auditing Supabase Tables ---');
  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Table "${table}" does NOT exist (42P01)`);
        } else {
          console.log(`⚠️ Table "${table}" returned error code ${error.code}: ${error.message}`);
        }
      } else {
        console.log(`✅ Table "${table}" exists!`);
      }
    } catch (e: any) {
      console.log(`💥 Table "${table}" exception: ${e.message}`);
    }
  }
  process.exit(0);
}

audit();
