import { NextRequest, NextResponse } from 'next/server';
import connectMongoose from '@/lib/mongoose';
import Product from '@/models/Product';
import { parseQuery } from '@/lib/agents/search-agent';
import { createClient } from '@supabase/supabase-js';
import { queryEC3, queryEPD, ExternalProduct } from '@/lib/services/external-apis';

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

    // 3. Execute Internal Product Search
    const internalSearchPromise = (async () => {
      const productMatches = await Product.find(mongoQuery)
        .select('supplierId title greenData price currency images')
        .limit(100)
        .lean() as unknown as any[];

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

      let supabaseQuery = supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('role', 'supplier')
        .eq('is_verified', true);

      if (supplierIds.size > 0) {
        supabaseQuery = supabaseQuery.in('id', Array.from(supplierIds));
      } else if (intent.query) {
        supabaseQuery = supabaseQuery.or(`company_name.ilike.%${intent.query}%,description.ilike.%${intent.query}%`);
      }

      if (locationFilter) {
        supabaseQuery = supabaseQuery.ilike('location', `%${locationFilter}%`);
      }

      const { data: suppliers, error } = await supabaseQuery.limit(50);
      if (error) throw error;

      return suppliers?.map(supplier => {
        const products = supplierMatches.get(supplier.id) || [];
        const relevance = products.length > 0 ? 10 : 1;
        return {
          ...supplier,
          matched_products: products,
          relevance,
          agent_insight: products.length > 0 
            ? `Matches "${intent.query}" with ${products.length} products` 
            : undefined
        };
      }) || [];
    })();

    // 4. Execute External API Searches
    const externalResults: ExternalProduct[] = [];
    
    // Trigger external searches if intent flags are set (or default to true for now if not explicitly disabled)
    // For this implementation, we'll check the flags but default to trying if query exists
    const shouldQueryExternal = intent.query.length > 2;

    if (shouldQueryExternal) {
      const results = await Promise.all([
        intent.externalSources.ec3 ? queryEC3(intent) : Promise.resolve([]),
        intent.externalSources.epdInternational ? queryEPD(intent) : Promise.resolve([])
      ]);
      
      results.flat().forEach(r => externalResults.push(r));
    }

    // 5. Merge Results
    const internalSuppliers = await internalSearchPromise;

    // Convert external results to Supplier format
    const externalSuppliers = externalResults.map((ext, index) => ({
      id: `ext-${ext.source}-${index}`, // Temporary ID
      company_name: ext.manufacturer,
      description: ext.productName,
      location: 'Global', // External APIs often don't give precise location easily
      certifications: ext.certifications,
      epd_verified: ext.source === 'EPD' || ext.epdNumber !== undefined,
      verification_source: ext.source,
      matched_products: [{
        _id: `ext-prod-${index}`,
        title: ext.productName,
        price: 0, // Price usually not available
        currency: 'USD',
        greenData: {
          carbonFootprint: ext.carbonFootprint,
          certifications: ext.certifications
        }
      }],
      agent_insight: `${ext.source} verified data • ${ext.carbonFootprint ? ext.carbonFootprint + 'kg CO2e' : 'EPD Available'}`,
      relevance: 15 // Boost external verified sources
    }));

    const combinedResults = [...internalSuppliers, ...externalSuppliers]
      .sort((a, b) => b.relevance - a.relevance);

    return NextResponse.json({
      success: true,
      data: combinedResults,
      meta: {
        intent,
        external_sources_used: Object.entries(intent.externalSources)
          .filter(([_, active]) => active)
          .map(([source]) => source),
        total_found: combinedResults.length
      }
    });

  } catch (error: unknown) {
    console.error('Search API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
