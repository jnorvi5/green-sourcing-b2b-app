// app/api/inventory/transactions/route.ts - Inventory Transactions API
import { NextRequest, NextResponse } from 'next/server';
import { inventoryService, InventoryTransaction } from '../../../../lib/inventoryService';

interface CreateTransactionBody {
    organizationId: string;
    itemId: string;
    itemSku: string;
    type: InventoryTransaction['type'];
    quantity: number;
    unit: string;
    referenceType?: InventoryTransaction['referenceType'];
    referenceId?: string;
    batchNumber?: string;
    serialNumbers?: string[];
    expiryDate?: string;
    fromWarehouse?: string;
    toWarehouse?: string;
    unitCost?: number;
    performedBy: string;
    performedByName: string;
    notes?: string;
}

// GET /api/inventory/transactions - List inventory transactions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const itemId = searchParams.get('itemId') || undefined;
        const type = searchParams.get('type') || undefined;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '100');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'organizationId is required' },
                { status: 400 }
            );
        }

        const dateRange = startDate && endDate
            ? { start: new Date(startDate), end: new Date(endDate) }
            : undefined;

        const transactions = await inventoryService.getTransactions(
            organizationId,
            { itemId, type, dateRange },
            limit
        );

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error listing transactions:', error);
        return NextResponse.json(
            { error: 'Failed to list transactions' },
            { status: 500 }
        );
    }
}

// POST /api/inventory/transactions - Record a new transaction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CreateTransactionBody;
        const {
            organizationId,
            itemId,
            itemSku,
            type,
            quantity,
            unit,
            referenceType,
            referenceId,
            batchNumber,
            serialNumbers,
            expiryDate,
            fromWarehouse,
            toWarehouse,
            unitCost,
            performedBy,
            performedByName,
            notes,
        } = body;

        if (!organizationId || !itemId || !type || quantity === undefined || !performedBy) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const transaction = await inventoryService.recordTransaction({
            organizationId,
            itemId,
            itemSku,
            type,
            quantity,
            unit,
            referenceType,
            referenceId,
            batchNumber,
            serialNumbers,
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            fromWarehouse,
            toWarehouse,
            unitCost,
            totalCost: unitCost ? unitCost * quantity : undefined,
            performedBy,
            performedByName,
            notes,
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        console.error('Error recording transaction:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to record transaction' },
            { status: 500 }
        );
    }
}
