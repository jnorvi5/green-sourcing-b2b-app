-- Add geolocation to suppliers
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

-- Add GWP and weight to products for calculations
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS gwp_per_unit DECIMAL(10,4), -- kgCO2e per unit
ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'm3',
ADD COLUMN IF NOT EXISTS kg_per_unit DECIMAL(10,2); -- for transport math

-- Seed a "Founding 50" example for testing (CarbonCure in Charlotte, NC)
UPDATE public.suppliers 
SET latitude = 35.2271, longitude = -80.8431, city = 'Charlotte', state = 'NC'
WHERE name ILIKE '%Metro%'; -- or specific ID

UPDATE public.products
SET gwp_per_unit = 180.50, kg_per_unit = 2400, unit_of_measure = 'm3'
WHERE name ILIKE '%Concrete%';
