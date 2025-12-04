-- GreenChainz Consolidated Schema
-- Generated: 2025-12-02
-- Includes: Profiles, Suppliers, Products, RFQs, EPDs, Autodesk, Stripe, and RLS prep

-- ============================================
-- Extensions & Types
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('buyer', 'supplier', 'admin');

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE
        typname = 'rfq_status'
) THEN CREATE TYPE rfq_status AS ENUM(
    'pending',
    'answered',
    'closed'
);

END IF;

IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE
        typname = 'verification_status'
) THEN CREATE TYPE verification_status AS ENUM(
    'pending',
    'verified',
    'rejected'
);

END IF;

END $$;

-- ============================================
-- 1. Profiles (User Management)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'buyer',
    company_name TEXT,
    job_title TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    email_verified BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- ============================================
-- 2. Suppliers
-- ============================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, -- Links to the supplier user
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  logo_url TEXT,
  website TEXT,
  verification_status verification_status DEFAULT 'pending',

-- Subscription Fields
tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'standard', 'verified')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT,
  upgraded_at TIMESTAMPTZ,
  product_limit INTEGER DEFAULT 1,
  rfq_limit INTEGER DEFAULT 3,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers (user_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_tier ON public.suppliers (tier);

-- ============================================
-- 3. Products & EPDs
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    material_type TEXT,
    application TEXT,
    certifications TEXT[],
    sustainability_data JSONB,
    specifications JSONB, -- Renamed from specs
    images TEXT[],
    epd_pdf_url TEXT, -- Renamed from epd_url
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products (supplier_id);

CREATE INDEX IF NOT EXISTS idx_products_material_type ON public.products (material_type);

CREATE TABLE IF NOT EXISTS public.epd_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
    gwp NUMERIC,
    metadata JSONB,
    validity_start_date DATE,
    validity_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epd_data_product_id ON public.epd_data (product_id);

-- ============================================
-- 4. RFQs (Request for Quotes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE, -- The Architect/Buyer who created it
    buyer_email TEXT NOT NULL, -- Keep for contact info, but user_id is for ownership
    product_id UUID REFERENCES public.products (id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers (id) ON DELETE SET NULL, -- The target supplier
    message TEXT,
    project_details JSONB,
    status rfq_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfqs_user_id ON public.rfqs (user_id);

CREATE INDEX IF NOT EXISTS idx_rfqs_supplier_id ON public.rfqs (supplier_id);

-- ============================================
-- 5. Autodesk Integration
-- ============================================
CREATE TABLE IF NOT EXISTS public.autodesk_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    autodesk_user_id TEXT,
    autodesk_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.autodesk_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES auth.users (id),
    product_id UUID REFERENCES public.products (id),
    revit_project_urn TEXT,
    revit_material_id TEXT,
    material_name TEXT,
    export_status TEXT,
    error_message TEXT,
    exported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bim_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES auth.users (id),
    model_urn TEXT,
    model_name TEXT,
    total_carbon_kg NUMERIC,
    analysis_data JSONB,
    alternatives JSONB,
    analysis_status TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- 6. Stripe Subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    supplier_id UUID NOT NULL REFERENCES public.suppliers (id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (
        tier IN (
            'free',
            'standard',
            'verified'
        )
    ),
    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    supplier_id UUID REFERENCES public.suppliers (id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions (id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL,
    tier TEXT NOT NULL,
    description TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Helper Functions
-- ============================================

-- Sync Auth User to Profile
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name, last_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer'),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_profile();

-- Get User Role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$;

-- Check if Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$;

-- Get My Supplier ID (for Suppliers)
CREATE OR REPLACE FUNCTION public.get_my_supplier_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_supplier_id UUID;
BEGIN
  SELECT id INTO v_supplier_id FROM public.suppliers WHERE user_id = auth.uid();
  RETURN v_supplier_id;
END;
$$;