-- Migration: Create epd_database table for EPD International API sync
-- Created: 2025-12-07
-- Description: Creates table to store EPD data synced from EPD International API

-- Create epd_database table
CREATE TABLE IF NOT EXISTS epd_database (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- EPD identification
  epd_number TEXT UNIQUE NOT NULL,
  
  -- Product information
  product_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  
  -- Carbon footprint (kg CO2e) - gwp_fossil_a1a3 is the A1-A3 lifecycle stages
  gwp_fossil_a1a3 NUMERIC(15, 4),
  
  -- Recycled content percentage
  recycled_content_pct NUMERIC(5, 2) CHECK (recycled_content_pct >= 0 AND recycled_content_pct <= 100),
  
  -- Certifications (array of certification names)
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Validity period
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  
  -- Additional metadata
  declared_unit TEXT, -- e.g., '1 kg', '1 m2'
  pcr_reference TEXT, -- Product Category Rules reference
  geographic_scope TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Source data
  data_source TEXT NOT NULL DEFAULT 'EPD International',
  raw_data JSONB, -- Store full API response for reference
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_epd_database_epd_number ON epd_database(epd_number);
CREATE INDEX IF NOT EXISTS idx_epd_database_manufacturer ON epd_database(manufacturer);
CREATE INDEX IF NOT EXISTS idx_epd_database_gwp ON epd_database(gwp_fossil_a1a3);
CREATE INDEX IF NOT EXISTS idx_epd_database_valid_until ON epd_database(valid_until);
CREATE INDEX IF NOT EXISTS idx_epd_database_created_at ON epd_database(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_epd_database_search ON epd_database 
  USING gin(to_tsvector('english', product_name || ' ' || manufacturer));

-- Row Level Security (RLS)
ALTER TABLE epd_database ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read EPD data
CREATE POLICY "Anyone can view EPD data"
  ON epd_database FOR SELECT
  USING (true);

-- Only admins can insert/update EPD data
CREATE POLICY "Admins can insert EPD data"
  ON epd_database FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update EPD data"
  ON epd_database FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_epd_database_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_epd_database_updated_at
  BEFORE UPDATE ON epd_database
  FOR EACH ROW
  EXECUTE FUNCTION update_epd_database_updated_at();

-- Comment on table
COMMENT ON TABLE epd_database IS 'Environmental Product Declarations synced from EPD International API';
