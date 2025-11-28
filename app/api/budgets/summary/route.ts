// app/api/budgets/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { budgetService } from '../../../../lib/budgetService';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const fiscalYear = searchParams.get('fiscalYear');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        const year = fiscalYear ? parseInt(fiscalYear) : new Date().getFullYear();

        const summary = await budgetService.getBudgetSummary(organizationId, year);

        return NextResponse.json({
            fiscalYear: year,
            ...summary,
        });
    } catch (error) {
        console.error('Error fetching budget summary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch budget summary' },
            { status: 500 }
        );
    }
}
