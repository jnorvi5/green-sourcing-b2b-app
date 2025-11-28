// app/api/shipments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { shipmentService, Shipment, ShipmentAddress } from '../../../lib/shipmentService';

interface CreateShipmentRequest {
    orderId?: string;
    purchaseOrderId?: string;
    origin: ShipmentAddress;
    destination: ShipmentAddress;
    items: Shipment['items'];
    carrier: Shipment['carrier'];
    weight: Shipment['weight'];
    dimensions?: Shipment['dimensions'];
    packageCount: number;
    packageType: Shipment['packageType'];
    shippingMethod: Shipment['shippingMethod'];
    insurance?: Shipment['insurance'];
    customs?: Shipment['customs'];
    costs: Shipment['costs'];
    notes?: string;
    tags?: string[];
    scheduledPickup?: string;
    estimatedDelivery?: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        const filters = {
            status: searchParams.get('status') as Shipment['status'] | undefined,
            carrier: searchParams.get('carrier') || undefined,
            fromDate: searchParams.get('fromDate') ? new Date(searchParams.get('fromDate')!) : undefined,
            toDate: searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : undefined,
            search: searchParams.get('search') || undefined,
        };

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await shipmentService.listShipments(
            organizationId,
            filters,
            { page, limit }
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error listing shipments:', error);
        return NextResponse.json(
            { error: 'Failed to list shipments' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CreateShipmentRequest;
        const organizationId = request.headers.get('x-organization-id');
        const userId = request.headers.get('x-user-id');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        if (!body.origin || !body.destination || !body.items || body.items.length === 0) {
            return NextResponse.json(
                { error: 'Origin, destination, and items are required' },
                { status: 400 }
            );
        }

        const shipment = await shipmentService.createShipment({
            organizationId,
            orderId: body.orderId,
            purchaseOrderId: body.purchaseOrderId,
            status: 'draft',
            origin: body.origin,
            destination: body.destination,
            items: body.items,
            carrier: body.carrier,
            weight: body.weight,
            dimensions: body.dimensions,
            packageCount: body.packageCount || 1,
            packageType: body.packageType || 'box',
            shippingMethod: body.shippingMethod || 'ground',
            insurance: body.insurance,
            customs: body.customs,
            costs: body.costs,
            documents: [],
            notes: body.notes,
            tags: body.tags,
            scheduledPickup: body.scheduledPickup ? new Date(body.scheduledPickup) : undefined,
            estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
            createdBy: userId || 'system',
        });

        return NextResponse.json(shipment, { status: 201 });
    } catch (error) {
        console.error('Error creating shipment:', error);
        return NextResponse.json(
            { error: 'Failed to create shipment' },
            { status: 500 }
        );
    }
}
