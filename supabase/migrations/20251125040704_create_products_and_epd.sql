-- Migration to align with GreenChainz Master Spec: Separation of Physical vs. Environmental Data.

-- Step 1: Rename columns in the 'products' table for clarity and consistency.
ALTER TABLE public.products RENAME COLUMN technical_specs TO specifications;
ALTER TABLE public.products RENAME COLUMN epd_link TO epd_pdf_url;

-- Step 2: Create the new 'epd_data' table to store detailed environmental data.
-- This separates environmental data from the main products table to improve performance
-- and allows for tracking certification history.
CREATE TABLE public.epd_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    gwp NUMERIC,
    metadata JSONB,
    validity_start_date DATE,
    validity_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Add an index to the new table for efficient querying.
CREATE INDEX idx_epd_data_product_id ON public.epd_data(product_id);
