import { supabaseAdmin } from "../lib/supabase";

async function backfill() {
  console.log("Starting safe backfill of missing profiles...");

  // 1. Fetch all auth users
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
  if (authErr) {
    console.error("Failed to list auth users:", authErr);
    process.exit(1);
  }
  const authUsers = authData.users;
  console.log(`Found ${authUsers.length} total auth.users.`);

  // 2. Fetch all existing profiles
  const { data: existingProfiles, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("id");
  if (profErr) {
    console.error("Failed to fetch existing profiles:", profErr);
    process.exit(1);
  }
  const existingIds = new Set((existingProfiles || []).map((p: any) => p.id));
  console.log(`Found ${existingIds.size} existing public.profiles.`);

  // 3. Filter users needing profiles
  const missingUsers = authUsers.filter(u => !existingIds.has(u.id));
  console.log(`Identified ${missingUsers.length} auth.users without profiles.`);

  if (missingUsers.length === 0) {
    console.log("No profiles need backfilling.");
    return;
  }

  // 4. Safe insert
  const toInsert = missingUsers.map(u => ({
    id: u.id,
    full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
    phone: u.user_metadata?.phone || u.phone || null,
    avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
    role: "customer",
    created_at: u.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("profiles")
    .upsert(toInsert, { onConflict: "id", ignoreDuplicates: true })
    .select();

  if (insertErr) {
    console.error("Error during profiles backfill:", insertErr);
    process.exit(1);
  }

  console.log(`Successfully backfilled ${inserted?.length || toInsert.length} profiles!`);

  // 5. Validation check
  const { data: finalProfiles } = await supabaseAdmin.from("profiles").select("id, role, full_name");
  console.log(`Total public.profiles now: ${finalProfiles?.length}`);
  console.table(finalProfiles);
}

backfill().catch(console.error);
