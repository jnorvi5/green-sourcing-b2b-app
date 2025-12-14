-- ==========================================
-- INTEGRATED SYSTEMS: Ranking, Carbon, AI, Verification
-- ==========================================

-- Add location + verification to suppliers
ALTER TABLE suppliers 
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified', -- 'verified' or 'unverified'
  ADD COLUMN IF NOT EXISTS epd_url TEXT,
  ADD COLUMN IF NOT EXISTS epd_expiry DATE,
  ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add location + materials to RFQs
ALTER TABLE rfqs 
  ADD COLUMN IF NOT EXISTS job_site_location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS job_site_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS job_site_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS material_weight_tons DECIMAL(10, 2) DEFAULT 1.0;

-- Carbon calculation tracking
CREATE TABLE IF NOT EXISTS rfq_carbon_calc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  distance_miles DECIMAL(10, 2),
  transport_carbon_kg DECIMAL(10, 2),
  embodied_carbon_kg DECIMAL(10, 2),
  total_carbon_kg DECIMAL(10, 2),
  tier INT, -- 1, 2, 3, or 4
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI agent logs (track all AI usage)
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  rfq_id UUID REFERENCES rfqs(id),
  agent_type VARCHAR(50), -- 'architect_find' or 'supplier_draft'
  input_data JSONB,
  output_data JSONB,
  model_used VARCHAR(50),
  tokens_used INT,
  cost_usd DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Intercom chat sessions
CREATE TABLE IF NOT EXISTS rfq_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_role VARCHAR(20), -- 'architect' or 'supplier'
  intercom_conversation_id VARCHAR(255),
  initiated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rfq_id, user_id)
);

-- Scraped supplier data (before claiming)
CREATE TABLE IF NOT EXISTS supplier_scrapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT,
  company_name VARCHAR(255),
  location VARCHAR(255),
  products JSONB,
  certifications JSONB,
  contact_email VARCHAR(255),
  scraped_at TIMESTAMP DEFAULT NOW(),
  claimed BOOLEAN DEFAULT FALSE,
  claimed_by UUID REFERENCES suppliers(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_location ON suppliers(lat, lng);
CREATE INDEX IF NOT EXISTS idx_suppliers_verification ON suppliers(verification_status);
CREATE INDEX IF NOT EXISTS idx_rfqs_location ON rfqs(job_site_lat, job_site_lng);
CREATE INDEX IF NOT EXISTS idx_carbon_calc_rfq ON rfq_carbon_calc(rfq_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON ai_agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_rfq ON rfq_chat_sessions(rfq_id);

-- Row Level Security
ALTER TABLE rfq_carbon_calc ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Carbon calc visible to RFQ owner + matched suppliers
CREATE POLICY "carbon_calc_access" ON rfq_carbon_calc
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rfqs 
      WHERE rfqs.id = rfq_carbon_calc.rfq_id 
      AND (rfqs.architect_id = auth.uid() OR rfqs.supplier_id = auth.uid())
    )
  );

-- AI logs visible to user who triggered
CREATE POLICY "ai_logs_own" ON ai_agent_logs
  FOR SELECT USING (user_id = auth.uid());

-- Chat sessions visible to participants
CREATE POLICY "chat_sessions_participants" ON rfq_chat_sessions
  FOR SELECT USING (user_id = auth.uid());
