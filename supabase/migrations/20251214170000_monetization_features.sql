-- Add to subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS per_unit_price_cents INT;

-- Track pay-per-RFQ usage (separate from subscription)
CREATE TABLE IF NOT EXISTS rfq_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents INT DEFAULT 0, -- $50 = 5000 cents
  total_purchased_cents INT DEFAULT 0,
  last_refill_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Track individual RFQ charges
CREATE TABLE IF NOT EXISTS rfq_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rfq_id UUID REFERENCES rfqs(id),
  amount_cents INT, -- 200, 300, 500 depending on tier
  charge_type VARCHAR(50), -- 'subscription', 'pay_per_rfq', 'deposit'
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track deposits
CREATE TABLE IF NOT EXISTS architect_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deposit_amount_cents INT DEFAULT 5000, -- $50
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'charged', 'refunded'
  stripe_payment_intent_id VARCHAR(255),
  charged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RFQ Usage tracking (referenced in code but not in user's SQL block)
CREATE TABLE IF NOT EXISTS rfq_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  rfq_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);


-- Update subscription_plans with per-unit pricing
UPDATE subscription_plans 
SET per_unit_price_cents = 200 -- $2 per RFQ
WHERE plan_name = 'Free';

UPDATE subscription_plans 
SET per_unit_price_cents = 0
WHERE plan_name = 'Pro';

-- RPC: Subtract balance
CREATE OR REPLACE FUNCTION subtract_balance(user_id UUID, amount INT)
RETURNS INT AS $$
DECLARE
  new_balance INT;
BEGIN
  UPDATE rfq_credits
  SET balance_cents = balance_cents - amount,
      updated_at = NOW()
  WHERE user_id = subtract_balance.user_id
  RETURNING balance_cents INTO new_balance;
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Increment RFQ count
CREATE OR REPLACE FUNCTION increment_count()
RETURNS INT AS $$
BEGIN
  -- This function is intended to be used in an UPSERT or UPDATE where the current value is incremented.
  -- Since we can't easily reference the "current row" in a simple function call without passing the ID,
  -- and use in upsert is specific.
  -- However, user's code uses: rfq_count: supabase.rpc('increment_count')
  -- This implies the RPC returns the NEW value or is used as a value.
  -- But standard Supabase upsert doesn't work like that for fields. 
  -- User's code: rfq_count: supabase.rpc('increment_count') is likely INVALID for a client-side Upsert call 
  -- unless 'increment_count' is a Postgres function that returns a value based on context which is hard.
  -- ACTUALLY: supabase.rpc() calls a function. It returns a Promise. 
  -- The user's code: rfq_count: supabase.rpc('increment_count') 
  -- is putting a Promise into the object passed to .upsert(). THIS IS BUGGY CODE in the user request.
  -- `supabase.rpc` executes an RPC. It doesn't return a value to be used in another query builder chain.
  -- I will FIX this in the TS code to read-then-write or use a proper RPC that handles the upsert.
  -- For now, I will create a simple increment function if needed, but I'll better just handle it in code.
  RETURN 0; 
END;
$$ LANGUAGE plpgsql;

-- Better Approach: Create an RPC to handle the usage update atomically
CREATE OR REPLACE FUNCTION track_rfq_usage(p_user_id UUID, p_period_start DATE, p_period_end DATE)
RETURNS INT AS $$
DECLARE
  new_count INT;
BEGIN
  INSERT INTO rfq_usage (user_id, period_start, period_end, rfq_count)
  VALUES (p_user_id, p_period_start, p_period_end, 1)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET rfq_count = rfq_usage.rfq_count + 1
  RETURNING rfq_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
