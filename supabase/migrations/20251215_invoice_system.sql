-- Invoice System for Success Fees
-- Created: 2025-12-15
-- Purpose: Support success fee invoicing when suppliers win RFQs

-- ============================================
-- Table: invoices
-- Purpose: Track success fee invoices for RFQ wins
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  rfq_request_id UUID REFERENCES rfq_requests(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  fee_percentage DECIMAL(5,2) DEFAULT 3.00,
  deal_amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  invoice_hosted_url TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for quick lookups
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_rfq ON invoices(rfq_request_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- ============================================
-- Function: Update invoice updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoices_updated_at ON invoices;

CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_updated_at();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Suppliers can view their own invoices
CREATE POLICY "Suppliers can view their own invoices" 
ON invoices 
FOR SELECT 
USING (
  supplier_id IN (
    SELECT id 
    FROM suppliers 
    WHERE user_id = auth.uid()
  )
);

-- System can manage all invoices
CREATE POLICY "System can manage invoices" 
ON invoices 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices" 
ON invoices 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE invoices IS 'Tracks success fee invoices generated when suppliers win RFQs';
COMMENT ON COLUMN invoices.supplier_id IS 'The supplier being invoiced';
COMMENT ON COLUMN invoices.stripe_invoice_id IS 'Stripe invoice ID for payment processing';
COMMENT ON COLUMN invoices.rfq_request_id IS 'The RFQ that generated this success fee';
COMMENT ON COLUMN invoices.amount_cents IS 'Invoice amount in cents (fee_percentage * deal_amount_cents)';
COMMENT ON COLUMN invoices.fee_percentage IS 'Success fee percentage (default 3%)';
COMMENT ON COLUMN invoices.deal_amount_cents IS 'Total deal value in cents';
COMMENT ON COLUMN invoices.status IS 'Invoice status: draft, open, paid, void, uncollectible';
