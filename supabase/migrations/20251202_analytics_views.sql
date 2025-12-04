-- GreenChainz Analytics Views
-- Generated: 2025-12-02
-- Purpose: Aggregate data for Admin Analytics Dashboard

-- ============================================
-- 1. User Acquisition Views
-- ============================================

-- Daily signups by role
CREATE OR REPLACE VIEW analytics_daily_signups AS
SELECT DATE_TRUNC ('day', created_at) as date, role, COUNT(*) as count
FROM public.profiles
GROUP BY
    1,
    2
ORDER BY 1 DESC;

-- Total users by role
CREATE OR REPLACE VIEW analytics_total_users AS
SELECT role, COUNT(*) as count
FROM public.profiles
GROUP BY
    1;

-- Activation Rate (Suppliers with at least 1 product)
CREATE OR REPLACE VIEW analytics_supplier_activation AS
SELECT
  (SELECT COUNT(DISTINCT supplier_id) FROM public.products) as active_suppliers,
  (SELECT COUNT(*) FROM public.suppliers) as total_suppliers,
  CASE
    WHEN (SELECT COUNT(*) FROM public.suppliers) > 0 THEN
      ROUND(
        ((SELECT COUNT(DISTINCT supplier_id) FROM public.products)::numeric / 
        (SELECT COUNT(*) FROM public.suppliers)::numeric) * 100, 
      2)
    ELSE 0
  END as activation_rate_percent;

-- ============================================
-- 2. Engagement Views
-- ============================================

-- Daily RFQ Volume
CREATE OR REPLACE VIEW analytics_daily_rfqs AS
SELECT DATE_TRUNC ('day', created_at) as date, COUNT(*) as count
FROM public.rfqs
GROUP BY
    1
ORDER BY 1 DESC;

-- RFQ Response Rate
CREATE OR REPLACE VIEW analytics_rfq_response_rate AS
SELECT
  COUNT(*) as total_rfqs,
  COUNT(*) FILTER (WHERE status = 'answered' OR status = 'closed') as responded_rfqs,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE status = 'answered' OR status = 'closed')::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0
  END as response_rate_percent
FROM public.rfqs;

-- ============================================
-- 3. Data Integration Views
-- ============================================

-- EPD Stats
CREATE OR REPLACE VIEW analytics_epd_stats AS
SELECT
  (SELECT COUNT(*) FROM public.products) as total_products,
  (SELECT COUNT(*) FROM public.products WHERE epd_pdf_url IS NOT NULL) as products_with_epd,
  (SELECT COUNT(*) FROM public.epd_data) as total_epd_records,
  CASE
    WHEN (SELECT COUNT(*) FROM public.products) > 0 THEN
      ROUND(
        ((SELECT COUNT(*) FROM public.products WHERE epd_pdf_url IS NOT NULL)::numeric / 
        (SELECT COUNT(*) FROM public.products)::numeric) * 100, 
      2)
    ELSE 0
  END as epd_coverage_percent;

-- Autodesk Stats
CREATE OR REPLACE VIEW analytics_autodesk_stats AS
SELECT (
        SELECT COUNT(*)
        FROM public.autodesk_connections
    ) as total_connections,
    (
        SELECT COUNT(*)
        FROM public.autodesk_exports
    ) as total_exports,
    (
        SELECT COUNT(*)
        FROM public.bim_analyses
    ) as total_analyses;

-- ============================================
-- 4. Email Performance (Logs Table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    recipient_email TEXT NOT NULL,
    subject TEXT,
    template_id TEXT,
    status TEXT NOT NULL CHECK (
        status IN (
            'sent',
            'delivered',
            'opened',
            'clicked',
            'bounced',
            'failed'
        )
    ),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs (status);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs (created_at);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only Admins can view email logs
CREATE POLICY "Admins view email logs" ON public.email_logs FOR
SELECT USING (is_admin ());

-- System can insert (service role) - no policy needed for service role, but good to be explicit if using client
-- We'll assume service role for insertion.

-- Email Stats View
CREATE OR REPLACE VIEW analytics_email_stats AS
SELECT
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'opened') as opened,
  COUNT(*) FILTER (WHERE status = 'clicked') as clicked,
  COUNT(*) FILTER (WHERE status = 'bounced') as bounced,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE status = 'delivered')::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0
  END as delivery_rate,
  CASE
    WHEN COUNT(*) FILTER (WHERE status = 'delivered') > 0 THEN
      ROUND((COUNT(*) FILTER (WHERE status = 'opened')::numeric / COUNT(*) FILTER (WHERE status = 'delivered')::numeric) * 100, 2)
    ELSE 0
  END as open_rate
FROM public.email_logs;