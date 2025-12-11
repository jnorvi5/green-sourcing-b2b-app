/**
 * Document Management Service
 * 
 * Handles all document storage and management:
 * - Contracts
 * - Invoices
 * - Certificates
 * - EPDs
 * - Purchase Orders
 * - Shipping Documents
 */
import { getMainDB } from './databases';
import mongoose, { Schema, Document, Model } from 'mongoose';

// ==================== Types ====================
export type DocumentType =
    | 'contract'
    | 'invoice'
    | 'purchase_order'
    | 'quote'
    | 'certificate'
    | 'epd'
    | 'spec_sheet'
    | 'msds'
    | 'shipping_label'
    | 'bill_of_lading'
    | 'packing_list'
    | 'customs_declaration'
    | 'insurance_certificate'
    | 'test_report'
    | 'compliance_doc'
    | 'other';

export type DocumentStatus =
    | 'draft'
    | 'pending_review'
    | 'approved'
    | 'rejected'
    | 'signed'
    | 'expired'
    | 'archived';

// ==================== Interfaces ====================
export interface IDocument extends Document {
    type: DocumentType;
    status: DocumentStatus;
    title: string;
    description?: string;

    // Ownership
    ownerId: mongoose.Types.ObjectId;
    ownerType: 'buyer' | 'supplier' | 'admin';
    companyId?: mongoose.Types.ObjectId;

    // Relations
    orderId?: mongoose.Types.ObjectId;
    rfqId?: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    invoiceId?: mongoose.Types.ObjectId;

    // File info
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
    fileKey: string; // S3 key
    thumbnailUrl?: string;

    // Versioning
    version: number;
    previousVersionId?: mongoose.Types.ObjectId;

    // Metadata
    metadata?: {
        pageCount?: number;
        language?: string;
        expirationDate?: Date;
        certificationBody?: string;
        certificationNumber?: string;
        validFrom?: Date;
        validTo?: Date;
    };

    // Signatures
    signatures?: Array<{
        signerId: mongoose.Types.ObjectId;
        signerName: string;
        signerEmail: string;
        signedAt: Date;
        signatureUrl?: string;
        ipAddress?: string;
    }>;

    // Access control
    accessLevel: 'private' | 'shared' | 'public';
    sharedWith?: Array<{
        userId: mongoose.Types.ObjectId;
        permission: 'view' | 'edit' | 'sign';
        sharedAt: Date;
        expiresAt?: Date;
    }>;

    // Audit
    downloadCount: number;
    lastDownloadedAt?: Date;
    lastDownloadedBy?: mongoose.Types.ObjectId;

    // Tags
    tags?: string[];

    createdAt: Date;
    updatedAt: Date;
}

export interface IDocumentTemplate extends Document {
    name: string;
    type: DocumentType;
    description?: string;

    // Template content
    templateUrl: string;
    templateKey: string;

    // Placeholders
    placeholders: Array<{
        key: string;
        label: string;
        type: 'text' | 'number' | 'date' | 'signature' | 'checkbox';
        required: boolean;
        defaultValue?: string;
    }>;

