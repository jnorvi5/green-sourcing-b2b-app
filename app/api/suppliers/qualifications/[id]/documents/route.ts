// app/api/suppliers/qualifications/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supplierQualificationService, QualificationDocument } from '../../../../../../lib/supplierQualificationService';

interface AddDocumentRequest {
    type: QualificationDocument['type'];
    name: string;
    url?: string;
    expirationDate?: string;
}

interface VerifyDocumentRequest {
    documentId: string;
    status: 'approved' | 'rejected';
    notes?: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json() as AddDocumentRequest | VerifyDocumentRequest;
        const userId = request.headers.get('x-user-id') || 'system';

        // Check if this is a verification request
        if ('documentId' in body) {
            const verifyBody = body as VerifyDocumentRequest;
            const qualification = await supplierQualificationService.verifyDocument(
                id,
                verifyBody.documentId,
                verifyBody.status,
                userId,
                verifyBody.notes
            );

            if (!qualification) {
                return NextResponse.json(
                    { error: 'Qualification or document not found' },
                    { status: 404 }
                );
            }

            return NextResponse.json({ message: 'Document verified', qualification });
        }

        // Adding new document
        const addBody = body as AddDocumentRequest;

        if (!addBody.type || !addBody.name) {
            return NextResponse.json(
                { error: 'Document type and name are required' },
                { status: 400 }
            );
        }

        const qualification = await supplierQualificationService.addDocument(id, {
            type: addBody.type,
            name: addBody.name,
            url: addBody.url,
            expirationDate: addBody.expirationDate ? new Date(addBody.expirationDate) : undefined,
            status: 'pending',
        });

        if (!qualification) {
            return NextResponse.json(
                { error: 'Qualification not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(qualification, { status: 201 });
    } catch (error) {
        console.error('Error managing document:', error);
        return NextResponse.json(
            { error: 'Failed to manage document' },
            { status: 500 }
        );
    }
}
