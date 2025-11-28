// app/api/budgets/[id]/expenses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { budgetService, Expense } from '../../../../../lib/budgetService';

interface CreateExpenseRequest {
    categoryId: string;
    periodId?: string;
    description: string;
    amount: number;
    currency?: string;
    vendor?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    sustainabilityImpact?: {
        carbonSavings?: number;
        isGreenPurchase: boolean;
        certifications?: string[];
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: budgetId } = await params;
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        const filters = {
            budgetId,
            categoryId: searchParams.get('categoryId') || undefined,
            status: searchParams.get('status') as Expense['status'] | undefined,
            fromDate: searchParams.get('fromDate')
                ? new Date(searchParams.get('fromDate')!)
                : undefined,
            toDate: searchParams.get('toDate')
                ? new Date(searchParams.get('toDate')!)
                : undefined,
            vendor: searchParams.get('vendor') || undefined,
        };

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await budgetService.listExpenses(
            organizationId,
            filters,
            { page, limit }
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error listing expenses:', error);
        return NextResponse.json(
            { error: 'Failed to list expenses' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: budgetId } = await params;
        const body = await request.json() as CreateExpenseRequest;
        const organizationId = request.headers.get('x-organization-id');
        const userId = request.headers.get('x-user-id');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        if (!body.categoryId || !body.description || !body.amount) {
            return NextResponse.json(
                { error: 'Category ID, description, and amount are required' },
                { status: 400 }
            );
        }

        const expense = await budgetService.createExpense({
            organizationId,
            budgetId,
            categoryId: body.categoryId,
            periodId: body.periodId,
            description: body.description,
            amount: body.amount,
            currency: body.currency || 'USD',
            vendor: body.vendor,
            invoiceNumber: body.invoiceNumber,
            invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
            status: 'pending',
            sustainabilityImpact: body.sustainabilityImpact,
            createdBy: userId || 'system',
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json(
            { error: 'Failed to create expense' },
            { status: 500 }
        );
    }
}
