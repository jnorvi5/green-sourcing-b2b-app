-- =====================================================
-- RFQ Matches Table
-- Migration: 20251207_create_rfq_matches.sql
-- Purpose: Store supplier matches for RFQs with match scores
-- =====================================================

-- Create rfq_matches table to store supplier matches for each RFQ
CREATE TABLE IF NOT EXISTS public.rfq_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  
  -- Match scoring
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reason TEXT, -- Description of why this supplier was matched
  
  -- Notification tracking
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  notification_email TEXT, -- Email address where notification was sent
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_rfq_supplier_match UNIQUE (rfq_id, supplier_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rfq_matches_rfq_id ON public.rfq_matches(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_matches_supplier_id ON public.rfq_matches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rfq_matches_score ON public.rfq_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_rfq_matches_notification ON public.rfq_matches(notification_sent) WHERE notification_sent = false;

-- Enable RLS
ALTER TABLE public.rfq_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rfq_matches
-- Architects can view matches for their RFQs
DROP POLICY IF EXISTS "Architects can view matches for their RFQs" ON public.rfq_matches;
CREATE POLICY "Architects can view matches for their RFQs"
ON public.rfq_matches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rfqs
    WHERE rfqs.id = rfq_matches.rfq_id
    AND rfqs.architect_id = auth.uid()
  )
);

-- Suppliers can view their own matches
DROP POLICY IF EXISTS "Suppliers can view their own matches" ON public.rfq_matches;
CREATE POLICY "Suppliers can view their own matches"
ON public.rfq_matches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.suppliers
    WHERE suppliers.id = rfq_matches.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

-- Admins can view all matches
DROP POLICY IF EXISTS "Admins can view all matches" ON public.rfq_matches;
CREATE POLICY "Admins can view all matches"
ON public.rfq_matches
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add comments for documentation
COMMENT ON TABLE public.rfq_matches IS 'Stores supplier matches for RFQs with match scores and notification tracking';
COMMENT ON COLUMN public.rfq_matches.match_score IS 'Match quality score: 100 for exact category match, 50 for partial match';
COMMENT ON COLUMN public.rfq_matches.match_reason IS 'Human-readable explanation of why this supplier was matched';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_rfq_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_rfq_matches_updated_at ON public.rfq_matches;
CREATE TRIGGER update_rfq_matches_updated_at
  BEFORE UPDATE ON public.rfq_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rfq_matches_updated_at();
