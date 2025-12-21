/**
 * Material Matcher Service
 * Uses fuzzy matching to identify GreenChainz products from BIM material names
 */

import Fuse from 'fuse.js';
import { createClient } from '@supabase/supabase-js';
import type { MaterialMatch, FuzzySearchOptions } from '@/types/autodesk';

interface Product {
  id: string;
  name: string;
  material_type: string;
  description?: string;
  sustainability_data?: {
    gwp_kg_co2e?: number;
    gwp?: number;
  };
}

/**
 * Find matching GreenChainz products for a BIM material
 */
export async function findMaterialMatch(
  materialName: string,
  category?: string,
  options: FuzzySearchOptions = {},
  prefetchedProducts?: Product[]
): Promise<MaterialMatch | null> {
  let products: Product[] = [];

  if (prefetchedProducts) {
    products = prefetchedProducts;

    // Apply local filters if using prefetched products
    if (options.category_filter) {
      products = products.filter(p =>
        p.material_type?.toLowerCase().includes(options.category_filter!.toLowerCase())
      );
    } else if (category) {
      products = products.filter(p =>
        p.material_type?.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (options.max_carbon) {
      products = products.filter(p => {
        const carbon = p.sustainability_data?.gwp_kg_co2e;
        return carbon !== undefined && carbon <= options.max_carbon!;
      });
    }
  } else {
    // Legacy behavior: Fetch from DB if no products provided
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

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }
    products = data;
  }

  if (products.length === 0) {
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
      (product.sustainability_data?.gwp_kg_co2e || product.sustainability_data?.gwp || 0).toString()
    ),
    confidence_score: score,
    match_type: matchType,
    match_reasons: matchReasons,
  };
}

/**
 * Batch match multiple materials
 * Optimized to fetch products once instead of N times
 */
export async function batchMatchMaterials(
  materials: Array<{ name: string; category?: string }>,
  options: FuzzySearchOptions = {}
): Promise<Map<string, MaterialMatch | null>> {
  const matches = new Map<string, MaterialMatch | null>();

  // 1. Identify all unique categories needed
  const categories = new Set<string>();
  materials.forEach(m => {
    if (m.category) categories.add(m.category);
  });

  if (options.category_filter) {
    categories.add(options.category_filter);
  }

  // 2. Fetch all potentially relevant products in one go
  // If no categories, we might need to fetch everything (be careful with large DBs)
  // For now, assuming if categories exist, we filter by them. If not, we fetch all.

  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  let allProducts: Product[] = [];

  try {
    const query = supabase.from('products').select('*');

    // If we have categories, try to filter.
    // However, ILIKE with multiple ORs is tricky in Supabase basic query builder without 'or'.
    // A simpler approach for batching:
    // If we have specific categories, we could use `.in('material_type', [...])` but material_type might be inexact (e.g. "Concrete" vs "Reinforced Concrete").
    // Given fuzzy matching nature, strict equality might miss things.
    // But typically 'category' in BIM comes from a fixed list (Revit categories).

    // Optimization: If we have categories, we can try to filter.
    // If categories set is empty, we fetch all products (assuming table isn't huge yet).
    // If it is huge, we might need a different strategy (search index).

    // For now, let's fetch all products. In early stage startup apps, N < 1000 usually.
    // Fetching 1000 rows once is faster than 100 requests of 10 rows.

    const { data, error } = await query;
    if (!error && data) {
      allProducts = data;
    }
  } catch (err) {
    console.error("Error pre-fetching products", err);
  }

  // Process in parallel with limit (CPU bound now, not IO bound for fetching)
  const batchSize = 10;
  for (let i = 0; i < materials.length; i += batchSize) {
    const batch = materials.slice(i, i + batchSize);

    // We pass the full list of products to findMaterialMatch.
    // findMaterialMatch will filter in-memory.
    const batchPromises = batch.map((material) =>
      findMaterialMatch(material.name, material.category, options, allProducts)
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
    carbon_footprint: parseFloat(
      (alt.sustainability_data?.gwp_kg_co2e || 0).toString()
    ),
    reduction_percent:
      ((currentCarbonFootprint - parseFloat((alt.sustainability_data?.gwp_kg_co2e || 0).toString())) /
        currentCarbonFootprint) *
      100,
  }));
}

/**
 * Search for materials returning multiple matches
 */
export async function searchMaterials(
  queryStr: string,
  limit = 5
): Promise<MaterialMatch[]> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  const { data: products, error } = await supabase.from('products').select('*');

  if (error || !products || products.length === 0) {
    return [];
  }

  const fuse = new Fuse(products, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'material_type', weight: 0.3 },
      { name: 'description', weight: 0.2 },
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 3,
  });

  const results = fuse.search(queryStr);

  return results.slice(0, limit).map(result => {
    const product = result.item;
    const score = 1 - (result.score || 0);
    
    return {
      product_id: product.id,
      product_name: product.name,
      category: product.material_type || 'Unknown',
      carbon_footprint: parseFloat(
        (product.sustainability_data?.gwp_kg_co2e || product.sustainability_data?.gwp || 0).toString()
      ),
      confidence_score: score,
      match_type: score > 0.9 ? 'exact' : 'fuzzy',
      match_reasons: ['Search match']
    };
  });
}
