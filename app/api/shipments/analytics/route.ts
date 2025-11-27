// app/api/shipments/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { shipmentService } from '../../../../lib/shipmentService';

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

        const fromDate = searchParams.get('fromDate')
            ? new Date(searchParams.get('fromDate')!)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

        const toDate = searchParams.get('toDate')
            ? new Date(searchParams.get('toDate')!)
            : new Date();

        const analytics = await shipmentService.getShipmentAnalytics(
            organizationId,
            fromDate,
            toDate
        );

        return NextResponse.json({
            ...analytics,
            period: {
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
            },
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch shipment analytics' },
            { status: 500 }
        );
    }
}
