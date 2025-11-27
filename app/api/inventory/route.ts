// app/api/inventory/route.ts - Inventory Management API
import { NextRequest, NextResponse } from 'next/server';
import { inventoryService, InventoryItem } from '../../../lib/inventoryService';

interface CreateItemBody {
    organizationId: string;
    sku: string;
    name: string;
    description?: string;
    category: string;
    subcategory?: string;
    quantity: number;
    unit: string;
    reservedQuantity?: number;
    reorderPoint: number;
    safetyStock: number;
    maxStock: number;
    warehouseId?: string;
    warehouseName?: string;
    unitCost: number;
    currency: string;
    preferredSuppliers?: InventoryItem['preferredSuppliers'];
    sustainability?: InventoryItem['sustainability'];
    batchTracking?: boolean;
    serialTracking?: boolean;
    expiryTracking?: boolean;
}

// GET /api/inventory - List inventory items
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const category = searchParams.get('category') || undefined;
        const status = searchParams.get('status') || undefined;
        const lowStock = searchParams.get('lowStock') === 'true';
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'organizationId is required' },
                { status: 400 }
            );
        }

        const result = await inventoryService.listItems(
            organizationId,
            { category, status, lowStock, search },
            { page, limit }
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error listing inventory:', error);
        return NextResponse.json(
            { error: 'Failed to list inventory' },
            { status: 500 }
        );
    }
}

// POST /api/inventory - Create a new inventory item
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CreateItemBody;
        const {
            organizationId,
            sku,
            name,
            description,
            category,
            subcategory,
            quantity,
            unit,
            reservedQuantity = 0,
            reorderPoint,
            safetyStock,
            maxStock,
            warehouseId,
            warehouseName,
            unitCost,
            currency,
            preferredSuppliers = [],
            sustainability,
            batchTracking = false,
            serialTracking = false,
            expiryTracking = false,
        } = body;

        if (!organizationId || !sku || !name || !category || quantity === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check for duplicate SKU
        const existing = await inventoryService.getItemBySku(organizationId, sku);
        if (existing) {
            return NextResponse.json(
                { error: 'Item with this SKU already exists' },
                { status: 409 }
            );
        }

        const item = await inventoryService.createItem({
            organizationId,
            sku,
            name,
            description,
            category,
            subcategory,
            quantity,
            unit,
            reservedQuantity,
            reorderPoint: reorderPoint || Math.floor(quantity * 0.2),
            safetyStock: safetyStock || Math.floor(quantity * 0.1),
            maxStock: maxStock || quantity * 2,
            warehouseId,
            warehouseName,
            unitCost,
            currency: currency || 'USD',
            preferredSuppliers,
            sustainability: sustainability || {
                recycledContent: 0,
                carbonFootprint: 0,
                certifications: [],
                isLocal: false,
                sustainabilityScore: 0,
            },
            batchTracking,
            serialTracking,
            expiryTracking,
            status: 'active',
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        return NextResponse.json(
            { error: 'Failed to create inventory item' },
            { status: 500 }
        );
    }
}
