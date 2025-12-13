
import { createClient } from '@supabase/supabase-js';
import { parseQuery } from '@/lib/agents/search-agent';

export interface SupplierSearchResult {
  product_id: string;
  product_name: string;
  supplier_name: string;
  material_type: string;
  gwp?: number;
  certifications?: string[];
  description?: string;
  location?: string;
}

/**
 * Search for suppliers and products in the GreenChainz database
 */
export async function searchLocalSuppliers(rawQuery: string): Promise<SupplierSearchResult[]> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  // 1. Parse intent to extract filters
  const { query: cleanQuery, filters } = parseQuery(rawQuery);

  // 2. Build Query
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      material_type,
      certifications,
      sustainability_data,
      supplier_id,
      suppliers (
        name,
        location
      )
    `);

  // Apply filters
  if (filters.materialType) {
    query = query.ilike('material_type', `%${filters.materialType}%`);
  }

  if (filters.maxCarbon) {
    query = query.lte('sustainability_data->>gwp_kg_co2e', filters.maxCarbon);
  }

  // Text search on name or description using the cleaned query
  if (cleanQuery) {
    query = query.or(`name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error('[Search Tool] Error searching products:', error);
    return [];
  }

  if (!products || products.length === 0) {
    return [];
  }

  // 3. Map to result format
  return products.map((p: any) => ({
    product_id: p.id,
    product_name: p.name,
    supplier_name: p.suppliers?.name || 'Unknown Supplier',
    location: p.suppliers?.location,
    material_type: p.material_type,
    gwp: parseFloat(p.sustainability_data?.gwp_kg_co2e || p.sustainability_data?.gwp || 0),
    certifications: p.certifications || [],
    description: p.description
  }));
}
