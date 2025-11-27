// app/api/inventory/purchase-orders/route.ts - Purchase Orders API
import { NextRequest, NextResponse } from 'next/server';
import { inventoryService, PurchaseOrder } from '../../../../lib/inventoryService';

interface CreatePOBody {
    organizationId: string;
    supplierId: string;
    supplierName: string;
    supplierEmail?: string;
    items: {
        itemId: string;
        sku: string;
        name: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        sustainabilityScore?: number;
    }[];
    tax?: number;
    shipping?: number;
    discount?: number;
    currency?: string;
    expectedDelivery: string;
    shippingAddress: PurchaseOrder['shippingAddress'];
    estimatedCarbonFootprint?: number;
    sustainabilityNotes?: string;
    approvalRequired?: boolean;
    internalNotes?: string;
    supplierNotes?: string;
    createdBy: string;
}

// GET /api/inventory/purchase-orders - List purchase orders
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const status = searchParams.get('status') || undefined;
        const supplierId = searchParams.get('supplierId') || undefined;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'organizationId is required' },
                { status: 400 }
            );
        }

        const dateRange = startDate && endDate
            ? { start: new Date(startDate), end: new Date(endDate) }
            : undefined;

        const result = await inventoryService.listPurchaseOrders(
            organizationId,
            { status, supplierId, dateRange },
            { page, limit }
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error listing purchase orders:', error);
        return NextResponse.json(
            { error: 'Failed to list purchase orders' },
            { status: 500 }
        );
    }
}

// POST /api/inventory/purchase-orders - Create a new purchase order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CreatePOBody;
        const {
            organizationId,
            supplierId,
            supplierName,
            supplierEmail,
            items,
            tax = 0,
            shipping = 0,
            discount = 0,
            currency = 'USD',
            expectedDelivery,
            shippingAddress,
            estimatedCarbonFootprint = 0,
            sustainabilityNotes,
            approvalRequired = false,
            internalNotes,
            supplierNotes,
            createdBy,
        } = body;

        if (!organizationId || !supplierId || !items || items.length === 0 || !createdBy) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Calculate totals
        const processedItems = items.map((item) => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice,
            receivedQuantity: 0,
        }));

        const subtotal = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const total = subtotal + tax + shipping - discount;

        const po = await inventoryService.createPurchaseOrder({
            organizationId,
            status: approvalRequired ? 'pending_approval' : 'draft',
            supplierId,
            supplierName,
            supplierEmail,
            items: processedItems,
            subtotal,
            tax,
            shipping,
            discount,
            total,
            currency,
            orderDate: new Date(),
            expectedDelivery: new Date(expectedDelivery),
            shippingAddress,
            estimatedCarbonFootprint,
            sustainabilityNotes,
            approvalRequired,
            internalNotes,
            supplierNotes,
            createdBy,
        });

        return NextResponse.json(po, { status: 201 });
    } catch (error) {
        console.error('Error creating purchase order:', error);
        return NextResponse.json(
            { error: 'Failed to create purchase order' },
            { status: 500 }
        );
    }
}
