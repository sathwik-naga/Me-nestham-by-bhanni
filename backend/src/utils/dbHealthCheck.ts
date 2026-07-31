import { supabaseAdmin } from '../lib/supabase';
import logger from './logger';

const REQUIRED_TABLES = [
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
  'announcements',
  'variant_options',
  'variant_images'
];

export async function checkDatabaseHealth(): Promise<void> {
  logger.info('Checking database schema health...');
  const missingTables: string[] = [];
  const existingTables: string[] = [];

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabaseAdmin.from(table).select('*').limit(1);
      if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
        missingTables.push(table);
      } else {
        existingTables.push(table);
      }
    } catch {
      missingTables.push(table);
    }
  }

  if (existingTables.length > 0) {
    logger.info(`Database tables checked:`);
    existingTables.forEach(t => logger.info(`  ✓ ${t}`));
  }

  if (missingTables.length > 0) {
    logger.warn(`⚠️ WARNING: Missing database tables:`);
    missingTables.forEach(t => logger.warn(`  - ${t}`));
    logger.warn('Please run the migration script (backend/src/config/migration_recovery_tables.sql) to restore missing tables.');
  } else {
    logger.info('✅ All required database tables are present.');
  }
}
