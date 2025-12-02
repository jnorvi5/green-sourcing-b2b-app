-- Autodesk Platform Services (APS) Integration Schema
-- Created: 2025-12-02
-- Purpose: Support bi-directional integration between GreenChainz and Autodesk Revit

-- ============================================
-- Table: autodesk_connections
-- Purpose: Store OAuth 2.0 tokens for user's Autodesk account
-- ============================================
CREATE TABLE IF NOT EXISTS autodesk_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        autodesk_user_id TEXT,
        autodesk_email TEXT,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (user_id)
);

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_autodesk_connections_user_id ON autodesk_connections (user_id);

CREATE INDEX IF NOT EXISTS idx_autodesk_connections_expires_at ON autodesk_connections (expires_at);

-- ============================================
-- Table: autodesk_exports
-- Purpose: Track material exports from GreenChainz to Revit
-- ============================================
CREATE TABLE IF NOT EXISTS autodesk_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    product_id UUID REFERENCES products (id) ON DELETE SET NULL,
    revit_project_urn TEXT NOT NULL,
    revit_material_id TEXT,
    material_name TEXT NOT NULL,
    export_status TEXT DEFAULT 'pending' CHECK (
        export_status IN (
            'pending',
            'success',
            'failed'
        )
    ),
    error_message TEXT,
    exported_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics and filtering
CREATE INDEX IF NOT EXISTS idx_autodesk_exports_user_id ON autodesk_exports (user_id);

CREATE INDEX IF NOT EXISTS idx_autodesk_exports_product_id ON autodesk_exports (product_id);

CREATE INDEX IF NOT EXISTS idx_autodesk_exports_status ON autodesk_exports (export_status);

CREATE INDEX IF NOT EXISTS idx_autodesk_exports_date ON autodesk_exports (exported_at DESC);

-- ============================================
-- Table: bim_analyses
-- Purpose: Store BIM model carbon analysis results
-- ============================================
CREATE TABLE IF NOT EXISTS bim_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    model_urn TEXT NOT NULL,
    model_name TEXT,
    total_carbon_kg NUMERIC,
    analysis_status TEXT DEFAULT 'processing' CHECK (
        analysis_status IN (
            'processing',
            'completed',
            'failed'
        )
    ),
    analysis_data JSONB,
    -- Structure: { materials: [...], breakdown: {...} }
    alternatives JSONB,
    -- Structure: [{ original_material, alternative, reduction_percent, product_id }]
    error_message TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP
    WITH
        TIME ZONE
);

-- Indexes for querying analyses
CREATE INDEX IF NOT EXISTS idx_bim_analyses_user_id ON bim_analyses (user_id);

CREATE INDEX IF NOT EXISTS idx_bim_analyses_status ON bim_analyses (analysis_status);

CREATE INDEX IF NOT EXISTS idx_bim_analyses_date ON bim_analyses (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bim_analyses_carbon ON bim_analyses (
    total_carbon_kg DESC NULLS LAST
);

-- ============================================
-- Function: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_autodesk_connection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for autodesk_connections
DROP TRIGGER IF EXISTS trigger_autodesk_connections_updated_at ON autodesk_connections;

CREATE TRIGGER trigger_autodesk_connections_updated_at
  BEFORE UPDATE ON autodesk_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_autodesk_connection_updated_at();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE autodesk_connections ENABLE ROW LEVEL SECURITY;

ALTER TABLE autodesk_exports ENABLE ROW LEVEL SECURITY;

ALTER TABLE bim_analyses ENABLE ROW LEVEL SECURITY;

-- autodesk_connections policies
CREATE POLICY "Users can view their own Autodesk connections" ON autodesk_connections FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own Autodesk connections" ON autodesk_connections FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own Autodesk connections" ON autodesk_connections FOR
UPDATE USING (auth.uid () = user_id);

CREATE POLICY "Users can delete their own Autodesk connections" ON autodesk_connections FOR DELETE USING (auth.uid () = user_id);

-- autodesk_exports policies
CREATE POLICY "Users can view their own exports" ON autodesk_exports FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own exports" ON autodesk_exports FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

-- bim_analyses policies
CREATE POLICY "Users can view their own BIM analyses" ON bim_analyses FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Users can insert their own BIM analyses" ON bim_analyses FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Users can update their own BIM analyses" ON bim_analyses FOR
UPDATE USING (auth.uid () = user_id);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON
TABLE autodesk_connections IS 'Stores OAuth 2.0 tokens for Autodesk Platform Services integration';

COMMENT ON
TABLE autodesk_exports IS 'Tracks material exports from GreenChainz to Autodesk Revit projects';

COMMENT ON
TABLE bim_analyses IS 'Stores carbon analysis results for uploaded BIM models';