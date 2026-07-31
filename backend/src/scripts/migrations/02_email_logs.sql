-- Create email_logs table for transactional email tracking, idempotency, and delivery metrics
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template VARCHAR(100) NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'cancelled')),
    attempts INT NOT NULL DEFAULT 0,
    provider VARCHAR(50) NOT NULL DEFAULT 'resend',
    provider_message_id VARCHAR(255),
    error_message TEXT,
    is_retryable BOOLEAN NOT NULL DEFAULT TRUE,
    html_body TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_idempotency ON email_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template);

-- RLS Policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically. Grant read-only to authenticated admin.
CREATE POLICY admin_select_email_logs ON email_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
