-- GreenChainz MVP Schema
-- Updated for Custom Auth & Role Management

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role ENUM types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('architect', 'supplier', 'admin');
    ELSE
        -- Attempt to add values if they don't exist (Postgres 9.1+)
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'architect';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
        -- Note: We are keeping 'buyer' if it exists to avoid errors, but code will use 'architect'
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rfq_status') THEN
        CREATE TYPE rfq_status AS ENUM ('pending', 'responded', 'closed');
    END IF;
END
$$;

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (Custom Auth)
-- Note: If table exists from previous schema, we should alter it or recreate it carefully.
-- For MVP dev, we assume we can create if not exists, but we need the new columns.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- Nullable for OAuth users
    role TEXT NOT NULL CHECK (role IN ('architect', 'supplier', 'admin')), -- Using TEXT with CHECK for flexibility over ENUM sometimes
    full_name TEXT,
    company_name TEXT,

    -- Verification
    email_verified BOOLEAN DEFAULT FALSE,
    verification_code TEXT,
    verification_code_expiry TIMESTAMPTZ,

    -- Corporate Verification
    corporate_verified BOOLEAN DEFAULT FALSE,
    verification_method TEXT, -- 'corporate_email', 'manual', etc.
    trust_score INTEGER DEFAULT 30,

    -- OAuth
    linkedin_id TEXT,
    avatar_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table already existed
DO $$
BEGIN
    ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code_expiry TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS corporate_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_method TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 30;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_id TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
END
$$;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    material_type TEXT,
    application TEXT,
    certifications TEXT[],
    sustainability_data JSONB,
    specs JSONB,
    images TEXT[],
    epd_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link Users to Suppliers (Profile)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- RFQs Table
CREATE TABLE IF NOT EXISTS rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id), -- Changed from buyer_email to buyer_id
    product_id UUID REFERENCES products(id),
    supplier_id UUID,
    message TEXT,
    quantity INTEGER,
    project_details JSONB,
    status rfq_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_linkedin_id ON users(linkedin_id);
