-- Stripe Subscription Billing Schema
-- Created: 2025-12-02
-- Purpose: Support 3-tier subscription system (Free, Standard, Verified)

-- ============================================
-- Update suppliers table with subscription fields
-- ============================================
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (
    tier IN (
        'free',
        'standard',
        'verified'
    )
);

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS subscription_status TEXT;

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMP
WITH
    TIME ZONE;

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS product_limit INTEGER DEFAULT 1;

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS rfq_limit INTEGER DEFAULT 3;

-- Indexes for subscription queries
CREATE INDEX IF NOT EXISTS idx_suppliers_tier ON suppliers (tier);

CREATE INDEX IF NOT EXISTS idx_suppliers_stripe_customer ON suppliers (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_subscription_status ON suppliers (subscription_status);

-- ============================================
-- Table: subscriptions
-- Purpose: Track subscription details and history
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    supplier_id UUID NOT NULL REFERENCES suppliers (id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (
        tier IN (
            'free',
            'standard',
            'verified'
        )
    ),
    status TEXT NOT NULL,
    current_period_start TIMESTAMP
    WITH
        TIME ZONE,
        current_period_end TIMESTAMP
    WITH
        TIME ZONE,
        cancel_at_period_end BOOLEAN DEFAULT false,
        canceled_at TIMESTAMP
    WITH
        TIME ZONE,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Indexes for subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_supplier_id ON subscriptions (supplier_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions (stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions (current_period_end);

-- ============================================
-- Table: payments
-- Purpose: Log all payment transactions for revenue tracking
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    supplier_id UUID REFERENCES suppliers (id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions (id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL,
    tier TEXT NOT NULL,
    description TEXT,
    paid_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Indexes for payment analytics
CREATE INDEX IF NOT EXISTS idx_payments_supplier_id ON payments (supplier_id);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);

CREATE INDEX IF NOT EXISTS idx_payments_tier ON payments (tier);

CREATE INDEX IF NOT EXISTS idx_payments_date ON payments (paid_at DESC);

-- ============================================
-- Function: Update subscription updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;

CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- ============================================
-- Function: Update supplier limits based on tier
-- ============================================
CREATE OR REPLACE FUNCTION update_supplier_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Set limits based on tier
  IF NEW.tier = 'free' THEN
    NEW.product_limit = 1;
    NEW.rfq_limit = 3;
  ELSIF NEW.tier = 'standard' THEN
    NEW.product_limit = 10;
    NEW.rfq_limit = 999999; -- Unlimited
  ELSIF NEW.tier = 'verified' THEN
    NEW.product_limit = 999999; -- Unlimited
    NEW.rfq_limit = 999999; -- Unlimited
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_supplier_limits ON suppliers;

CREATE TRIGGER trigger_supplier_limits
  BEFORE INSERT OR UPDATE OF tier ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_limits();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Suppliers can view their own subscriptions" ON subscriptions FOR
SELECT USING (
        supplier_id IN (
            SELECT id
            FROM suppliers
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "System can manage subscriptions" ON subscriptions FOR ALL USING (true)
WITH
    CHECK (true);

-- Payments policies
CREATE POLICY "Suppliers can view their own payments" ON payments FOR
SELECT USING (
        supplier_id IN (
            SELECT id
            FROM suppliers
            WHERE
                user_id = auth.uid ()
        )
    );

CREATE POLICY "System can manage payments" ON payments FOR ALL USING (true)
WITH
    CHECK (true);

-- ============================================
-- Views for analytics
-- ============================================

-- Monthly Recurring Revenue (MRR)
CREATE OR REPLACE VIEW mrr_by_tier AS
SELECT
    tier,
    COUNT(*) as subscriber_count,
    CASE
        WHEN tier = 'standard' THEN COUNT(*) * 9900
        WHEN tier = 'verified' THEN COUNT(*) * 29900
        ELSE 0
    END as mrr_cents
FROM suppliers
WHERE
    tier != 'free'
    AND subscription_status = 'active'
GROUP BY
    tier;

-- Churn rate (last 30 days)
CREATE OR REPLACE VIEW churn_last_30_days AS
SELECT 
  COUNT(*) as churned_count,
  (SELECT COUNT(*) FROM suppliers WHERE tier != 'free') as total_paid_suppliers,
  ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM suppliers WHERE tier != 'free'), 0) * 100, 2) as churn_rate_percent
FROM subscriptions
WHERE canceled_at >= NOW() - INTERVAL '30 days';

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON
TABLE subscriptions IS 'Tracks Stripe subscription details for suppliers';

COMMENT ON
TABLE payments IS 'Logs all payment transactions for revenue tracking and analytics';

COMMENT ON COLUMN suppliers.tier IS 'Subscription tier: free, standard, or verified';

COMMENT ON COLUMN suppliers.product_limit IS 'Maximum number of products allowed for this tier';

COMMENT ON COLUMN suppliers.rfq_limit IS 'Maximum number of RFQs per month for this tier';