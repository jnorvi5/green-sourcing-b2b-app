-- Create supplier_audits table
CREATE TABLE IF NOT EXISTS supplier_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  audit_result JSONB NOT NULL,
  raw_layout JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_supplier_audits_supplier 
  ON supplier_audits(supplier_name);
  
CREATE INDEX IF NOT EXISTS idx_supplier_audits_created 
  ON supplier_audits(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE supplier_audits ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" 
  ON supplier_audits 
  FOR ALL 
  USING (true);
