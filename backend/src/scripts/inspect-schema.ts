import { supabaseAdmin } from '../lib/supabase';

async function inspectSchema() {
  console.log('Querying database tables...');
  
  const tables = ['product_variants', 'cart_items', 'order_items'];
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.error(`Error querying table ${table}:`, error.message);
      } else {
        console.log(`Table ${table} exists! Columns:`, data && data[0] ? Object.keys(data[0]) : '(empty table or keys not readable)');
      }
    } catch (e: any) {
      console.error(`Exception querying table ${table}:`, e.message || e);
    }
  }

  // Check if variant_options or variant_images exist
  const extraTables = ['variant_options', 'variant_images'];
  for (const table of extraTables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table ${table} does NOT exist or error:`, error.message);
      } else {
        console.log(`Table ${table} exists! Columns:`, data && data[0] ? Object.keys(data[0]) : '(empty)');
      }
    } catch (e: any) {
      console.log(`Table ${table} check threw exception:`, e.message || e);
    }
  }
}

inspectSchema();
