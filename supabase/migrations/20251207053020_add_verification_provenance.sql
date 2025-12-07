-- =====================================================
-- Add Verification Provenance to Profiles
-- Migration: 20251207053020_add_verification_provenance.sql
-- =====================================================

-- Add verification fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS epd_number TEXT,
ADD COLUMN IF NOT EXISTS epd_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS epd_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS epd_data_source TEXT,
ADD COLUMN IF NOT EXISTS carbon_footprint_a1a3 NUMERIC(12,3),
ADD COLUMN IF NOT EXISTS fsc_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bcorp_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS leed_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_source TEXT;

-- Create composite index for verification lookups
CREATE INDEX IF NOT EXISTS idx_profiles_verification 
ON public.profiles (epd_verified, fsc_verified, bcorp_verified, leed_verified);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.epd_number IS 'Environmental Product Declaration registration number';
COMMENT ON COLUMN public.profiles.epd_verified IS 'Whether EPD certification is verified';
COMMENT ON COLUMN public.profiles.epd_verified_at IS 'Timestamp when EPD was verified';
COMMENT ON COLUMN public.profiles.epd_data_source IS 'Source of EPD data (e.g., EPD International, IBU)';
COMMENT ON COLUMN public.profiles.carbon_footprint_a1a3 IS 'Carbon footprint for lifecycle stages A1-A3 (kg CO2e)';
COMMENT ON COLUMN public.profiles.fsc_verified IS 'Whether Forest Stewardship Council certification is verified';
COMMENT ON COLUMN public.profiles.bcorp_verified IS 'Whether B Corporation certification is verified';
COMMENT ON COLUMN public.profiles.leed_verified IS 'Whether LEED certification is verified';
COMMENT ON COLUMN public.profiles.verification_source IS 'Overall verification source or provider';
