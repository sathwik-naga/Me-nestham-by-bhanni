import { createClient } from '@supabase/supabase-js';
import env from '../config/env';
import logger from '../utils/logger';

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  logger.error('Supabase URL or Anon Key is missing. Cannot initialize Supabase client.');
  process.exit(1);
}

// Create the Supabase client with the Anon key (respects RLS)
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Create the Supabase Admin client with the Service Role key (bypasses RLS)
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
export const supabaseAdmin = createClient(env.SUPABASE_URL, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

logger.info('Supabase clients initialized successfully.');
