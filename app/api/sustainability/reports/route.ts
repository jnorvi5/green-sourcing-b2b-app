// app/api/sustainability/reports/route.ts - Sustainability Reports API
import { NextRequest, NextResponse } from 'next/server';
import { sustainabilityReportingService } from '../../../../lib/sustainabilityReportingService';

interface CreateReportBody {
    organizationId: string;
    type: 'monthly' | 'quarterly' | 'annual' | 'custom';
    periodStart: string;
    periodEnd: string;
    createdBy: string;
}

// GET /api/sustainability/reports - List sustainability reports
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const type = searchParams.get('type') || undefined;
        const status = searchParams.get('status') || undefined;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'organizationId is required' },
                { status: 400 }
            );
        }

        const reports = await sustainabilityReportingService.listReports(
            organizationId,
            { type, status }
        );

        return NextResponse.json(reports);
    } catch (error) {
        console.error('Error listing sustainability reports:', error);
        return NextResponse.json(
            { error: 'Failed to list reports' },
            { status: 500 }
        );
    }
}

// POST /api/sustainability/reports - Create a new sustainability report
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CreateReportBody;
        const { organizationId, type, periodStart, periodEnd, createdBy } = body;

        if (!organizationId || !type || !periodStart || !periodEnd || !createdBy) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const report = await sustainabilityReportingService.createReport(
            organizationId,
            type,
            {
                start: new Date(periodStart),
                end: new Date(periodEnd),
            },
            createdBy
        );

        return NextResponse.json(report, { status: 201 });
    } catch (error) {
        console.error('Error creating sustainability report:', error);
        return NextResponse.json(
            { error: 'Failed to create report' },
            { status: 500 }
        );
    }
}
