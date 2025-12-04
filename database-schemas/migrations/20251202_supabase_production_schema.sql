-- ============================================
-- Migration: Supabase Production Schema
-- Date: 2024-12-02
-- Description: Production-ready schema with UUID PKs, RLS, and performance optimizations
-- ============================================

-- This migration creates the production schema for GreenChainz on Supabase
-- Run this after setting up your Supabase project

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('architect', 'supplier', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE supplier_tier AS ENUM ('free', 'standard', 'verified');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE material_type AS ENUM (
    'insulation', 'flooring', 'cladding', 'roofing', 'structural',
    'glazing', 'finishes', 'hvac', 'plumbing', 'electrical', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rfq_status AS ENUM ('pending', 'responded', 'closed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rfq_response_status AS ENUM ('submitted', 'accepted', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE email_type AS ENUM ('transactional', 'marketing');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE email_provider AS ENUM ('zoho', 'mailerlite', 'resend');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE email_status AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create tables (see supabase_production_schema.sql for full definitions)
-- Note: Run the full schema file for complete table creation

COMMIT;

-- ============================================
-- Post-migration verification queries
-- ============================================

-- Verify extensions
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm');

-- Verify types
SELECT typname FROM pg_type WHERE typname IN (
  'user_role', 'supplier_tier', 'subscription_status', 
  'material_type', 'rfq_status', 'email_status'
);

-- Verify tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'suppliers', 'products', 'epd_data', 'rfqs', 'rfq_responses', 'email_logs');
