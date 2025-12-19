-- Migration: Database Indexing Strategy
-- Description: Optimizes search and filtering for products (specifically for 10k+ scale).
--              Addresses requirements for trigram search, GWP sorting, and category/location filtering.

-- 1. Enable pg_trgm for Trigram Search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN Index on product_name (mapped to 'name')
--    This enables fast fuzzy search and pattern matching (LIKE '%term%')
CREATE INDEX IF NOT EXISTS idx_products_name_gin ON public.products USING gin (name gin_trgm_ops);

-- 3. Index on gwp_per_unit for sorting
--    Mapped to 'sustainability_data->gwp' (casted to numeric for correct sorting)
--    Note: 20251206 migration added index on 'carbon_footprint', but we add 'gwp' to be safe/exact.
CREATE INDEX IF NOT EXISTS idx_products_gwp_numeric ON public.products (((sustainability_data->>'gwp')::numeric));

-- 4. Indices for composite filtering on Category and Location
--    User requested composite index on (category_id, location_id).
--    - 'category_id' maps to 'material_type' column on products table.
--    - 'location_id' maps to 'location' column on suppliers table (as products don't have location).
--
--    Since these columns are on different tables, we cannot create a single composite index without denormalization.
--    We ensure both columns are indexed individually to allow the query planner to use BitmapAnd / Index Join.

-- Ensure material_type is indexed (category)
CREATE INDEX IF NOT EXISTS idx_products_material_type ON public.products (material_type);

-- Ensure supplier location is indexed (location)
CREATE INDEX IF NOT EXISTS idx_suppliers_location ON public.suppliers (location);

-- Optional: If the user query commonly joins products and suppliers filtering by both,
-- a composite index on products(supplier_id, material_type) might help the join step.
CREATE INDEX IF NOT EXISTS idx_products_supplier_material ON public.products (supplier_id, material_type);
