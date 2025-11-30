/**
 * Document API Routes
 * 
 * Endpoints for:
 * - POST /api/documents - Create document
 * - GET /api/documents - List/search documents
 * - GET /api/documents?id=xxx - Get document
 * - PUT /api/documents - Update document
 * - DELETE /api/documents - Delete document
 */
import { NextRequest, NextResponse } from 'next/server';
import { documentService, DocumentType, DocumentStatus } from '../../../lib/documentService';

export const dynamic = 'force-dynamic';

interface DocumentRequestBody {
    action?: string;
    type?: DocumentType;
    title?: string;
    description?: string;
    ownerId?: string;
    ownerType?: 'buyer' | 'supplier' | 'admin';
    companyId?: string;
    orderId?: string;
    rfqId?: string;
    productId?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    fileUrl?: string;
    fileKey?: string;
    metadata?: Record<string, unknown>;
    tags?: string[];
    documentId?: string;
    status?: DocumentStatus;
    userId?: string;
    permission?: 'view' | 'edit' | 'sign';
    expiresIn?: number;
    signature?: {
        signerId: string;
        signerName: string;
        signerEmail: string;
        signatureUrl?: string;
        ipAddress?: string;
    };
    query?: string;
    startDate?: string;
    endDate?: string;
}

// GET - List or retrieve documents
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const ownerId = searchParams.get('ownerId');
        const orderId = searchParams.get('orderId');
        const productId = searchParams.get('productId');
        const type = searchParams.get('type') as DocumentType | null;
        const status = searchParams.get('status') as DocumentStatus | null;
        const expiring = searchParams.get('expiring');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        // Get single document
        if (id) {
            const doc = await documentService.getById(id);
            if (!doc) {
                return NextResponse.json({ error: 'Document not found' }, { status: 404 });
            }

            // Record download
            const userId = searchParams.get('userId');
            if (userId) {
                await documentService.recordDownload(id, userId);
            }

            return NextResponse.json(doc);
        }

        // Get expiring documents
        if (expiring) {
            const docs = await documentService.getExpiring(parseInt(expiring));
            return NextResponse.json({ documents: docs, count: docs.length });
        }

        // Get documents for order
        if (orderId) {
            const docs = await documentService.getForOrder(orderId);
            return NextResponse.json({ documents: docs, count: docs.length });
        }

        // Get documents for product
        if (productId) {
            const docs = await documentService.getForProduct(productId);
            return NextResponse.json({ documents: docs, count: docs.length });
        }

        // Get documents for owner
        if (ownerId) {
            const docs = await documentService.getForOwner(ownerId, {
                type: type || undefined,
                status: status || undefined,
                limit,
                skip,
            });
            return NextResponse.json({ documents: docs, count: docs.length });
        }

        return NextResponse.json({ error: 'ownerId, orderId, productId, or id required' }, { status: 400 });
    } catch (error) {
        console.error('Document API Error:', error);
        return NextResponse.json({ error: 'Failed to retrieve documents' }, { status: 500 });
    }
}

// POST - Create or manage documents
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as DocumentRequestBody;
        const { action = 'create' } = body;

        switch (action) {
            case 'create':
                // Create document
                if (!body.type || !body.title || !body.ownerId || !body.ownerType ||
                    !body.fileName || !body.fileUrl || !body.fileKey) {
                    return NextResponse.json(
                        { error: 'type, title, ownerId, ownerType, fileName, fileUrl, fileKey required' },
                        { status: 400 }
                    );
                }

                const doc = await documentService.create({
                    type: body.type,
                    title: body.title,
                    description: body.description,
                    ownerId: body.ownerId,
                    ownerType: body.ownerType,
                    companyId: body.companyId,
                    orderId: body.orderId,
                    rfqId: body.rfqId,
                    productId: body.productId,
                    fileName: body.fileName,
                    fileSize: body.fileSize || 0,
                    mimeType: body.mimeType || 'application/octet-stream',
                    fileUrl: body.fileUrl,
                    fileKey: body.fileKey,
                    metadata: body.metadata as Parameters<typeof documentService.create>[0]['metadata'],
                    tags: body.tags,
                });

                return NextResponse.json({ success: true, document: doc });

            case 'share':
                // Share document
                if (!body.documentId || !body.userId || !body.permission) {
                    return NextResponse.json(
                        { error: 'documentId, userId, permission required' },
                        { status: 400 }
                    );
                }

                const shared = await documentService.share(
                    body.documentId,
                    body.userId,
                    body.permission,
                    body.expiresIn
                );

                return NextResponse.json({ success: true, document: shared });

            case 'sign':
                // Add signature
                if (!body.documentId || !body.signature) {
                    return NextResponse.json(
                        { error: 'documentId, signature required' },
                        { status: 400 }
                    );
                }

                const signed = await documentService.addSignature(body.documentId, body.signature);
                return NextResponse.json({ success: true, document: signed });

            case 'version':
                // Create new version
                if (!body.documentId || !body.fileName || !body.fileUrl || !body.fileKey) {
                    return NextResponse.json(
                        { error: 'documentId, fileName, fileUrl, fileKey required' },
                        { status: 400 }
                    );
                }

                const versioned = await documentService.createVersion(body.documentId, {
                    fileName: body.fileName,
                    fileSize: body.fileSize || 0,
                    mimeType: body.mimeType || 'application/octet-stream',
                    fileUrl: body.fileUrl,
                    fileKey: body.fileKey,
                });

                return NextResponse.json({ success: true, document: versioned });

            case 'search':
                // Search documents
                const results = await documentService.search({
                    query: body.query,
                    type: body.type,
                    status: body.status,
                    ownerId: body.ownerId,
                    companyId: body.companyId,
                    tags: body.tags,
                    startDate: body.startDate ? new Date(body.startDate) : undefined,
                    endDate: body.endDate ? new Date(body.endDate) : undefined,
                });

                return NextResponse.json(results);

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Document API Error:', error);
        return NextResponse.json({ error: 'Document operation failed' }, { status: 500 });
    }
}

// PUT - Update document
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json() as DocumentRequestBody;
        const { documentId, status } = body;

        if (!documentId) {
            return NextResponse.json({ error: 'documentId required' }, { status: 400 });
        }

        if (status) {
            const updated = await documentService.updateStatus(documentId, status);
            return NextResponse.json({ success: true, document: updated });
        }

        return NextResponse.json({ error: 'No update parameters provided' }, { status: 400 });
    } catch (error) {
        console.error('Document API Error:', error);
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }
}

// DELETE - Delete document
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const deleted = await documentService.delete(id);

        if (!deleted) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Document deleted' });
    } catch (error) {
        console.error('Document API Error:', error);
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}
