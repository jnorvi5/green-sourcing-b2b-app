/**
 * Single Product API - Get, Update, Delete
 * 
 * GET /api/products/[id] - Get product details with Autodesk carbon data
 * PUT /api/products/[id] - Update product (owner only)
 * DELETE /api/products/[id] - Delete product (owner only)
 */
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import { getEmbodiedCarbon } from '../../../../lib/autodesk';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/products/[id]
 * 
 * Fetches product details and optionally enriches with Autodesk carbon data
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        await dbConnect();

        const { id } = await params;

        const product = await Product.findById(id).lean();

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        // Optionally fetch real-time carbon data from Autodesk
        const { searchParams } = new URL(request.url);
        const enrichCarbon = searchParams.get('enrichCarbon') === 'true';

        let autodeskCarbon = null;
        if (enrichCarbon && product.greenData?.epdId) {
            try {
                autodeskCarbon = await getEmbodiedCarbon(product.greenData.epdId);
            } catch (err) {
                console.warn('[Product API] Failed to fetch Autodesk carbon data:', err);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                ...product,
                autodeskCarbon,
            },
        });

    } catch (error) {
        console.error('[Product API] GET Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/products/[id]
 * 
 * Update product details. Should verify supplier ownership.
 */
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        await dbConnect();

        const { id } = await params;
        const body = await request.json();

        // TODO: Verify supplier owns this product via auth header
        // const supplierId = await verifySupplierAuth(request);

        // Prevent updating immutable fields
        delete body._id;
        delete body.createdAt;
        delete body.supplierId; // Can't transfer ownership

        const product = await Product.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: product,
        });

    } catch (error) {
        console.error('[Product API] PUT Error:', error);

        if (error instanceof Error && error.name === 'ValidationError') {
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Failed to update product' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/products/[id]
 * 
 * Soft delete by setting status to 'archived', or hard delete if specified
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse> {
    try {
        await dbConnect();

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const hardDelete = searchParams.get('hard') === 'true';

        // TODO: Verify supplier owns this product via auth header

        if (hardDelete) {
            const result = await Product.findByIdAndDelete(id);
            if (!result) {
                return NextResponse.json(
                    { success: false, error: 'Product not found' },
                    { status: 404 }
                );
            }
        } else {
            // Soft delete - archive
            const product = await Product.findByIdAndUpdate(
                id,
                { status: 'archived' },
                { new: true }
            );
            if (!product) {
                return NextResponse.json(
                    { success: false, error: 'Product not found' },
                    { status: 404 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: hardDelete ? 'Product deleted' : 'Product archived',
        });

    } catch (error) {
        console.error('[Product API] DELETE Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}
