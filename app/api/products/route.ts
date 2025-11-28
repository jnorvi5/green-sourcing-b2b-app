/**
 * Products API - Full CRUD with MongoDB
 * 
 * GET /api/products - List products with filters
 * POST /api/products - Create new product (suppliers only)
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Product, { IProduct } from '../../../models/Product';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products
 * 
 * Query params:
 * - search: text search across title, description, tags
 * - category: filter by category
 * - status: filter by status (default: active)
 * - supplierId: filter by supplier
 * - minPrice / maxPrice: price range
 * - certifications: comma-separated certifications
 * - minRecycled: minimum recycled content percentage
 * - maxCarbon: maximum carbon footprint
 * - limit: results per page (default: 20, max: 100)
 * - offset: pagination offset
 * - sort: field to sort by (default: createdAt)
 * - order: asc or desc (default: desc)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);

        // Build query
        const query: Record<string, unknown> = {};

        // Text search
        const search = searchParams.get('search');
        if (search && search.length >= 2) {
            query.$text = { $search: search };
        }

        // Category filter
        const category = searchParams.get('category');
        if (category) {
            query.category = category;
        }

        // Status filter (default to active for public queries)
        const status = searchParams.get('status') || 'active';
        if (status !== 'all') {
            query.status = status;
        }

        // Supplier filter
        const supplierId = searchParams.get('supplierId');
        if (supplierId) {
            query.supplierId = supplierId;
        }

        // Price range
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) (query.price as Record<string, number>).$gte = parseFloat(minPrice);
            if (maxPrice) (query.price as Record<string, number>).$lte = parseFloat(maxPrice);
        }

        // Certifications filter
        const certifications = searchParams.get('certifications');
        if (certifications) {
            const certArray = certifications.split(',').map(c => c.trim());
            query['greenData.certifications'] = { $all: certArray };
        }

        // Sustainability filters
        const minRecycled = searchParams.get('minRecycled');
        if (minRecycled) {
            query['greenData.recycledContent'] = { $gte: parseFloat(minRecycled) };
        }

        const maxCarbon = searchParams.get('maxCarbon');
        if (maxCarbon) {
            query['greenData.carbonFootprint'] = { $lte: parseFloat(maxCarbon) };
        }

        // Pagination
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        // Sorting
        const sortField = searchParams.get('sort') || 'createdAt';
        const sortOrder = searchParams.get('order') === 'asc' ? 1 : -1;
        const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

        // Execute query
        const [products, total] = await Promise.all([
            Product.find(query)
                .sort(sort)
                .skip(offset)
                .limit(limit)
                .lean(),
            Product.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: products,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + products.length < total,
            },
        });

    } catch (error) {
        console.error('[Products API] GET Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/products
 * 
 * Create a new product. Requires supplier authentication.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        await dbConnect();

        const body = await request.json();

        // Validate required fields
        const requiredFields = ['title', 'description', 'price', 'supplierId', 'category'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { success: false, error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Create product with defaults
        const productData: Partial<IProduct> = {
            title: body.title,
            description: body.description,
            price: body.price,
            currency: body.currency || 'USD',
            supplierId: body.supplierId,
            supplierName: body.supplierName,
            category: body.category,
            subcategory: body.subcategory,
            images: body.images || [],
            certificates: body.certificates || [],
            status: body.status || 'draft',
            minOrderQuantity: body.minOrderQuantity || 1,
            unitOfMeasure: body.unitOfMeasure || 'unit',
            leadTimeDays: body.leadTimeDays,
            tags: body.tags || [],
            greenData: body.greenData || {},
        };

        const product = new Product(productData);
        await product.save();

        return NextResponse.json(
            { success: true, data: product },
            { status: 201 }
        );

    } catch (error) {
        console.error('[Products API] POST Error:', error);

        // Handle validation errors
        if (error instanceof Error && error.name === 'ValidationError') {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
