-- FIX: Enable RLS on supplier_scrapes
ALTER TABLE supplier_scrapes ENABLE ROW LEVEL SECURITY;

-- FIX: Restrict supplier_scrapes to service_role only (or admin)
-- Since we don't have an admin role explicitly defined in the snippet, 
-- we'll assume service_role for writing (scraper) and potentially reading.
-- For now, allow service_role everything, deny others.
CREATE POLICY "scrapes_service_full" ON supplier_scrapes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FIX: Add missing index on rfq_carbon_calc(supplier_id)
CREATE INDEX IF NOT EXISTS idx_carbon_calc_supplier ON rfq_carbon_calc(supplier_id);

-- FIX: Add GIN index for scraped products queries
CREATE INDEX IF NOT EXISTS idx_scrapes_products ON supplier_scrapes USING GIN (products);
