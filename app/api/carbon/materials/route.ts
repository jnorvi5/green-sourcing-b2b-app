/**
 * Carbon Materials API
 * 
 * Serves cached material carbon data from MongoDB
 * instead of making live Autodesk/EC3 API calls
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Material from '../../../../models/Material';

const MONGODB_URI = process.env.MONGODB_URI || '';

interface MaterialLookupBody {
    materialId?: string;
    materialIds?: string[];
}

async function connectDB() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI);
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        // Query parameters
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const masterFormat = searchParams.get('masterFormat');
        const maxGwp = searchParams.get('maxGwp');
        const minGwp = searchParams.get('minGwp');
        const tag = searchParams.get('tag');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query
        const query: Record<string, unknown> = { isActive: true };

        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        if (masterFormat) {
            query.masterFormat = { $regex: `^${masterFormat}`, $options: 'i' };
        }

        if (maxGwp) {
            query.gwp = { ...((query.gwp as object) || {}), $lte: parseFloat(maxGwp) };
        }

        if (minGwp) {
            query.gwp = { ...((query.gwp as object) || {}), $gte: parseFloat(minGwp) };
        }

        if (tag) {
            query.tags = { $in: [tag] };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { subcategory: { $regex: search, $options: 'i' } },
                { tags: { $in: [search.toLowerCase()] } },
            ];
        }

        // Execute query
        const [materials, total] = await Promise.all([
            Material.find(query)
                .sort({ category: 1, gwp: 1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            Material.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: materials,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + materials.length < total,
            },
            meta: {
                source: 'cached',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Materials API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch materials' },
            { status: 500 }
        );
    }
}

// Get single material by ID
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json() as MaterialLookupBody;
        const { materialId, materialIds } = body;

        let materials;

        if (materialIds && Array.isArray(materialIds)) {
            // Batch lookup
            materials = await Material.find({
                materialId: { $in: materialIds },
                isActive: true,
            }).lean();
        } else if (materialId) {
            // Single lookup
            const material = await Material.findOne({ materialId, isActive: true }).lean();
            materials = material ? [material] : [];
        } else {
            return NextResponse.json(
                { success: false, error: 'materialId or materialIds required' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: materials,
            meta: {
                source: 'cached',
                timestamp: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Materials POST API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch materials' },
            { status: 500 }
        );
    }
}
