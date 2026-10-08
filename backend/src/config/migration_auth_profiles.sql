-- Migration: 03_auth_profiles_trigger.sql
-- Synchronizes auth.users with public.profiles safely and idempotently

-- 1. Create or replace the handle_new_user trigger function
-- - SECURITY DEFINER: Runs with elevated privileges to insert into public.profiles
-- - SET search_path = public: Prevents search_path injection attacks
-- - ON CONFLICT (id) DO NOTHING: Gracefully handles pre-existing profiles without failing signups
-- - Maps metadata (full_name, phone, avatar_url) from raw_user_meta_data if present
-- - Sets default role 'customer'
-- - Preserves existing table schema (no email column)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    'customer',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Bind trigger to auth.users AFTER INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Dependency-safe Backfill for existing auth.users missing public.profiles
-- - Only inserts profiles that do not already exist
-- - Preserves existing profiles and default role
-- - Does not modify or delete auth.users or authentication credentials
INSERT INTO public.profiles (id, full_name, phone, avatar_url, role, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  COALESCE(u.raw_user_meta_data->>'phone', u.phone),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
  'customer',
  COALESCE(u.created_at, NOW()),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
