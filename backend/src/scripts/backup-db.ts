import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  console.log('--- Starting Database Backup ---');
  
  const tables = ['categories', 'products', 'product_images', 'product_variants'];
  let sqlContent = `-- Database Backup - Me Nestham By Bhanni\n`;
  sqlContent += `-- Generated: ${new Date().toISOString()}\n\n`;
  
  // Disable foreign keys temporarily during restore if needed
  sqlContent += `SET session_replication_role = 'replica';\n\n`;

  const outputDir = path.join(__dirname, 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const table of tables) {
    console.log(`Backing up table: ${table}...`);
    sqlContent += `-- Table: public.${table}\n`;
    sqlContent += `DELETE FROM public.${table};\n`;

    const { data: rows, error } = await supabaseAdmin.from(table).select('*');
    if (error) {
      console.error(`Error fetching table ${table}:`, error.message);
      process.exit(1);
    }

    if (rows && rows.length > 0) {
      const keys = Object.keys(rows[0]);
      
      for (const row of rows) {
        const valuesStr = keys.map(k => {
          const val = row[k];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'string') {
            // Escape single quotes for SQL insertion
            return `'${val.replace(/'/g, "''")}'`;
          }
          if (typeof val === 'object') {
            return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          }
          if (val instanceof Date) {
            return `'${val.toISOString()}'`;
          }
          return val;
        }).join(', ');

        sqlContent += `INSERT INTO public.${table} (${keys.join(', ')}) VALUES (${valuesStr});\n`;
      }
    }
    sqlContent += `\n`;
  }

  sqlContent += `SET session_replication_role = 'origin';\n`;

  const backupPath = path.join(outputDir, 'backup_before_catalog.sql');
  fs.writeFileSync(backupPath, sqlContent);
  console.log(`Backup completed successfully! Saved to: ${backupPath}`);
  process.exit(0);
}

run();
