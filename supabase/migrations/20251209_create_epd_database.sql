-- Create a standalone table for caching EPDs from external sources
CREATE TABLE IF NOT EXISTS public.epd_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epd_number TEXT UNIQUE NOT NULL,
    product_name TEXT,
    manufacturer TEXT,
    gwp_fossil_a1a3 NUMERIC,
    recycled_content_pct NUMERIC,
    certifications TEXT[],
    valid_from DATE,
    valid_until DATE,
    raw_data JSONB, -- Store the full original response
    source TEXT DEFAULT 'EPD International',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_epd_database_number ON public.epd_database (epd_number);
CREATE INDEX IF NOT EXISTS idx_epd_database_manufacturer ON public.epd_database (manufacturer);
