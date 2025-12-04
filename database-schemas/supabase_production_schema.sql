-- ============================================
-- GreenChainz Production Supabase Schema
-- ============================================
-- This schema is designed for Supabase PostgreSQL with:
-- - UUID primary keys (Supabase best practice)
-- - Row Level Security (RLS) policies
-- - Triggers for updated_at timestamps
-- - Indexes for performance
-- - Integration with Supabase Auth

-- ============================================
-- EXTENSIONS
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- CUSTOM TYPES (ENUMS)
-- ============================================

-- User roles
CREATE TYPE user_role AS ENUM ('architect', 'supplier', 'admin');

-- Supplier tiers
CREATE TYPE supplier_tier AS ENUM ('free', 'standard', 'verified');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');

-- Material types
CREATE TYPE material_type AS ENUM (
  'insulation',
  'flooring',
  'cladding',
  'roofing',
  'structural',
  'glazing',
  'finishes',
  'hvac',
  'plumbing',
  'electrical',
  'other'
);

-- RFQ status
CREATE TYPE rfq_status AS ENUM ('pending', 'responded', 'closed', 'expired');

-- RFQ response status
CREATE TYPE rfq_response_status AS ENUM ('submitted', 'accepted', 'rejected');

-- Email types
CREATE TYPE email_type AS ENUM ('transactional', 'marketing');

-- Email providers
CREATE TYPE email_provider AS ENUM ('zoho', 'mailerlite', 'resend');

-- Email status
CREATE TYPE email_status AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'architect',
  full_name TEXT,
  company_name TEXT,
  
  -- Enterprise SSO
  azure_ad_id TEXT UNIQUE,
  
  -- Autodesk integration (encrypted at application level)
  autodesk_access_token TEXT,
  autodesk_refresh_token TEXT,
  autodesk_token_expires_at TIMESTAMPTZ,
  
  -- Intercom integration
  intercom_user_id TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  
  -- Subscription
  tier supplier_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status subscription_status DEFAULT 'active',
  
  -- Certifications (JSONB for flexibility)
  certifications JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"type": "FSC", "cert_number": "FSC-C123456", "expiry": "2025-12-31"}]
  
  -- Geographic coverage
  geographic_coverage TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Example: ['US-CA', 'US-OR', 'US-WA']
  
  -- Performance metrics
  total_rfqs_received INTEGER NOT NULL DEFAULT 0,
  total_rfqs_won INTEGER NOT NULL DEFAULT 0,
  avg_response_time_hours NUMERIC(10, 2),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_supplier UNIQUE (user_id),
  CONSTRAINT valid_rfq_counts CHECK (total_rfqs_won <= total_rfqs_received),
  CONSTRAINT valid_response_time CHECK (avg_response_time_hours >= 0)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  
  -- Basic info
  product_name TEXT NOT NULL,
  material_type material_type NOT NULL,
  description TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- EPD linkage
  epd_id UUID REFERENCES epd_data(id) ON DELETE SET NULL,
  
  -- Environmental data
  carbon_footprint_a1a3 NUMERIC(15, 4), -- kg CO2e per unit
  carbon_footprint_total NUMERIC(15, 4), -- kg CO2e per unit
  recycled_content_pct NUMERIC(5, 2) CHECK (recycled_content_pct >= 0 AND recycled_content_pct <= 100),
  
  -- Technical specs
  thermal_conductivity NUMERIC(10, 4), -- R-value
  certifications JSONB DEFAULT '[]'::jsonb,
  
  -- Pricing
  price_per_unit NUMERIC(10, 2),
  unit_type TEXT NOT NULL, -- 'sqft', 'board foot', 'kg', 'm2', etc.
  lead_time_days INTEGER CHECK (lead_time_days >= 0),
  min_order_quantity NUMERIC(10, 2) CHECK (min_order_quantity > 0),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_carbon_footprint CHECK (
    carbon_footprint_a1a3 IS NULL OR carbon_footprint_a1a3 >= -10000
  )
);

-- EPD (Environmental Product Declaration) data
CREATE TABLE IF NOT EXISTS epd_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  epd_number TEXT UNIQUE NOT NULL,
  
  -- Product info
  product_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  
  -- Carbon footprint (kg CO2e)
  gwp_a1a3_kgco2e NUMERIC(15, 4),
  gwp_total_kgco2e NUMERIC(15, 4),
  
  -- Units and standards
  declared_unit TEXT NOT NULL, -- '1 kg', '1 m2', etc.
  pcr_reference TEXT, -- Product Category Rules
  
  -- Validity
  validity_start DATE NOT NULL,
  validity_end DATE NOT NULL,
  
  -- Geographic scope
  geographic_scope TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Source
  data_source TEXT NOT NULL, -- 'EPD International', 'EC3', 'EPD Hub'
  raw_xml TEXT, -- Original ILCD+EPD XML
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (validity_end > validity_start)
);