    // Settings
    isActive: boolean;
    usageCount: number;

    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

// ==================== Schemas ====================
const DocumentSchema = new Schema<IDocument>(
    {
        type: {
            type: String,
            required: true,
            enum: [
                'contract', 'invoice', 'purchase_order', 'quote',
                'certificate', 'epd', 'spec_sheet', 'msds',
                'shipping_label', 'bill_of_lading', 'packing_list',
                'customs_declaration', 'insurance_certificate',
                'test_report', 'compliance_doc', 'other',
            ],
            index: true,
        },
        status: {
            type: String,
            enum: ['draft', 'pending_review', 'approved', 'rejected', 'signed', 'expired', 'archived'],
            default: 'draft',
            index: true,
        },
        title: { type: String, required: true },
        description: String,

        ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
        ownerType: { type: String, enum: ['buyer', 'supplier', 'admin'], required: true },
        companyId: { type: Schema.Types.ObjectId, index: true },

        orderId: { type: Schema.Types.ObjectId, index: true },
        rfqId: { type: Schema.Types.ObjectId, index: true },
        productId: { type: Schema.Types.ObjectId, index: true },
        invoiceId: { type: Schema.Types.ObjectId, index: true },

        fileName: { type: String, required: true },
        fileSize: { type: Number, required: true },
        mimeType: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileKey: { type: String, required: true },
        thumbnailUrl: String,

        version: { type: Number, default: 1 },
        previousVersionId: Schema.Types.ObjectId,

        metadata: {
            pageCount: Number,
            language: String,
            expirationDate: Date,
            certificationBody: String,
            certificationNumber: String,
            validFrom: Date,
            validTo: Date,
        },

        signatures: [{
            signerId: Schema.Types.ObjectId,
            signerName: String,
            signerEmail: String,
            signedAt: Date,
            signatureUrl: String,
            ipAddress: String,
        }],

        accessLevel: {
            type: String,
            enum: ['private', 'shared', 'public'],
            default: 'private',
        },
        sharedWith: [{
            userId: Schema.Types.ObjectId,
            permission: { type: String, enum: ['view', 'edit', 'sign'] },
            sharedAt: Date,
            expiresAt: Date,
        }],

        downloadCount: { type: Number, default: 0 },
        lastDownloadedAt: Date,
        lastDownloadedBy: Schema.Types.ObjectId,

        tags: [String],
    },
    {
        timestamps: true,
    }
);

// Indexes
DocumentSchema.index({ ownerId: 1, type: 1, createdAt: -1 });
DocumentSchema.index({ companyId: 1, type: 1 });
DocumentSchema.index({ orderId: 1 });
DocumentSchema.index({ tags: 1 });
DocumentSchema.index({ 'metadata.expirationDate': 1 });

const DocumentTemplateSchema = new Schema<IDocumentTemplate>(
    {
        name: { type: String, required: true },
        type: { type: String, required: true },
        description: String,

        templateUrl: { type: String, required: true },
        templateKey: { type: String, required: true },

        placeholders: [{
            key: String,
            label: String,
            type: { type: String, enum: ['text', 'number', 'date', 'signature', 'checkbox'] },
            required: Boolean,
            defaultValue: String,
        }],

        isActive: { type: Boolean, default: true },
        usageCount: { type: Number, default: 0 },

        createdBy: { type: Schema.Types.ObjectId, required: true },
    },
    {
        timestamps: true,
    }
);

// ==================== Model Getters ====================
let DocumentModel: Model<IDocument> | null = null;
let DocumentTemplateModel: Model<IDocumentTemplate> | null = null;

export async function getDocumentModels() {
    const db = await getMainDB();

    if (!DocumentModel) {
        DocumentModel = db.model<IDocument>('Document', DocumentSchema);
    }
    if (!DocumentTemplateModel) {
        DocumentTemplateModel = db.model<IDocumentTemplate>('DocumentTemplate', DocumentTemplateSchema);
    }

    return {
        Document: DocumentModel,
        DocumentTemplate: DocumentTemplateModel,
    };
}

// ==================== Document Service Class ====================
export class DocumentService {

    /**
     * Create a document record
     */
    async create(params: {
        type: DocumentType;
        title: string;
        ownerId: string;
        ownerType: 'buyer' | 'supplier' | 'admin';
        companyId?: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
        fileUrl: string;
        fileKey: string;
        description?: string;
        orderId?: string;
        rfqId?: string;
        productId?: string;
        metadata?: IDocument['metadata'];
        tags?: string[];
    }): Promise<IDocument> {
        const { Document } = await getDocumentModels();

        const doc = new Document({
            type: params.type,
            status: 'draft',
            title: params.title,
            description: params.description,
            ownerId: new mongoose.Types.ObjectId(params.ownerId),
            ownerType: params.ownerType,
            companyId: params.companyId ? new mongoose.Types.ObjectId(params.companyId) : undefined,
            orderId: params.orderId ? new mongoose.Types.ObjectId(params.orderId) : undefined,
            rfqId: params.rfqId ? new mongoose.Types.ObjectId(params.rfqId) : undefined,
            productId: params.productId ? new mongoose.Types.ObjectId(params.productId) : undefined,
            fileName: params.fileName,
            fileSize: params.fileSize,
            mimeType: params.mimeType,
            fileUrl: params.fileUrl,
            fileKey: params.fileKey,
            metadata: params.metadata,
            tags: params.tags,
        });

        await doc.save();
        return doc;
    }

    /**
     * Get document by ID
     */
    async getById(documentId: string): Promise<IDocument | null> {
        const { Document } = await getDocumentModels();
        return Document.findById(documentId).lean() as Promise<IDocument | null>;
    }

