import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verify() {
  console.log("==========================================");
  console.log("DATABASE VERIFICATION – RESET STATE");
  console.log("==========================================");

  const tablesToCheck = [
    "categories",
    "products",
    "product_images",
    "product_variants",
    "variant_options",
    "variant_images",
    "orders",
    "order_items",
    "cart",
    "cart_items",
    "wishlists",
    "reviews",
    "promotions",
    "coupons",
    "flash_sales",
    "gift_cards"
  ];

  const results: Record<string, number | string> = {};

  for (const table of tablesToCheck) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      results[table] = `Error: ${error.message} (Code: ${error.code})`;
    } else {
      results[table] = count ?? 0;
    }
  }

  console.log("Catalog & Transaction Tables Count:");
  console.table(results);

  // Check preserved tables
  console.log("\nPreserved Accounts Verification:");
  const { data: profiles, error: pErr } = await supabase.from("profiles").select("id, email, role");
  if (pErr) {
    console.error("Error checking profiles:", pErr.message);
  } else {
    console.log(`Profiles preserved count: ${profiles?.length || 0}`);
    console.table(profiles);
  }

  const { data: authUsers, error: aErr } = await supabase.auth.admin.listUsers();
  if (aErr) {
    console.error("Error listing auth users:", aErr.message);
  } else {
    console.log(`Auth users count: ${authUsers?.users?.length || 0}`);
  }

  // Check Storage
  console.log("\nSupabase Storage Objects Verification:");
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log("Buckets:", buckets?.map(b => b.name));

  const { data: storageFiles, error: sErr } = await supabase.storage
    .from("product-images")
    .list("", { limit: 100 });

  if (sErr) {
    console.error("Storage list error:", sErr.message);
  } else {
    console.log(`Top-level objects in 'product-images' bucket: ${storageFiles?.length || 0}`);
    console.table(storageFiles);
  }
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
