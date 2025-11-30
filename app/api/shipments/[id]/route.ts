// app/api/shipments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { shipmentService, Shipment } from '../../../../lib/shipmentService';

interface UpdateShipmentRequest {
    status?: Shipment['status'];
    carrier?: Shipment['carrier'];
    estimatedDelivery?: string;
    notes?: string;
    tags?: string[];
    costs?: Shipment['costs'];
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const shipment = await shipmentService.getShipment(id);

        if (!shipment) {
            return NextResponse.json(
                { error: 'Shipment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(shipment);
    } catch (error) {
        console.error('Error fetching shipment:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shipment' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json() as UpdateShipmentRequest;

        const updates: Partial<Shipment> = {};

        if (body.carrier) updates.carrier = body.carrier;
        if (body.estimatedDelivery) updates.estimatedDelivery = new Date(body.estimatedDelivery);
        if (body.notes !== undefined) updates.notes = body.notes;
        if (body.tags) updates.tags = body.tags;
        if (body.costs) updates.costs = body.costs;

        let shipment;

        if (body.status) {
            shipment = await shipmentService.updateStatus(id, body.status);
        } else {
            shipment = await shipmentService.updateShipment(id, updates);
        }

        if (!shipment) {
            return NextResponse.json(
                { error: 'Shipment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(shipment);
    } catch (error) {
        console.error('Error updating shipment:', error);
        return NextResponse.json(
            { error: 'Failed to update shipment' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const reason = searchParams.get('reason') || 'Cancelled by user';

        const shipment = await shipmentService.cancelShipment(id, reason);

        if (!shipment) {
            return NextResponse.json(
                { error: 'Shipment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Shipment cancelled', shipment });
    } catch (error) {
        console.error('Error cancelling shipment:', error);
        return NextResponse.json(
            { error: 'Failed to cancel shipment' },
            { status: 500 }
        );
    }
}
