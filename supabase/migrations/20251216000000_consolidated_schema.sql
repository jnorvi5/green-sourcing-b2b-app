-- ==============================================================================
-- Migration: Consolidated Schema for GreenChainz
-- Description: Creates tables for Suppliers, Architects, Catalog, Projects, RFQs,
--              Invitations, Quotes, and Transactions.
--              Includes Indexes and RLS Policies.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable pg_trgm for text search (CRITICAL for GIN indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==============================================================================
-- 1. ENUMS (Idempotent creation)
-- ==============================================================================
-- We create these types but use TEXT columns for flexibility, enforcing via CHECK constraints.

DO $$ BEGIN
    CREATE TYPE user_role_new AS ENUM ('admin', 'architect', 'supplier');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status_new AS ENUM ('unverified', 'pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rfq_status_new AS ENUM ('draft', 'open', 'closed', 'awarded', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quote_status AS ENUM ('draft', 'submitted', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. USERS & PROFILES (Architects & Suppliers)
-- ==============================================================================

-- Ensure 'users' table exists (usually linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'architect',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist and add constraints
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'architect',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraint for role (drop first to be idempotent)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'architect', 'supplier'));


-- 2.1 Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_email TEXT,
    phone TEXT,
    website TEXT,
    description TEXT,
    logo_url TEXT,
    address JSONB,
    verification_status TEXT DEFAULT 'unverified',
    tier INTEGER DEFAULT 1,
    rating NUMERIC(3, 2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist in suppliers if table already existed
ALTER TABLE public.suppliers
    ADD COLUMN IF NOT EXISTS contact_email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS address JSONB,
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraint for verification_status
ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS suppliers_verification_status_check;
ALTER TABLE public.suppliers ADD CONSTRAINT suppliers_verification_status_check CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- 2.2 Architects Table (New)
CREATE TABLE IF NOT EXISTS public.architects (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    firm_name TEXT,
    phone TEXT,
    website TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. CATALOG & PRODUCTS
-- ==============================================================================

-- 3.1 Catalog Products (Base product info)
CREATE TABLE IF NOT EXISTS public.catalog_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    brand TEXT,
    images TEXT[],
    specifications JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Product Variants (SKUs, specific versions)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.catalog_products(id) ON DELETE CASCADE,
    sku TEXT,
    name TEXT,
    price NUMERIC(12, 2),
    currency TEXT DEFAULT 'USD',
    attributes JSONB DEFAULT '{}'::jsonb,
    stock_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. PROJECTS & RFQS
-- ==============================================================================

-- 4.1 Projects (Group RFQs)
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    architect_id UUID NOT NULL REFERENCES public.architects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    status TEXT DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 RFQs (Request for Quotes)
CREATE TABLE IF NOT EXISTS public.rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    architect_id UUID NOT NULL REFERENCES public.architects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    due_date TIMESTAMPTZ,
    requirements JSONB,
    budget_min NUMERIC(12, 2),
    budget_max NUMERIC(12, 2),
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist in rfqs if table already existed
ALTER TABLE public.rfqs
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS requirements JSONB,
    ADD COLUMN IF NOT EXISTS budget_min NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS budget_max NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraint for status
ALTER TABLE public.rfqs DROP CONSTRAINT IF EXISTS rfqs_status_check;
ALTER TABLE public.rfqs ADD CONSTRAINT rfqs_status_check CHECK (status IN ('draft', 'open', 'closed', 'awarded', 'archived'));

-- Check if architect_id exists, if not add it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rfqs' AND column_name = 'architect_id') THEN
        ALTER TABLE public.rfqs ADD COLUMN architect_id UUID NOT NULL REFERENCES public.architects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4.3 RFQ Invitations (Which suppliers are invited)
CREATE TABLE IF NOT EXISTS public.rfq_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    UNIQUE(rfq_id, supplier_id)
);

-- 4.4 RFQ Quotes (Responses from Suppliers)
CREATE TABLE IF NOT EXISTS public.rfq_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2),
    currency TEXT DEFAULT 'USD',
    valid_until DATE,
    status TEXT DEFAULT 'submitted',
    message TEXT,
    attachments TEXT[],
    line_items JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add CHECK constraint for quote status
ALTER TABLE public.rfq_quotes DROP CONSTRAINT IF EXISTS rfq_quotes_status_check;
ALTER TABLE public.rfq_quotes ADD CONSTRAINT rfq_quotes_status_check CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected'));

-- ==============================================================================
-- 5. TRANSACTIONS
-- ==============================================================================

-- 5.1 Transactions (Payments/Orders)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES public.rfq_quotes(id),
    buyer_id UUID NOT NULL REFERENCES public.users(id),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add CHECK constraint for transaction status
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

-- ==============================================================================
-- 6. INDEXES
-- ==============================================================================

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_verification ON public.suppliers(verification_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON public.suppliers USING gin(company_name gin_trgm_ops);

-- Catalog
CREATE INDEX IF NOT EXISTS idx_catalog_products_supplier ON public.catalog_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_catalog_products_category ON public.catalog_products(category);
CREATE INDEX IF NOT EXISTS idx_catalog_products_name ON public.catalog_products USING gin(name gin_trgm_ops);

-- Variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_architect ON public.projects(architect_id);

-- RFQs
CREATE INDEX IF NOT EXISTS idx_rfqs_project ON public.rfqs(project_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_architect ON public.rfqs(architect_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_due_date ON public.rfqs(due_date);

-- Invitations
CREATE INDEX IF NOT EXISTS idx_rfq_invitations_rfq ON public.rfq_invitations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_invitations_supplier ON public.rfq_invitations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rfq_invitations_status ON public.rfq_invitations(status);

-- Quotes
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_rfq ON public.rfq_quotes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_supplier ON public.rfq_quotes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_status ON public.rfq_quotes(status);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_quote ON public.transactions(quote_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_supplier ON public.transactions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- ==============================================================================
-- 7. RLS POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 7.0 Users RLS (CRITICAL)
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users AS u WHERE u.id = auth.uid() AND u.role = 'admin')
    );

-- 7.1 Suppliers RLS
DROP POLICY IF EXISTS "Suppliers can insert own profile" ON public.suppliers;
CREATE POLICY "Suppliers can insert own profile" ON public.suppliers
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Suppliers can update own profile" ON public.suppliers;
CREATE POLICY "Suppliers can update own profile" ON public.suppliers
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view suppliers" ON public.suppliers;
CREATE POLICY "Public can view suppliers" ON public.suppliers
    FOR SELECT USING (true);

-- 7.2 Architects RLS
DROP POLICY IF EXISTS "Architects can insert own profile" ON public.architects;
CREATE POLICY "Architects can insert own profile" ON public.architects
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Architects can update own profile" ON public.architects;
CREATE POLICY "Architects can update own profile" ON public.architects
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Architects can view own profile" ON public.architects;
CREATE POLICY "Architects can view own profile" ON public.architects
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can view architects" ON public.architects;
CREATE POLICY "Authenticated users can view architects" ON public.architects
    FOR SELECT USING (auth.role() = 'authenticated');

-- 7.3 Catalog Products RLS
DROP POLICY IF EXISTS "Suppliers can manage own products" ON public.catalog_products;
CREATE POLICY "Suppliers can manage own products" ON public.catalog_products
    FOR ALL USING (supplier_id = auth.uid());

DROP POLICY IF EXISTS "Public can view active products" ON public.catalog_products;
CREATE POLICY "Public can view active products" ON public.catalog_products
    FOR SELECT USING (is_active = true);

-- 7.4 Product Variants RLS
DROP POLICY IF EXISTS "Suppliers can manage own variants" ON public.product_variants;
CREATE POLICY "Suppliers can manage own variants" ON public.product_variants
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.catalog_products WHERE id = product_variants.product_id AND supplier_id = auth.uid())
    );

DROP POLICY IF EXISTS "Public can view variants" ON public.product_variants;
CREATE POLICY "Public can view variants" ON public.product_variants
    FOR SELECT USING (true);

-- 7.5 Projects RLS
DROP POLICY IF EXISTS "Architects can manage own projects" ON public.projects;
CREATE POLICY "Architects can manage own projects" ON public.projects
    FOR ALL USING (architect_id = auth.uid());

DROP POLICY IF EXISTS "Suppliers can view projects for invited RFQs" ON public.projects;
CREATE POLICY "Suppliers can view projects for invited RFQs" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.rfqs
            JOIN public.rfq_invitations ON rfqs.id = rfq_invitations.rfq_id
            WHERE rfqs.project_id = projects.id
            AND rfq_invitations.supplier_id = auth.uid()
        )
    );

