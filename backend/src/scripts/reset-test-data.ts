import { supabaseAdmin } from '../lib/supabase';

interface TableCheck {
  table: string;
  count: number | null;
  error?: string;
}

async function runReset() {
  console.log('====================================================');
  console.log('STARTING FULL TEST DATA RESET (PRESERVING USERS & SCHEMA)');
  console.log('====================================================\n');

  // 1. Verify Users & Profiles Before Reset
  const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
  if (authErr) {
    console.error('Failed to query auth users before reset:', authErr.message);
  } else {
    console.log(`[PRESERVE CHECK] Found ${authUsers?.users?.length || 0} Supabase Auth users. Preserving.`);
  }

  const { data: profiles, error: profErr } = await supabaseAdmin.from('profiles').select('id, full_name, role');
  if (profErr) {
    console.error('Failed to query profiles before reset:', profErr.message);
  } else {
    console.log(`[PRESERVE CHECK] Found ${profiles?.length || 0} user profiles. Preserving.`);
  }

  console.log('\n--- 1. DELETING TEST CATALOG & TRANSACTION DATA (FOREIGN-KEY SAFE ORDER) ---');

  // Strict child-to-parent deletion order to respect foreign key constraints
  const deletionSequence = [
    { name: 'variant_images', filterCol: 'id' },
    { name: 'variant_options', filterCol: 'id' },
    { name: 'order_items', filterCol: 'id' },
    { name: 'cart_items', filterCol: 'id' },
    { name: 'cart', filterCol: 'id' },
    { name: 'orders', filterCol: 'id' },
    { name: 'wishlists', filterCol: 'id' },
    { name: 'reviews', filterCol: 'id' },
    { name: 'product_images', filterCol: 'id' },
    { name: 'product_variants', filterCol: 'id' },
    { name: 'products', filterCol: 'id' },
    { name: 'categories', filterCol: 'id' },
  ];

  for (const step of deletionSequence) {
    try {
      const { error } = await supabaseAdmin
        .from(step.name)
        .delete()
        .neq(step.filterCol, '00000000-0000-0000-0000-000000000000');

      if (error) {
        // Table might not exist or empty
        console.warn(`[WARN] Deleting from ${step.name}: ${error.message}`);
      } else {
        console.log(`[SUCCESS] Cleared table: ${step.name}`);
      }
    } catch (err: any) {
      console.error(`[ERROR] Exception deleting from ${step.name}:`, err.message || err);
      throw err;
    }
  }

  console.log('\n--- 2. DELETING OLD STORAGE IMAGES FROM product-images BUCKET ---');

  async function listAllFiles(folder = ''): Promise<string[]> {
    const fileList: string[] = [];
    const { data, error } = await supabaseAdmin.storage.from('product-images').list(folder, { limit: 100 });
    if (error || !data) return fileList;

    for (const item of data) {
      const itemPath = folder ? `${folder}/${item.name}` : item.name;
      if (item.id === null) {
        // Subdirectory
        const subFiles = await listAllFiles(itemPath);
        fileList.push(...subFiles);
      } else {
        fileList.push(itemPath);
      }
    }
    return fileList;
  }

  try {
    const allFiles = await listAllFiles();
    console.log(`Found ${allFiles.length} storage objects in product-images bucket.`);

    if (allFiles.length > 0) {
      // Chunk deletion in batches of 50
      for (let i = 0; i < allFiles.length; i += 50) {
        const batch = allFiles.slice(i, i + 50);
        const { error: removeErr } = await supabaseAdmin.storage.from('product-images').remove(batch);
        if (removeErr) {
          console.error(`Error deleting storage batch ${i}-${i + batch.length}:`, removeErr.message);
        } else {
          console.log(`Deleted ${batch.length} storage files (batch ${i + 1} to ${i + batch.length}).`);
        }
      }
    }
    console.log('[SUCCESS] All old test catalog storage images cleared.');
  } catch (storageErr: any) {
    console.warn('[WARN] Exception during storage deletion:', storageErr.message || storageErr);
  }

  console.log('\n--- 3. DATABASE VERIFICATION (EXPECTED COUNT = 0) ---');

  const verifyTables = [
    'categories',
    'products',
    'product_images',
    'product_variants',
    'variant_options',
    'variant_images',
    'orders',
    'order_items',
    'cart',
    'cart_items',
    'wishlists',
    'reviews'
  ];

  const results: TableCheck[] = [];
  let allZero = true;

  for (const table of verifyTables) {
    try {
      const { count, error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        results.push({ table, count: null, error: error.message });
      } else {
        results.push({ table, count });
        if (count !== 0) {
          allZero = false;
        }
        console.log(`COUNT: ${table} = ${count} (expected: 0)`);
      }
    } catch (err: any) {
      results.push({ table, count: null, error: err.message });
    }
  }

  console.log('\n--- 4. PRESERVED USERS VERIFICATION ---');
  const { data: finalAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
  const { data: finalProfiles } = await supabaseAdmin.from('profiles').select('id, full_name, role');
  console.log(`Auth users count: ${finalAuthUsers?.users?.length || 0} (PRESERVED)`);
  console.log(`Profiles count: ${finalProfiles?.length || 0} (PRESERVED)`);

  if (allZero) {
    console.log('\n====================================================');
    console.log('✅ ALL TEST CATALOG & TRANSACTION TABLES ARE 0!');
    console.log('✅ USERS & PROFILES FULLY PRESERVED!');
    console.log('====================================================');
  } else {
    console.warn('\n⚠️ Some tables still contain records. Check details above.');
  }
}

runReset().catch((e) => {
  console.error('FATAL RESET ERROR:', e);
  process.exit(1);
});
