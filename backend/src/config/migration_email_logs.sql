-- Migration: Create email_logs table to track outgoing mail and status
-- Run this SQL in your Supabase SQL editor to initialize the table.

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  provider TEXT NOT NULL,
  provider_message_id TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0 NOT NULL,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and default policy for admin access
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to email_logs"
  ON public.email_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