-- 7.6 RFQs RLS
DROP POLICY IF EXISTS "Architects can manage own RFQs" ON public.rfqs;
CREATE POLICY "Architects can manage own RFQs" ON public.rfqs
    FOR ALL USING (architect_id = auth.uid());

DROP POLICY IF EXISTS "Invited Suppliers can view RFQs" ON public.rfqs;
CREATE POLICY "Invited Suppliers can view RFQs" ON public.rfqs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.rfq_invitations WHERE rfq_id = rfqs.id AND supplier_id = auth.uid())
        OR status = 'open'
    );

-- 7.7 RFQ Invitations RLS
DROP POLICY IF EXISTS "Architects can manage invitations" ON public.rfq_invitations;
CREATE POLICY "Architects can manage invitations" ON public.rfq_invitations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_invitations.rfq_id AND architect_id = auth.uid())
    );

DROP POLICY IF EXISTS "Suppliers can view own invitations" ON public.rfq_invitations;
CREATE POLICY "Suppliers can view own invitations" ON public.rfq_invitations
    FOR SELECT USING (supplier_id = auth.uid());

DROP POLICY IF EXISTS "Suppliers can update own invitations status" ON public.rfq_invitations;
CREATE POLICY "Suppliers can update own invitations status" ON public.rfq_invitations
    FOR UPDATE USING (supplier_id = auth.uid());

-- 7.8 RFQ Quotes RLS
DROP POLICY IF EXISTS "Suppliers can manage own quotes" ON public.rfq_quotes;
CREATE POLICY "Suppliers can manage own quotes" ON public.rfq_quotes
    FOR ALL USING (supplier_id = auth.uid());

DROP POLICY IF EXISTS "Architects can view quotes for their RFQs" ON public.rfq_quotes;
CREATE POLICY "Architects can view quotes for their RFQs" ON public.rfq_quotes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.rfqs WHERE id = rfq_quotes.rfq_id AND architect_id = auth.uid())
    );

-- 7.9 Transactions RLS
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (buyer_id = auth.uid() OR supplier_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- ==============================================================================
-- 8. TRIGGERS (Updated At & Sync)
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    CREATE TRIGGER update_suppliers_modtime BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_architects_modtime BEFORE UPDATE ON public.architects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_catalog_products_modtime BEFORE UPDATE ON public.catalog_products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_product_variants_modtime BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_rfqs_modtime BEFORE UPDATE ON public.rfqs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_rfq_quotes_modtime BEFORE UPDATE ON public.rfq_quotes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Trigger to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'architect') -- Default role
  ON CONFLICT (id) DO UPDATE SET email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger to ensure it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
