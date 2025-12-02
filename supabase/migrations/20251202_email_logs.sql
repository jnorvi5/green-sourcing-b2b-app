-- =====================================================
-- Email System Database Schema
-- Migration: 20251202_email_logs.sql
-- =====================================================
-- 
-- This migration creates:
-- 1. Enums for email categorization, types, status, and providers
-- 2. email_logs table for tracking all sent emails
-- 3. mailerlite_sync_log table for sync tracking
-- 4. Updates to profiles table for email preferences and MailerLite integration
-- =====================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Email category: transactional vs marketing
CREATE TYPE email_category AS ENUM (
  'transactional',
  'marketing'
);

-- Email types for routing
CREATE TYPE email_type AS ENUM (
  -- Transactional (Zoho Mail)
  'rfq_notification_supplier',
  'rfq_confirmation_buyer',
  'password_reset',
  'account_verification',
  'supplier_approval',
  'supplier_rejection',
  'critical_update',
  -- Marketing (MailerLite)
  'newsletter_weekly',
  'newsletter_monthly',
  'onboarding_sequence',
  'feature_announcement',
  'educational_content'
);

-- Email delivery status
CREATE TYPE email_status AS ENUM (
  'pending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'failed',
  'unsubscribed'
);

-- Email provider
CREATE TYPE email_provider AS ENUM (
  'zoho',
  'mailerlite'
);

-- =============================================================================
-- EMAIL_LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient information
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  
  -- Email metadata
  email_type email_type NOT NULL,
  email_category email_category NOT NULL,
  provider email_provider NOT NULL,
  
  -- Email content
  subject TEXT NOT NULL,
  template_id TEXT,
  template_data JSONB DEFAULT '{}',
  
  -- Delivery tracking
  status email_status NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,
  error_message TEXT,
  
  -- Tracking timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_id ON public.email_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON public.email_logs(provider);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- =============================================================================
-- MAILERLITE_SYNC_LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mailerlite_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sync information
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'user_signup', 'user_update'
  
  -- Statistics
  users_processed INTEGER DEFAULT 0,
  users_added INTEGER DEFAULT 0,
  users_updated INTEGER DEFAULT 0,
  users_removed INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  
  -- Segment breakdown
  architects_active INTEGER DEFAULT 0,
  architects_inactive INTEGER DEFAULT 0,
  architects_trial INTEGER DEFAULT 0,
  suppliers_verified INTEGER DEFAULT 0,
  suppliers_pending INTEGER DEFAULT 0,
  suppliers_rejected INTEGER DEFAULT 0,
  admins INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_details JSONB DEFAULT '[]',
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sync_log queries
CREATE INDEX IF NOT EXISTS idx_mailerlite_sync_log_created_at ON public.mailerlite_sync_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mailerlite_sync_log_status ON public.mailerlite_sync_log(status);

-- =============================================================================
-- PROFILES TABLE UPDATES (Add email preference columns)
-- =============================================================================

-- Add email preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "marketing_emails": true,
  "newsletter_weekly": true,
  "newsletter_monthly": true,
  "product_updates": true,
  "rfq_notifications": true,
  "quote_notifications": true
}'::jsonb;

-- Add MailerLite integration columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mailerlite_subscriber_id TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mailerlite_synced_at TIMESTAMPTZ;

-- Index for MailerLite subscriber lookup
CREATE INDEX IF NOT EXISTS idx_profiles_mailerlite_subscriber_id 
ON public.profiles(mailerlite_subscriber_id) 
WHERE mailerlite_subscriber_id IS NOT NULL;

-- =============================================================================
-- RLS POLICIES FOR EMAIL_LOGS
-- =============================================================================

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
CREATE POLICY "Users can view own email logs"
ON public.email_logs
FOR SELECT
USING (recipient_id = auth.uid());

-- Admins can view all email logs
DROP POLICY IF EXISTS "Admins can view all email logs" ON public.email_logs;
CREATE POLICY "Admins can view all email logs"
ON public.email_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role can insert email logs (for server-side operations)
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;
CREATE POLICY "Service role can insert email logs"
ON public.email_logs
FOR INSERT
WITH CHECK (true);

-- Service role can update email logs
DROP POLICY IF EXISTS "Service role can update email logs" ON public.email_logs;
CREATE POLICY "Service role can update email logs"
ON public.email_logs
FOR UPDATE
USING (true);

-- =============================================================================
-- RLS POLICIES FOR MAILERLITE_SYNC_LOG
-- =============================================================================

-- Enable RLS
ALTER TABLE public.mailerlite_sync_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view sync logs
DROP POLICY IF EXISTS "Admins can view sync logs" ON public.mailerlite_sync_log;
CREATE POLICY "Admins can view sync logs"
ON public.mailerlite_sync_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role can manage sync logs
DROP POLICY IF EXISTS "Service role can manage sync logs" ON public.mailerlite_sync_log;
CREATE POLICY "Service role can manage sync logs"
ON public.mailerlite_sync_log
FOR ALL
USING (true)
WITH CHECK (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_email_logs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for email_logs updated_at
DROP TRIGGER IF EXISTS email_logs_updated_at ON public.email_logs;
CREATE TRIGGER email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_email_logs_updated_at();

-- Function to get email stats for a user
CREATE OR REPLACE FUNCTION public.get_user_email_stats(user_id UUID)
RETURNS TABLE (
  total_emails BIGINT,
  emails_sent BIGINT,
  emails_opened BIGINT,
  emails_clicked BIGINT,
  emails_bounced BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_emails,
    COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered')::BIGINT as emails_sent,
    COUNT(*) FILTER (WHERE status = 'opened')::BIGINT as emails_opened,
    COUNT(*) FILTER (WHERE status = 'clicked')::BIGINT as emails_clicked,
    COUNT(*) FILTER (WHERE status = 'bounced')::BIGINT as emails_bounced
  FROM public.email_logs
  WHERE recipient_id = user_id;
END;
$$;

-- =============================================================================
-- GRANTS
-- =============================================================================

-- Grant access to email_logs
GRANT SELECT ON public.email_logs TO authenticated;
GRANT INSERT, UPDATE ON public.email_logs TO service_role;

-- Grant access to mailerlite_sync_log
GRANT SELECT ON public.mailerlite_sync_log TO authenticated;
GRANT ALL ON public.mailerlite_sync_log TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_user_email_stats TO authenticated;
