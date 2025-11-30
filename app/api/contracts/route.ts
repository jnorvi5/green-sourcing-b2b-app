// app/api/contracts/route.ts - Contract Management API
import { NextRequest, NextResponse } from 'next/server';
import { contractService } from '../../../lib/contractService';

interface CreateContractBody {
    templateId?: string;
    buyerId: string;
    supplierId: string;
    title: string;
    type: 'purchase' | 'framework' | 'service' | 'nda' | 'custom';
    content?: string;
    variables?: Record<string, string | number | Date>;
    totalValue: number;
    currency: string;
    paymentTerms: string;
    effectiveDate: string;
    expirationDate: string;
    sustainabilityCommitments?: {
        type: string;
        target: string;
        deadline: string;
        verificationMethod: string;
        penalty?: string;
    }[];
    createdBy: string;
}

// GET /api/contracts - List contracts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const buyerId = searchParams.get('buyerId') || undefined;
        const supplierId = searchParams.get('supplierId') || undefined;
        const status = searchParams.get('status') || undefined;
        const type = searchParams.get('type') || undefined;
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await contractService.listContracts(
            { buyerId, supplierId, status, type, search },
            { page, limit }
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error listing contracts:', error);
        return NextResponse.json(
            { error: 'Failed to list contracts' },
            { status: 500 }
        );
    }
}

// POST /api/contracts - Create a new contract
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CreateContractBody;
        const {
            templateId,
            buyerId,
            supplierId,
            title,
            type,
            content,
            variables,
            totalValue,
            currency,
            paymentTerms,
            effectiveDate,
            expirationDate,
            sustainabilityCommitments,
            createdBy,
        } = body;

        if (!buyerId || !supplierId || !title || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        let contract;

        if (templateId && variables) {
            // Generate from template
            contract = await contractService.generateFromTemplate(
                templateId,
                variables,
                {
                    buyerId,
                    supplierId,
                    title,
                    type,
                    status: 'draft',
                    totalValue: totalValue || 0,
                    currency: currency || 'USD',
                    paymentTerms: paymentTerms || 'Net 30',
                    effectiveDate: new Date(effectiveDate),
                    expirationDate: new Date(expirationDate),
                    sustainabilityCommitments: sustainabilityCommitments?.map((sc) => ({
                        ...sc,
                        type: sc.type as 'carbon_reduction' | 'recycled_content' | 'local_sourcing' | 'certification' | 'reporting',
                        deadline: new Date(sc.deadline),
                    })),
                    signatures: [],
                    attachments: [],
                    reminders: [],
                    createdBy,
                    lastModifiedBy: createdBy,
                }
            );
        } else {
            // Create custom contract
            contract = await contractService.createContract({
                buyerId,
                supplierId,
                title,
                type,
                status: 'draft',
                content: content || '',
                variables: variables || {},
                selectedClauses: [],
                totalValue: totalValue || 0,
                currency: currency || 'USD',
                paymentTerms: paymentTerms || 'Net 30',
                effectiveDate: new Date(effectiveDate),
                expirationDate: new Date(expirationDate),
                sustainabilityCommitments: sustainabilityCommitments?.map((sc) => ({
                    ...sc,
                    type: sc.type as 'carbon_reduction' | 'recycled_content' | 'local_sourcing' | 'certification' | 'reporting',
                    deadline: new Date(sc.deadline),
                })),
                signatures: [],
                attachments: [],
                reminders: [],
                createdBy,
                lastModifiedBy: createdBy,
            });
        }

        return NextResponse.json(contract, { status: 201 });
    } catch (error) {
        console.error('Error creating contract:', error);
        return NextResponse.json(
            { error: 'Failed to create contract' },
            { status: 500 }
        );
    }
}