-- RFQs (Request for Quotes)
CREATE TABLE IF NOT EXISTS rfqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  architect_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Project details
  project_name TEXT NOT NULL,
  project_location TEXT NOT NULL, -- 'Seattle, WA, USA'
  
  -- Material requirements
  material_specs JSONB NOT NULL,
  -- Example: {"quantity": 5000, "unit": "sqft", "material_type": "insulation"}
  
  budget_range TEXT, -- '$50K-$75K'
  delivery_deadline DATE,
  required_certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  message TEXT,
  
  -- Status
  status rfq_status NOT NULL DEFAULT 'pending',
  matched_suppliers UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_deadline CHECK (delivery_deadline IS NULL OR delivery_deadline >= CURRENT_DATE)
);

-- RFQ Responses
CREATE TABLE IF NOT EXISTS rfq_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  
  -- Quote details
  quote_amount NUMERIC(12, 2) NOT NULL CHECK (quote_amount > 0),
  lead_time_days INTEGER NOT NULL CHECK (lead_time_days >= 0),
  message TEXT,
  
  -- Status
  status rfq_response_status NOT NULL DEFAULT 'submitted',
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_rfq_supplier UNIQUE (rfq_id, supplier_id)
);

-- Email logs (for tracking all email communications)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Email details
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  
  -- Classification
  email_type email_type NOT NULL,
  provider email_provider NOT NULL,
  
  -- Status tracking
  status email_status NOT NULL DEFAULT 'sent',
  
  -- Timestamps
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Error tracking
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_azure_ad_id ON users(azure_ad_id) WHERE azure_ad_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_intercom_id ON users(intercom_user_id) WHERE intercom_user_id IS NOT NULL;

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tier ON suppliers(tier);
CREATE INDEX IF NOT EXISTS idx_suppliers_stripe_customer ON suppliers(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_geographic ON suppliers USING GIN(geographic_coverage);
CREATE INDEX IF NOT EXISTS idx_suppliers_certifications ON suppliers USING GIN(certifications);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_material_type ON products(material_type);
CREATE INDEX IF NOT EXISTS idx_products_epd_id ON products(epd_id) WHERE epd_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_carbon_a1a3 ON products(carbon_footprint_a1a3) WHERE carbon_footprint_a1a3 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_carbon_total ON products(carbon_footprint_total) WHERE carbon_footprint_total IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(product_name gin_trgm_ops);

-- EPD data indexes
CREATE INDEX IF NOT EXISTS idx_epd_number ON epd_data(epd_number);
CREATE INDEX IF NOT EXISTS idx_epd_manufacturer ON epd_data(manufacturer);
CREATE INDEX IF NOT EXISTS idx_epd_validity_end ON epd_data(validity_end);
CREATE INDEX IF NOT EXISTS idx_epd_gwp_total ON epd_data(gwp_total_kgco2e) WHERE gwp_total_kgco2e IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_epd_name_trgm ON epd_data USING gin(product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_epd_manufacturer_trgm ON epd_data USING gin(manufacturer gin_trgm_ops);

-- RFQs indexes
CREATE INDEX IF NOT EXISTS idx_rfqs_architect_id ON rfqs(architect_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_product_id ON rfqs(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_at ON rfqs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rfqs_matched_suppliers ON rfqs USING GIN(matched_suppliers);

-- RFQ responses indexes
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq_id ON rfq_responses(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_supplier_id ON rfq_responses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_status ON rfq_responses(status);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_responded_at ON rfq_responses(responded_at DESC);

-- Email logs indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_epd_data_updated_at
  BEFORE UPDATE ON epd_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfqs_updated_at
  BEFORE UPDATE ON rfqs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE epd_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Suppliers policies
CREATE POLICY "Suppliers can view their own data"
  ON suppliers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Suppliers can update their own data"
  ON suppliers FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can view supplier profiles"
  ON suppliers FOR SELECT
  USING (true);

-- Products policies
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Suppliers can manage their own products"
  ON products FOR ALL
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

-- EPD data policies (public read)
CREATE POLICY "Anyone can view EPD data"
  ON epd_data FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify EPD data"
  ON epd_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RFQs policies
CREATE POLICY "Architects can view their own RFQs"
  ON rfqs FOR SELECT
  USING (architect_id = auth.uid());

CREATE POLICY "Architects can create RFQs"
  ON rfqs FOR INSERT
  WITH CHECK (architect_id = auth.uid());

CREATE POLICY "Architects can update their own RFQs"
  ON rfqs FOR UPDATE
  USING (architect_id = auth.uid());

CREATE POLICY "Suppliers can view RFQs they're matched with"
  ON rfqs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE user_id = auth.uid()
      AND id = ANY(rfqs.matched_suppliers)
    )
  );

-- RFQ responses policies
CREATE POLICY "Suppliers can view their own responses"
  ON rfq_responses FOR SELECT
  USING (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can create responses"
  ON rfq_responses FOR INSERT
  WITH CHECK (
    supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Architects can view responses to their RFQs"
  ON rfq_responses FOR SELECT
  USING (
    rfq_id IN (
      SELECT id FROM rfqs WHERE architect_id = auth.uid()
    )
  );

-- Email logs policies (admin only)
CREATE POLICY "Only admins can view email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate similarity between two strings (for fuzzy matching)
CREATE OR REPLACE FUNCTION similarity_score(text1 TEXT, text2 TEXT)
RETURNS NUMERIC AS $$
BEGIN
  RETURN similarity(text1, text2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if EPD is expired
CREATE OR REPLACE FUNCTION is_epd_expired(epd_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  expiry_date DATE;
BEGIN
  SELECT validity_end INTO expiry_date
  FROM epd_data
  WHERE id = epd_id;
  
  RETURN expiry_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to update supplier RFQ metrics
CREATE OR REPLACE FUNCTION update_supplier_rfq_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_rfqs_received when a new RFQ response is created
  IF TG_OP = 'INSERT' THEN
    UPDATE suppliers
    SET total_rfqs_received = total_rfqs_received + 1
    WHERE id = NEW.supplier_id;
    
    -- Update total_rfqs_won if response is accepted
    IF NEW.status = 'accepted' THEN
      UPDATE suppliers
      SET total_rfqs_won = total_rfqs_won + 1
      WHERE id = NEW.supplier_id;
    END IF;
  END IF;
  
  -- Update total_rfqs_won when response status changes to accepted
  IF TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    UPDATE suppliers
    SET total_rfqs_won = total_rfqs_won + 1
    WHERE id = NEW.supplier_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for supplier metrics
CREATE TRIGGER update_supplier_metrics_on_response
  AFTER INSERT OR UPDATE ON rfq_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_rfq_metrics();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Active suppliers with metrics
CREATE OR REPLACE VIEW active_suppliers AS
SELECT 
  s.id,
  s.company_name,
  s.tier,
  s.subscription_status,
  s.total_rfqs_received,
  s.total_rfqs_won,
  CASE 
    WHEN s.total_rfqs_received > 0 
    THEN ROUND((s.total_rfqs_won::NUMERIC / s.total_rfqs_received::NUMERIC) * 100, 2)
    ELSE 0
  END AS win_rate_pct,
  s.avg_response_time_hours,
  s.geographic_coverage,
  COUNT(p.id) AS total_products
FROM suppliers s
LEFT JOIN products p ON s.id = p.supplier_id
WHERE s.subscription_status = 'active'
GROUP BY s.id;

-- View: Valid EPDs (not expired)
CREATE OR REPLACE VIEW valid_epds AS
SELECT *
FROM epd_data
WHERE validity_end >= CURRENT_DATE;

-- View: Products with EPD data
CREATE OR REPLACE VIEW products_with_epd AS
SELECT 
  p.*,
  e.epd_number,
  e.gwp_a1a3_kgco2e,
  e.gwp_total_kgco2e,
  e.validity_end AS epd_expiry
FROM products p
LEFT JOIN epd_data e ON p.epd_id = e.id;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'Core users table extending Supabase auth.users';
COMMENT ON TABLE suppliers IS 'Supplier profiles with subscription and performance metrics';
COMMENT ON TABLE products IS 'Product catalog with environmental data';
COMMENT ON TABLE epd_data IS 'Environmental Product Declarations from multiple sources';
COMMENT ON TABLE rfqs IS 'Request for Quotes from architects to suppliers';
COMMENT ON TABLE rfq_responses IS 'Supplier responses to RFQs';
COMMENT ON TABLE email_logs IS 'Audit log for all email communications';

COMMENT ON COLUMN users.autodesk_access_token IS 'Encrypted at application level before storage';
COMMENT ON COLUMN users.autodesk_refresh_token IS 'Encrypted at application level before storage';
COMMENT ON COLUMN suppliers.certifications IS 'JSONB array of certification objects';
COMMENT ON COLUMN suppliers.geographic_coverage IS 'Array of region codes (e.g., US-CA, US-OR)';
COMMENT ON COLUMN products.certifications IS 'JSONB array of product-specific certifications';
COMMENT ON COLUMN rfqs.material_specs IS 'JSONB object with quantity, unit, and specifications';
