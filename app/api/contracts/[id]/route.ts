// app/api/contracts/[id]/route.ts - Individual Contract Operations
import { NextRequest, NextResponse } from 'next/server';
import { contractService } from '../../../../lib/contractService';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET /api/contracts/[id] - Get a specific contract
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const contract = await contractService.getContract(id);

        if (!contract) {
            return NextResponse.json(
                { error: 'Contract not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(contract);
    } catch (error) {
        console.error('Error fetching contract:', error);
        return NextResponse.json(
            { error: 'Failed to fetch contract' },
            { status: 500 }
        );
    }
}

interface UpdateContractBody {
    title?: string;
    content?: string;
    status?: 'draft' | 'pending_review' | 'pending_signature' | 'active' | 'expired' | 'terminated' | 'renewed';
    totalValue?: number;
    paymentTerms?: string;
    expirationDate?: string;
    userId: string;
    userName: string;
}

// PATCH /api/contracts/[id] - Update a contract
export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const body = await request.json() as UpdateContractBody;
        const { userId, userName, ...updates } = body;

        if (!userId || !userName) {
            return NextResponse.json(
                { error: 'userId and userName are required' },
                { status: 400 }
            );
        }

        const processedUpdates = {
            ...updates,
            ...(updates.expirationDate && { expirationDate: new Date(updates.expirationDate) }),
        };

        const contract = await contractService.updateContract(
            id,
            processedUpdates,
            userId,
            userName
        );

        if (!contract) {
            return NextResponse.json(
                { error: 'Contract not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(contract);
    } catch (error) {
        console.error('Error updating contract:', error);
        return NextResponse.json(
            { error: 'Failed to update contract' },
            { status: 500 }
        );
    }
}
