import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { ObjectId, Filter, Document } from 'mongodb';

/**
 * MongoDB Material document schema
 * Reference materials for carbon footprint calculations
 */
interface MongoMaterial {
  _id: ObjectId;
  materialId: string;
  name: string;
  category: string;
  subcategory?: string;
  masterFormat?: string;
  gwp: number;
  gwpUnit?: string;
  declaredUnit?: string;
  lifecycleStages?: Record<string, unknown>;
  benchmarks?: Record<string, unknown>;
  source?: string;
  dataQuality?: string;
  region?: string;
  tags?: string[];
  alternatives?: string[];
  lastUpdated?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * API response material format
 */
interface MaterialResponse {
  id: string;
  materialId: string;
  name: string;
  category: string;
  subcategory?: string;
  masterFormat?: string;
  carbon_footprint: number;
  gwpUnit?: string;
  declaredUnit?: string;
  lifecycleStages?: Record<string, unknown>;
  benchmarks?: Record<string, unknown>;
  source?: string;
  dataQuality?: string;
  region?: string;
  tags?: string[];
  alternatives?: string[];
  data_source: string;
}

/**
 * Transform a MongoDB material document to the API response format
 */
function transformMaterial(material: MongoMaterial): MaterialResponse {
  return {
    id: material._id.toString(),
    materialId: material.materialId,
    name: material.name,
    category: material.category,
    subcategory: material.subcategory,
    masterFormat: material.masterFormat,
    carbon_footprint: material.gwp,
    gwpUnit: material.gwpUnit,
    declaredUnit: material.declaredUnit,
    lifecycleStages: material.lifecycleStages,
    benchmarks: material.benchmarks,
    source: material.source,
    dataQuality: material.dataQuality,
    region: material.region,
    tags: material.tags,
    alternatives: material.alternatives,
    data_source: 'GreenChainz'
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');

  try {
    const db = await connectMongoDB();
    
    // Build filter based on query parameters
    const filter: Filter<Document> = {};
    
    // Text search on name field
    if (query) {
      filter.name = { $regex: query, $options: 'i' };
    }
    
    // Category filter (case-insensitive)
    if (category) {
      filter.category = { $regex: `^${category}$`, $options: 'i' };
    }
    
    // Fetch materials from MongoDB with filters
    const materials = await db.collection<MongoMaterial>('materials')
      .find(filter)
      .limit(100)
      .toArray();

    console.log('[Materials API] Found materials in MongoDB:', materials.length);
    
    // Log first document structure for debugging (only in development)
    if (materials.length > 0 && process.env['NODE_ENV'] === 'development') {
      console.log('[Materials API] Sample document structure:', JSON.stringify(materials[0], null, 2));
    }

    // If no materials found, return early with helpful message
    if (materials.length === 0) {
      console.warn('[Materials API] No materials found in MongoDB collection');
      return NextResponse.json({
        success: true,
        count: 0,
        materials: [],
        message: 'No materials found in database'
      });
    }

    // Transform materials to API response format
    const transformedMaterials = materials.map(transformMaterial);

    return NextResponse.json({
      success: true,
      count: transformedMaterials.length,
      materials: transformedMaterials
    });

  } catch (error) {
    console.error('[Materials API] Critical error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch materials',
        details: process.env['NODE_ENV'] === 'development' ? String(error) : undefined
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

    // Validate required fields
    if (!body.name || !body.category || typeof body.gwp !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, category, gwp' },
        { status: 400 }
      );
    }

    // Generate materialId if not provided (sanitize to valid slug)
    const materialId = body.materialId || body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')  // Replace special chars with hyphens
      .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens

    // Check for duplicate materialId
    const existingMaterial = await db.collection('materials').findOne({ materialId });
    if (existingMaterial) {
      return NextResponse.json(
        { success: false, error: `Material with ID '${materialId}' already exists` },
        { status: 409 }
      );
    }

    // Insert into MongoDB with correct schema
    // Note: Default gwpUnit and declaredUnit are common values that can be overridden
    const result = await db.collection('materials').insertOne({
      materialId,
      name: body.name,
      category: body.category,
      subcategory: body.subcategory,
      masterFormat: body.masterFormat,
      gwp: body.gwp,
      gwpUnit: body.gwpUnit || 'kg CO2e/unit',
      declaredUnit: body.declaredUnit || '1 unit',
      lifecycleStages: body.lifecycleStages,
      benchmarks: body.benchmarks,
      source: body.source || 'User Submitted',
      dataQuality: body.dataQuality || 'user-submitted',
      region: body.region,
      tags: body.tags || [],
      alternatives: body.alternatives || [],
      createdAt: new Date(),
      updatedAt: new Date()
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

