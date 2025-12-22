-- Add location to RFQs
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS job_site_location VARCHAR(255);
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS job_site_lat DECIMAL(10, 8);
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS job_site_lng DECIMAL(11, 8);
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS material_weight_tons DECIMAL(10, 2) DEFAULT 1.0;

-- Add verification and location columns to suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified'));
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS epd_url TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS epd_expiry DATE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS certifications_json JSONB DEFAULT '[]'::JSONB;

-- Carbon tracking
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

-- AI agent logs
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  rfq_id UUID REFERENCES rfqs(id),
  agent_type VARCHAR(50), -- 'architect_find' or 'supplier_draft'
  input_data JSONB,
  output_data JSONB,
  model_used VARCHAR(50),
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
