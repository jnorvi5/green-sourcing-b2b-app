import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only if credentials are available
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.warn('[Materials API] Supabase credentials not configured - supplier enrichment disabled');
    return null;
  }
  
  return createClient(url, key);
}

// Helper to extract carbon footprint from various possible field names
function extractCarbonFootprint(product: Record<string, unknown>): number | null {
  // Try different possible field names
  const value = product.carbon_footprint_kg_co2 
    ?? product.carbon_footprint 
    ?? product.carbonFootprint
    ?? product.gwp
    ?? null;
  
  return typeof value === 'number' ? value : null;
}

// Helper to extract price from various possible field names
function extractPrice(product: Record<string, unknown>): number | null {
  const value = product.unit_price 
    ?? product.price 
    ?? product.unitPrice
    ?? null;
  
  return typeof value === 'number' ? value : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');

  try {
    const db = await connectMongoDB();
    
    // Fetch all materials from MongoDB
    const products = await db.collection('materials')
      .find({})
      .limit(50)
      .toArray();

    console.log('[Materials API] Found materials in MongoDB:', products.length);
    
    // Log first document structure for debugging (only in development)
    if (products.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('[Materials API] Sample document structure:', JSON.stringify(products[0], null, 2));
    }

    // If no products found, return early with helpful message
    if (products.length === 0) {
      console.warn('[Materials API] No materials found in MongoDB collection');
      return NextResponse.json({
        success: true,
        count: 0,
        materials: [],
        message: 'No materials found in database'
      });
    }

    // Get Supabase client (may be null if not configured)
    const supabase = getSupabaseClient();
    
    // Enrich products with supplier data (optional, non-blocking)
    const enrichedProducts = await Promise.all(
      products.map(async (product, index) => {
        // Default supplier info (used as fallback)
        let supplierInfo = {
          name: 'Unknown Supplier',
          verified: false
        };

        // Try to fetch supplier data from Supabase if available and product has supplier_id
        if (supabase && product.supplier_id) {
          try {
            const { data: supplier, error } = await supabase
              .from('profiles')
              .select('company_name, email, verified')
              .eq('id', product.supplier_id)
              .single();

            if (error) {
              console.warn(`[Materials API] Supplier lookup failed for product ${index}:`, error.message);
            } else if (supplier) {
              supplierInfo = {
                name: supplier.company_name || 'Unknown Supplier',
                verified: supplier.verified ?? false
              };
            }
          } catch (supplierError) {
            // Log but don't fail the entire request
            console.error(`[Materials API] Supplier enrichment error for product ${index}:`, supplierError);
          }
        }

        // Map product with flexible field handling
        return {
          id: product._id.toString(),
          name: product.name ?? 'Unnamed Material',
          category: product.category ?? 'Uncategorized',
          description: product.description ?? '',
          carbon_footprint: extractCarbonFootprint(product),
          unit_price: extractPrice(product),
          image_url: product.image_url ?? product.imageUrl ?? null,
          
          // Flexible MongoDB data
          epd: product.epd ?? null,
          certifications: Array.isArray(product.certifications) ? product.certifications : [],
          
          // Supplier data (with fallback)
          supplier: supplierInfo,
          
          data_source: 'GreenChainz'
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: enrichedProducts.length,
      materials: enrichedProducts
    });

  } catch (error) {
    console.error('[Materials API] Critical error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch materials',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// POST endpoint - add new material to MongoDB
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await connectMongoDB();
    const supabase = getSupabaseClient();

    // Validate supplier exists in Supabase (if Supabase is configured)
    if (supabase && body.supplier_id) {
      const { data: supplier, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', body.supplier_id)
        .single();

      if (error || !supplier) {
        console.warn('[Materials API] POST: Supplier validation failed:', error?.message);
        return NextResponse.json(
          { success: false, error: 'Invalid supplier ID' },
          { status: 400 }
        );
      }
    }

    // Insert into MongoDB (flexible schema)
    const result = await db.collection('materials').insertOne({
      name: body.name,
      category: body.category,
      description: body.description,
      unit_price: body.unit_price,
      carbon_footprint_kg_co2: body.carbon_footprint,
      supplier_id: body.supplier_id,
      
      // Flexible EPD data
      epd: body.epd || {},
      certifications: body.certifications || [],
      
      image_url: body.image_url,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });

    return NextResponse.json({
      success: true,
      material_id: result.insertedId.toString()
    });

  } catch (error) {
    console.error('[Materials API] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create material' },
      { status: 500 }
    );
  }
}

