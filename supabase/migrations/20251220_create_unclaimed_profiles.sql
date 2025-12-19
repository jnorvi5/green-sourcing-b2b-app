-- Migration: Create Unclaimed Profiles Support
-- Description: Adds is_claimed and claim_token to suppliers, and raw_scraped_data to products.
--              Also adds an RLS policy for unclaimed suppliers.

-- 1. Add columns to suppliers table
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS claim_token UUID;

-- 2. Add raw_scraped_data to products table
-- Note: 'products' table is used for raw/scraped data, while 'catalog_products' might be the curated catalog.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS raw_scraped_data JSONB;

-- 3. Create RLS policy for public read of unclaimed suppliers
-- Note: There may already be a policy allowing public read of all suppliers.
-- This policy ensures unclaimed profiles are explicitly readable.
DROP POLICY IF EXISTS "Public can view unclaimed suppliers" ON public.suppliers;

CREATE POLICY "Public can view unclaimed suppliers"
ON public.suppliers
FOR SELECT
TO public
USING (is_claimed = false);
