-- ============================================
-- Add User Subscription Support
-- Migration: 20240523000000_add_user_subscription.sql
-- ============================================

-- Add subscription_tier column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
CHECK (subscription_tier IN ('free', 'architect', 'enterprise'));

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'trialing',
    'unpaid'
  )),
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create audit_credits table
CREATE TABLE IF NOT EXISTS audit_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_audit_credits_user_id ON audit_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_credits_expires_at ON audit_credits(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Create trigger to update updated_at timestamp on subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscriptions_updated_at_trigger ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at_trigger
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE subscriptions IS 'Stores Stripe subscription information for users';
COMMENT ON TABLE audit_credits IS 'Stores audit credits for architect tier subscribers';
COMMENT ON COLUMN users.subscription_tier IS 'User subscription tier: free, architect, or enterprise';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID from checkout.session.completed';
COMMENT ON COLUMN subscriptions.status IS 'Current Stripe subscription status';
COMMENT ON COLUMN subscriptions.current_period_end IS 'End date of current billing period';
COMMENT ON COLUMN subscriptions.trial_ends_at IS 'End date of trial period if applicable';
COMMENT ON COLUMN audit_credits.credits IS 'Number of audit credits available';
COMMENT ON COLUMN audit_credits.expires_at IS 'Expiration date for credits (typically end of billing period)';