    /**
     * Get documents for an owner
     */
    async getForOwner(
        ownerId: string,
        options?: {
            type?: DocumentType;
            status?: DocumentStatus;
            limit?: number;
            skip?: number;
        }
    ): Promise<IDocument[]> {
        const { Document } = await getDocumentModels();

        const query: Record<string, unknown> = { ownerId: new mongoose.Types.ObjectId(ownerId) };
        if (options?.type) query['type'] = options.type;
        if (options?.status) query['status'] = options.status;

        return Document.find(query)
            .sort({ createdAt: -1 })
            .skip(options?.skip || 0)
            .limit(options?.limit || 50)
            .lean() as any as IDocument[];
    }

    /**
     * Get documents for an order
     */
    async getForOrder(orderId: string): Promise<IDocument[]> {
        const { Document } = await getDocumentModels();
        return Document.find({ orderId: new mongoose.Types.ObjectId(orderId) })
            .sort({ type: 1, createdAt: -1 })
            .lean() as any as IDocument[];
    }

    /**
     * Get documents for a product
     */
    async getForProduct(productId: string): Promise<IDocument[]> {
        const { Document } = await getDocumentModels();
        return Document.find({ productId: new mongoose.Types.ObjectId(productId) })
            .sort({ type: 1, createdAt: -1 })
            .lean() as any as IDocument[];
    }

    /**
     * Update document status
     */
    async updateStatus(documentId: string, status: DocumentStatus): Promise<IDocument | null> {
        const { Document } = await getDocumentModels();
        return Document.findByIdAndUpdate(documentId, { status }, { new: true }).lean() as any as IDocument | null;
    }

    /**
     * Share a document
     */
    async share(
        documentId: string,
        userId: string,
        permission: 'view' | 'edit' | 'sign',
        expiresIn?: number // hours
    ): Promise<IDocument | null> {
        const { Document } = await getDocumentModels();

        return Document.findByIdAndUpdate(
            documentId,
            {
                $push: {
                    sharedWith: {
                        userId: new mongoose.Types.ObjectId(userId),
                        permission,
                        sharedAt: new Date(),
                        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 60 * 60 * 1000) : undefined,
                    },
                },
                accessLevel: 'shared',
            },
            { new: true }
        ).lean() as any as IDocument | null;
    }

    /**
     * Add signature
     */
    async addSignature(
        documentId: string,
        signature: {
            signerId: string;
            signerName: string;
            signerEmail: string;
            signatureUrl?: string;
            ipAddress?: string;
        }
    ): Promise<IDocument | null> {
        const { Document } = await getDocumentModels();

        return Document.findByIdAndUpdate(
            documentId,
            {
                $push: {
                    signatures: {
                        signerId: new mongoose.Types.ObjectId(signature.signerId),
                        signerName: signature.signerName,
                        signerEmail: signature.signerEmail,
                        signedAt: new Date(),
                        signatureUrl: signature.signatureUrl,
                        ipAddress: signature.ipAddress,
                    },
                },
                status: 'signed',
            },
            { new: true }
        ).lean() as any as IDocument | null;
    }

