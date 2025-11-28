// app/api/contracts/[id]/sign/route.ts - Contract Signature API
import { NextRequest, NextResponse } from 'next/server';
import { contractService } from '../../../../../lib/contractService';

interface RouteContext {
    params: Promise<{ id: string }>;
}

interface SignatureRequestBody {
    signers: {
        signerId: string;
        signerName: string;
        signerEmail: string;
        signerRole: string;
        company: string;
    }[];
}

interface RecordSignatureBody {
    signerId: string;
    signatureData: string;
}

// POST /api/contracts/[id]/sign - Request signatures or record a signature
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id } = await context.params;
        const body = await request.json() as SignatureRequestBody | RecordSignatureBody;

        // Get client IP for signature recording
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

        // Check if this is a signature request or recording
        if ('signers' in body) {
            // Request signatures from multiple parties
            const { signers } = body;

            if (!signers || signers.length === 0) {
                return NextResponse.json(
                    { error: 'At least one signer is required' },
                    { status: 400 }
                );
            }

            const contract = await contractService.requestSignature(id, signers);

            if (!contract) {
                return NextResponse.json(
                    { error: 'Contract not found' },
                    { status: 404 }
                );
            }

            // In production, this would send emails to signers
            // await sendSignatureRequestEmails(contract, signers);

            return NextResponse.json({
                success: true,
                message: `Signature request sent to ${signers.length} parties`,
                contract,
            });
        } else if ('signerId' in body && 'signatureData' in body) {
            // Record a signature
            const { signerId, signatureData } = body;

            if (!signerId || !signatureData) {
                return NextResponse.json(
                    { error: 'signerId and signatureData are required' },
                    { status: 400 }
                );
            }

            const contract = await contractService.recordSignature(
                id,
                signerId,
                signatureData,
                ip
            );

            if (!contract) {
                return NextResponse.json(
                    { error: 'Contract not found or signer not authorized' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                message: contract.status === 'active'
                    ? 'All signatures collected - contract is now active'
                    : 'Signature recorded successfully',
                contract,
            });
        }

        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error processing signature:', error);
        return NextResponse.json(
            { error: 'Failed to process signature' },
            { status: 500 }
        );
    }
}
