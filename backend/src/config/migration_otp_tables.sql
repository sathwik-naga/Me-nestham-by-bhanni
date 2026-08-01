-- Consolidated Email OTP Migration (Phase 2 - 2FA Security Layer)
-- Run this script in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0 CHECK (attempts >= 0),
  resend_count INTEGER DEFAULT 0 CHECK (resend_count >= 0),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_invalidated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON public.email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_user_id ON public.email_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON public.email_otps(expires_at);

-- Automatic Cleanup Function for Expired / Stale OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_email_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_rows INTEGER;
BEGIN
  DELETE FROM public.email_otps
  WHERE expires_at < NOW() - INTERVAL '1 hour'
     OR (is_verified = true AND updated_at < NOW() - INTERVAL '24 hours');
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RETURN deleted_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
