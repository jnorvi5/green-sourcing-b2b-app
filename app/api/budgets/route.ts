// app/api/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { budgetService, Budget } from '../../../lib/budgetService';

interface CreateBudgetRequest {
    name: string;
    description?: string;
    fiscalYear: number;
    type: Budget['type'];
    currency: string;
    totalPlanned: number;
    categories: Budget['categories'];
    periods: Omit<Budget['periods'][0], 'lineItems'>[];
    sustainabilityAllocation?: Budget['sustainabilityAllocation'];
    alerts?: Budget['alerts'];
    tags?: string[];
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
            fiscalYear: searchParams.get('fiscalYear')
                ? parseInt(searchParams.get('fiscalYear')!)
                : undefined,
            type: searchParams.get('type') as Budget['type'] | undefined,
            status: searchParams.get('status') as Budget['status'] | undefined,
        };

        const budgets = await budgetService.listBudgets(organizationId, filters);

        return NextResponse.json({ budgets });
    } catch (error) {
        console.error('Error listing budgets:', error);
        return NextResponse.json(
            { error: 'Failed to list budgets' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CreateBudgetRequest;
        const organizationId = request.headers.get('x-organization-id');
        const userId = request.headers.get('x-user-id');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        if (!body.name || !body.fiscalYear || !body.type || !body.totalPlanned) {
            return NextResponse.json(
                { error: 'Name, fiscal year, type, and total planned amount are required' },
                { status: 400 }
            );
        }

        // Initialize line items for each period
        const periodsWithLineItems = (body.periods || []).map(period => ({
            ...period,
            startDate: new Date(period.startDate),
            endDate: new Date(period.endDate),
            lineItems: body.categories.map(cat => ({
                id: `li-${cat.id}-${period.id}`,
                categoryId: cat.id,
                name: cat.name,
                plannedAmount: body.totalPlanned / (body.periods?.length || 1) / body.categories.length,
                actualAmount: 0,
                variance: body.totalPlanned / (body.periods?.length || 1) / body.categories.length,
                variancePercentage: 100,
            })),
        }));

        const budget = await budgetService.createBudget({
            organizationId,
            name: body.name,
            description: body.description,
            fiscalYear: body.fiscalYear,
            type: body.type,
            status: 'draft',
            currency: body.currency || 'USD',
            totalPlanned: body.totalPlanned,
            categories: body.categories || [],
            periods: periodsWithLineItems,
            sustainabilityAllocation: body.sustainabilityAllocation,
            alerts: body.alerts,
            tags: body.tags,
            createdBy: userId || 'system',
        });

        return NextResponse.json(budget, { status: 201 });
    } catch (error) {
        console.error('Error creating budget:', error);
        return NextResponse.json(
            { error: 'Failed to create budget' },
            { status: 500 }
        );
    }
}
