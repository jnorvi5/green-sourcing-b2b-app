-- GreenChainz Scrape & Claim Schema
-- Run this in Supabase SQL Editor

-- 1. Update profiles table for scraped suppliers
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS claim_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS scraped_url TEXT,
ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0; -- 0-100, low = red flag

-- 2. Update products table for unverified data
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'scrape', -- 'scrape' vs 'upload' vs 'verified'
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified', -- 'unverified', 'pending', 'verified'
ADD COLUMN IF NOT EXISTS risk_flags JSONB DEFAULT '[]'::jsonb; -- ['missing_epd', 'no_certifications', etc]

-- 3. Create claim_requests table (track who's claiming what)
CREATE TABLE IF NOT EXISTS claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Index for fast claim lookups
CREATE INDEX IF NOT EXISTS idx_claim_token ON profiles(claim_token);
CREATE INDEX IF NOT EXISTS idx_is_claimed ON profiles(is_claimed);
CREATE INDEX IF NOT EXISTS idx_verification_status ON products(verification_status);

-- 5. View for "High Risk" suppliers (shows on search with red flags)
CREATE OR REPLACE VIEW high_risk_suppliers AS
SELECT 
  p.id,
  p.company_name,
  p.location,
  p.is_claimed,
  p.data_quality_score,
  COUNT(pr.id) as product_count,
  COUNT(pr.id) FILTER (WHERE pr.verification_status = 'unverified') as unverified_count
FROM profiles p
LEFT JOIN products pr ON p.id = pr.supplier_id
WHERE p.role = 'supplier' AND p.is_claimed = FALSE
GROUP BY p.id;

-- 6. Function to generate claim email content
CREATE OR REPLACE FUNCTION generate_claim_email(supplier_uuid UUID)
RETURNS TABLE(email_subject TEXT, email_body TEXT) AS $$
DECLARE
  supplier_name TEXT;
  claim_url TEXT;
BEGIN
  SELECT company_name INTO supplier_name FROM profiles WHERE id = supplier_uuid;
  claim_url := 'https://greenchainz.com/claim?token=' || (SELECT claim_token FROM profiles WHERE id = supplier_uuid);
  
  RETURN QUERY SELECT 
    'Your GreenChainz Profile is Flagged as High Risk'::TEXT,
    format(
      E'Hi %s Team,\n\nYour company profile on GreenChainz is currently flagged as "HIGH RISK" due to missing verification data.\n\nArchitects viewing your profile see:\n❌ Unverified EPD data\n❌ Missing certifications\n❌ Low sustainability score\n\nThis affects your project eligibility for LEED, Buy Clean, and other green procurement programs.\n\nClaim your profile now to fix your score:\n%s\n\nOnce claimed, you can:\n✅ Upload EPDs and certifications\n✅ Verify product carbon data\n✅ Improve your sustainability score\n✅ Get discovered by 200+ architects\n\n- GreenChainz Team',
      supplier_name,
      claim_url
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE claim_requests IS 'Tracks supplier claim verification requests';
COMMENT ON COLUMN profiles.is_claimed IS 'FALSE = scraped/unclaimed, TRUE = owner verified';
COMMENT ON COLUMN profiles.data_quality_score IS '0-100 score, <30 = red flag on search results';
COMMENT ON COLUMN products.verification_status IS 'unverified = scraped, pending = uploaded awaiting review, verified = GreenChainz approved';
