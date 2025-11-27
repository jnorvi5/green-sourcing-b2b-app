// app/api/shipments/[id]/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { shipmentService, ShipmentEvent } from '../../../../../lib/shipmentService';

interface TrackingEventRequest {
    status: string;
    location?: string;
    description: string;
    timestamp?: string;
    carrier?: string;
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

        // Return tracking information
        return NextResponse.json({
            shipmentId: shipment.shipmentId,
            status: shipment.status,
            carrier: shipment.carrier,
            origin: shipment.origin,
            destination: shipment.destination,
            estimatedDelivery: shipment.estimatedDelivery,
            actualDelivery: shipment.actualDelivery,
            events: shipment.events.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ),
            carbonFootprint: shipment.carbonFootprint,
        });
    } catch (error) {
        console.error('Error fetching tracking:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tracking information' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json() as TrackingEventRequest;

        if (!body.status || !body.description) {
            return NextResponse.json(
                { error: 'Status and description are required' },
                { status: 400 }
            );
        }

        const event: Omit<ShipmentEvent, 'id'> = {
            timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
            status: body.status,
            location: body.location,
            description: body.description,
            carrier: body.carrier,
        };

        const shipment = await shipmentService.addTrackingEvent(id, event);

        if (!shipment) {
            return NextResponse.json(
                { error: 'Shipment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Tracking event added',
            events: shipment.events,
        });
    } catch (error) {
        console.error('Error adding tracking event:', error);
        return NextResponse.json(
            { error: 'Failed to add tracking event' },
            { status: 500 }
        );
    }
}
