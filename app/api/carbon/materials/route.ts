import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { createClient } from '@supabase/supabase-js';

// Supabase client (for user/supplier data)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');

  try {
    // STEP 1: Query MongoDB for products (flexible schemas)
    const db = await connectMongoDB();
    
    const mongoQuery: any = {};
    if (query) mongoQuery.$text = { $search: query };
    if (category) mongoQuery.category = category;
    mongoQuery.status = 'active';

    const products = await db.collection('products')
      .find(mongoQuery)
      .limit(50)
      .toArray();

    // STEP 2: Enrich with Supabase supplier data
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        // Get supplier verification status from Supabase
        const { data: supplier } = await supabase
          .from('profiles')
          .select('company_name, email, verified')
          .eq('id', product.supplier_id)
          .single();

        return {
          id: product._id.toString(),
          name: product.name,
          category: product.category,
          description: product.description,
          carbon_footprint: product.carbon_footprint_kg_co2,
          unit_price: product.unit_price,
          image_url: product.image_url,
          
          // Flexible MongoDB data
          epd: product.epd || null,
          certifications: product.certifications || [],
          
          // Supabase relational data
          supplier: {
            name: supplier?.company_name || 'Unknown',
            verified: supplier?.verified || false
          },
          
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
    console.error('API Error:', error);
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

    // Validate supplier exists in Supabase
    const { data: supplier } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', body.supplier_id)
      .single();

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Invalid supplier ID' },
        { status: 400 }
      );
    }

    // Insert into MongoDB (flexible schema)
    const result = await db.collection('products').insertOne({
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
    console.error('Insert Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create material' },
      { status: 500 }
    );
  }
}

