/**
 * Material Matcher Service
 * Uses fuzzy matching to identify GreenChainz products from BIM material names
 */

import Fuse from 'fuse.js';
import { createClient } from '@supabase/supabase-js';
import type { MaterialMatch, FuzzySearchOptions } from '@/types/autodesk';

/**
 * Find matching GreenChainz products for a BIM material
 */
export async function findMaterialMatch(
  materialName: string,
  category?: string,
  options: FuzzySearchOptions = {}
): Promise<MaterialMatch | null> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  // Build query
  let query = supabase.from('products').select('*');

  if (options.category_filter) {
    query = query.ilike('material_type', `%${options.category_filter}%`);
  } else if (category) {
    query = query.ilike('material_type', `%${category}%`);
  }

  if (options.max_carbon) {
    query = query.lte('sustainability_data->>gwp_kg_co2e', options.max_carbon);
  }

  const { data: products, error } = await query;

  if (error || !products || products.length === 0) {
    return null;
  }

  // Configure Fuse.js for fuzzy matching
  const fuse = new Fuse(products, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'material_type', weight: 0.3 },
      { name: 'description', weight: 0.2 },
    ],
    threshold: options.threshold || 0.4, // Lower = more strict
    includeScore: true,
    minMatchCharLength: 3,
  });

  // Search for matches
  const results = fuse.search(materialName);

  if (results.length === 0) {
    return null;
  }

  // Get best match
  const bestMatch = results[0];
  if (!bestMatch) {
    return null;
  }

  const product = bestMatch.item;
  const score = 1 - (bestMatch.score || 0); // Invert score (higher = better)

  // Determine match type
  let matchType: 'exact' | 'fuzzy' | 'category' = 'fuzzy';
  const matchReasons: string[] = [];

  if (product.name.toLowerCase() === materialName.toLowerCase()) {
    matchType = 'exact';
    matchReasons.push('Exact name match');
  } else if (score > 0.8) {
    matchReasons.push('High similarity score');
  } else if (category && product.material_type?.toLowerCase().includes(category.toLowerCase())) {
    matchType = 'category';
    matchReasons.push('Category match');
  }

  return {
    product_id: product.id,
    product_name: product.name,
    category: product.material_type || 'Unknown',
    carbon_footprint: parseFloat(
      product.sustainability_data?.gwp_kg_co2e || product.sustainability_data?.gwp || 0
    ),
    confidence_score: score,
    match_type: matchType,
    match_reasons: matchReasons,
  };
}

/**
 * Batch match multiple materials
 */
export async function batchMatchMaterials(
  materials: Array<{ name: string; category?: string }>,
  options: FuzzySearchOptions = {}
): Promise<Map<string, MaterialMatch | null>> {
  const matches = new Map<string, MaterialMatch | null>();

  // Process in parallel with limit
  const batchSize = 10;
  for (let i = 0; i < materials.length; i += batchSize) {
    const batch = materials.slice(i, i + batchSize);
    const batchPromises = batch.map((material) =>
      findMaterialMatch(material.name, material.category, options)
    );

    const batchResults = await Promise.all(batchPromises);

    batch.forEach((material, index) => {
      matches.set(material.name, batchResults[index] ?? null);
    });
  }

  return matches;
}

/**
 * Get low-carbon alternatives for a material
 */
export async function getLowCarbonAlternatives(
  materialCategory: string,
  currentCarbonFootprint: number,
  limit = 5
) {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  const { data: alternatives, error } = await supabase
    .from('products')
    .select('*')
    .ilike('material_type', `%${materialCategory}%`)
    .lt('sustainability_data->>gwp_kg_co2e', currentCarbonFootprint)
    .order('sustainability_data->>gwp_kg_co2e', { ascending: true })
    .limit(limit);

  if (error || !alternatives) {
    return [];
  }

  return alternatives.map((alt) => ({
    product_id: alt.id,
    product_name: alt.name,
    category: alt.material_type,
    carbon_footprint: parseFloat(alt.sustainability_data?.gwp_kg_co2e || 0),
    reduction_percent:
      ((currentCarbonFootprint - parseFloat(alt.sustainability_data?.gwp_kg_co2e || 0)) /
        currentCarbonFootprint) *
      100,
  }));
}
