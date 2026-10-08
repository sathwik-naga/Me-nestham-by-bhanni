import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("Checking Supabase Auth Users and Profiles...");

  const { data: authData, error: aErr } = await supabase.auth.admin.listUsers();
  if (aErr) {
    console.error("Error fetching auth users:", aErr);
    return;
  }
  const authUsers = authData.users;
  console.log(`Total auth.users: ${authUsers.length}`);

  const { data: profiles, error: pErr } = await supabase.from("profiles").select("*");
  if (pErr) {
    console.error("Error fetching profiles:", pErr);
    return;
  }
  console.log(`Total public.profiles: ${profiles.length}`);

  console.log("\nAuth Users:");
  authUsers.forEach(u => console.log(`- ${u.id} | ${u.email} | created: ${u.created_at}`));

  console.log("\nProfiles:");
  profiles.forEach(p => console.log(`- ${p.id} | role: ${p.role} | name: ${p.full_name}`));

  const profileIds = new Set(profiles.map(p => p.id));
  const authIds = new Set(authUsers.map(u => u.id));

  const authWithoutProfiles = authUsers.filter(u => !profileIds.has(u.id));
  const profilesWithoutAuth = profiles.filter(p => !authIds.has(p.id));

  console.log(`\nAuth users without profiles: ${authWithoutProfiles.length}`);
  authWithoutProfiles.forEach(u => console.log(`  MISSING: ${u.id} (${u.email})`));

  console.log(`\nProfiles without auth users: ${profilesWithoutAuth.length}`);
  profilesWithoutAuth.forEach(p => console.log(`  EXTRA: ${p.id}`));
}

run().catch(console.error);
