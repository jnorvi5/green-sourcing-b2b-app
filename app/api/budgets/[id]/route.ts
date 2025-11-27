// app/api/budgets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { budgetService, Budget } from '../../../../lib/budgetService';

interface UpdateBudgetRequest {
    name?: string;
    description?: string;
    status?: Budget['status'];
    totalPlanned?: number;
    categories?: Budget['categories'];
    sustainabilityAllocation?: Budget['sustainabilityAllocation'];
    alerts?: Budget['alerts'];
    tags?: string[];
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const budget = await budgetService.getBudget(id);

        if (!budget) {
            return NextResponse.json(
                { error: 'Budget not found' },
                { status: 404 }
            );
        }

        // Also get alerts
        const alerts = await budgetService.checkBudgetAlerts(id);

        return NextResponse.json({ budget, alerts });
    } catch (error) {
        console.error('Error fetching budget:', error);
        return NextResponse.json(
            { error: 'Failed to fetch budget' },
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
        const body = await request.json() as UpdateBudgetRequest;
        const userId = request.headers.get('x-user-id') || 'system';

        const budget = await budgetService.updateBudget(id, body, userId);

        if (!budget) {
            return NextResponse.json(
                { error: 'Budget not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(budget);
    } catch (error) {
        console.error('Error updating budget:', error);
        return NextResponse.json(
            { error: 'Failed to update budget' },
            { status: 500 }
        );
    }
}