    /**
     * Create new version
     */
    async createVersion(
        documentId: string,
        params: {
            fileName: string;
            fileSize: number;
            mimeType: string;
            fileUrl: string;
            fileKey: string;
        }
    ): Promise<IDocument | null> {
        const { Document } = await getDocumentModels();

        const original = await Document.findById(documentId);
        if (!original) return null;

        const newDoc = new Document({
            ...original.toObject(),
            _id: new mongoose.Types.ObjectId(),
            version: original.version + 1,
            previousVersionId: original._id,
            fileName: params.fileName,
            fileSize: params.fileSize,
            mimeType: params.mimeType,
            fileUrl: params.fileUrl,
            fileKey: params.fileKey,
            status: 'draft',
            signatures: [],
            downloadCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await newDoc.save();

        // Archive old version
        await Document.findByIdAndUpdate(documentId, { status: 'archived' });

        return newDoc;
    }

    /**
     * Record download
     */
    async recordDownload(documentId: string, userId?: string): Promise<void> {
        const { Document } = await getDocumentModels();

        await Document.findByIdAndUpdate(documentId, {
            $inc: { downloadCount: 1 },
            lastDownloadedAt: new Date(),
            lastDownloadedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        });
    }

    /**
     * Delete document
     */
    async delete(documentId: string): Promise<boolean> {
        const { Document } = await getDocumentModels();

        // TODO: Also delete from S3
        const result = await Document.findByIdAndDelete(documentId);
        return !!result;
    }

    /**
     * Get expiring documents
     */
    async getExpiring(daysAhead: number = 30): Promise<IDocument[]> {
        const { Document } = await getDocumentModels();

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        return Document.find({
            'metadata.expirationDate': { $lte: futureDate, $gte: new Date() },
            status: { $ne: 'expired' },
        })
            .sort({ 'metadata.expirationDate': 1 })
            .lean() as any as IDocument[];
    }

    /**
     * Search documents
     */
    async search(params: {
        query?: string;
        type?: DocumentType;
        status?: DocumentStatus;
        ownerId?: string;
        companyId?: string;
        tags?: string[];
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        skip?: number;
    }): Promise<{ documents: IDocument[]; total: number }> {
        const { Document } = await getDocumentModels();

        const filter: Record<string, unknown> = {};

        if (params.query) {
            filter['$or'] = [
                { title: { $regex: params.query, $options: 'i' } },
                { description: { $regex: params.query, $options: 'i' } },
                { fileName: { $regex: params.query, $options: 'i' } },
            ];
        }
        if (params.type) filter['type'] = params.type;
        if (params.status) filter['status'] = params.status;
        if (params.ownerId) filter['ownerId'] = new mongoose.Types.ObjectId(params.ownerId);
        if (params.companyId) filter['companyId'] = new mongoose.Types.ObjectId(params.companyId);
        if (params.tags?.length) filter['tags'] = { $in: params.tags };
        if (params.startDate || params.endDate) {
            filter['createdAt'] = {};
            if (params.startDate) (filter['createdAt'] as Record<string, Date>)['$gte'] = params.startDate;
            if (params.endDate) (filter['createdAt'] as Record<string, Date>)['$lte'] = params.endDate;
        }

        const [documents, total] = await Promise.all([
            Document.find(filter)
                .sort({ createdAt: -1 })
                .skip(params.skip || 0)
                .limit(params.limit || 50)
                .lean() as any as IDocument[],
            Document.countDocuments(filter),
        ]);

        return { documents, total };
    }

    // ==================== Templates ====================

    /**
     * Create template
     */
    async createTemplate(params: {
        name: string;
        type: DocumentType;
        description?: string;
        templateUrl: string;
        templateKey: string;
        placeholders: IDocumentTemplate['placeholders'];
        createdBy: string;
    }): Promise<IDocumentTemplate> {
        const { DocumentTemplate } = await getDocumentModels();

        const template = new DocumentTemplate({
            ...params,
            createdBy: new mongoose.Types.ObjectId(params.createdBy),
        });

        await template.save();
        return template;
    }

    /**
     * Get templates
     */
    async getTemplates(type?: DocumentType): Promise<IDocumentTemplate[]> {
        const { DocumentTemplate } = await getDocumentModels();

        const query: Record<string, unknown> = { isActive: true };
        if (type) query['type'] = type;

        return DocumentTemplate.find(query).sort({ usageCount: -1 }).lean() as any as IDocumentTemplate[];
    }

    /**
     * Generate document from template
     */
    async generateFromTemplate(
        templateId: string,
        data: Record<string, string>,
        params: {
            ownerId: string;
            ownerType: 'buyer' | 'supplier' | 'admin';
            title: string;
        }
    ): Promise<IDocument> {
        const { DocumentTemplate, Document } = await getDocumentModels();

        const template = await DocumentTemplate.findById(templateId);
        if (!template) throw new Error('Template not found');

        // TODO: Actually generate PDF with populated placeholders
        // For now, just link to template

        const doc = new Document({
            type: template.type,
            status: 'draft',
            title: params.title,
            ownerId: new mongoose.Types.ObjectId(params.ownerId),
            ownerType: params.ownerType,
            fileName: `${params.title}.pdf`,
            fileSize: 0,
            mimeType: 'application/pdf',
            fileUrl: template.templateUrl,
            fileKey: template.templateKey,
            metadata: { templateData: data } as unknown as IDocument['metadata'],
        });

        await doc.save();

        // Increment template usage
        await DocumentTemplate.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });

        return doc;
    }
}

// Singleton instance
export const documentService = new DocumentService();

export default documentService;
