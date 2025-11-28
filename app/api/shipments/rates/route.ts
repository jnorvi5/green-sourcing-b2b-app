// app/api/shipments/rates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { shipmentService, ShipmentAddress } from '../../../../lib/shipmentService';

interface RateRequest {
    origin: ShipmentAddress;
    destination: ShipmentAddress;
    weight: number;
    weightUnit: 'kg' | 'lb';
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as RateRequest;

        if (!body.origin || !body.destination || !body.weight) {
            return NextResponse.json(
                { error: 'Origin, destination, and weight are required' },
                { status: 400 }
            );
        }

        const rates = await shipmentService.getShippingRates(
            body.origin,
            body.destination,
            body.weight,
            body.weightUnit || 'kg'
        );

        return NextResponse.json({
            rates,
            requestedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Valid for 30 minutes
        });
    } catch (error) {
        console.error('Error fetching rates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shipping rates' },
            { status: 500 }
        );
    }
}
