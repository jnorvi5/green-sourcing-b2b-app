import { NextRequest, NextResponse } from 'next/server';
import connectMongoose from '@/lib/mongoose';
import Product from '@/models/Product';
import { parseQuery } from '@/lib/agents/search-agent';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Initialize Supabase Admin client for fetching supplier profiles
const supabaseAdmin = createClient(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const locationFilter = searchParams.get('location');
    
    // 1. Parse Query with Agent
    const intent = parseQuery(rawQuery);
    
    await connectMongoose();

    // 2. Build MongoDB Product Query
    const mongoQuery: Record<string, unknown> = { status: 'active' };

    // Text Search on Products
    if (intent.query) {
      mongoQuery['$text'] = { $search: intent.query };
    }

    // Apply Agent Filters to Product Data
    if (intent.filters.certifications) {
      mongoQuery['greenData.certifications'] = { $in: intent.filters.certifications };
    }
    if (intent.filters.maxCarbon) {
      mongoQuery['greenData.carbonFootprint'] = { $lte: intent.filters.maxCarbon };
    }
    if (intent.filters.materialType) {
      // If material type was detected, boost relevance or filter
      // For now, we rely on text search for material type, but could add specific field filter
    }

    // 3. Execute Product Search & Aggregate by Supplier
    // We want to find Suppliers who have matching products
    const productMatches = await Product.find(mongoQuery)
      .select('supplierId title greenData price currency images')
      .limit(100)
      .lean() as unknown as any[];

    // Group products by Supplier
    const supplierMatches = new Map<string, any[]>();
    const supplierIds = new Set<string>();

    productMatches.forEach((p: any) => {
      if (!supplierMatches.has(p.supplierId)) {
        supplierMatches.set(p.supplierId, []);
        supplierIds.add(p.supplierId);
      }
      if (supplierMatches.get(p.supplierId)!.length < 3) {
        supplierMatches.get(p.supplierId)!.push(p);
      }
    });

    // 4. Fetch Supplier Profiles from Supabase
    // If we have specific product matches, restrict supplier fetch to those IDs
    // If query is empty/broad, we might just fetch top suppliers
    
    let supabaseQuery = supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'supplier')
      .eq('is_verified', true);

    if (supplierIds.size > 0) {
      supabaseQuery = supabaseQuery.in('id', Array.from(supplierIds));
    } else if (intent.query) {
      // If no products matched but we have a query, maybe search supplier names directly
      supabaseQuery = supabaseQuery.or(`company_name.ilike.%${intent.query}%,description.ilike.%${intent.query}%`);
    }

    if (locationFilter) {
      supabaseQuery = supabaseQuery.ilike('location', `%${locationFilter}%`);
    }

    const { data: suppliers, error } = await supabaseQuery.limit(50);

    if (error) throw error;

    // 5. Enrich Suppliers with Matched Products
    const enrichedSuppliers = suppliers?.map(supplier => {
      const products = supplierMatches.get(supplier.id) || [];
      
      // Calculate a "Match Score" or relevance
      // If they have products matching the specific criteria, they are highly relevant
      const relevance = products.length > 0 ? 10 : 1;

      return {
        ...supplier,
        matched_products: products,
        relevance,
        // Add agent insights
        agent_insight: products.length > 0 
          ? `Matches "${intent.query}" with ${products.length} products` 
          : undefined
      };
    }).sort((a, b) => b.relevance - a.relevance);

    return NextResponse.json({
      success: true,
      data: enrichedSuppliers,
      meta: {
        intent,
        total_found: enrichedSuppliers?.length || 0
      }
    });

  } catch (error: unknown) {
    console.error('Search API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
