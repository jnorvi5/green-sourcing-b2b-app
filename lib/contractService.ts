// lib/contractService.ts - Contract Management Service
import { getDb } from './mongodb';
import { ObjectId } from 'mongodb';

export interface ContractTemplate {
    _id?: ObjectId;
    name: string;
    type: 'purchase' | 'framework' | 'service' | 'nda' | 'custom';
    version: string;
    content: string;
    variables: ContractVariable[];
    clauses: ContractClause[];
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

export interface ContractVariable {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'currency' | 'select';
    required: boolean;
    defaultValue?: string;
    options?: string[]; // For select type
}

export interface ContractClause {
    id: string;
    title: string;
    content: string;
    isRequired: boolean;
    category: 'standard' | 'sustainability' | 'compliance' | 'liability' | 'custom';
}

export interface Contract {
    _id?: ObjectId;
    contractNumber: string;
    templateId?: ObjectId;
    buyerId: string;
    supplierId: string;
    title: string;
    type: 'purchase' | 'framework' | 'service' | 'nda' | 'custom';
    status: 'draft' | 'pending_review' | 'pending_signature' | 'active' | 'expired' | 'terminated' | 'renewed';

    // Contract content
    content: string;
    variables: Record<string, string | number | Date>;
    selectedClauses: string[];

    // Financial terms
    totalValue: number;
    currency: string;
    paymentTerms: string;
    paymentSchedule?: PaymentSchedule[];

    // Dates
    effectiveDate: Date;
    expirationDate: Date;
    renewalDate?: Date;
    terminationDate?: Date;

    // Sustainability terms
    sustainabilityCommitments?: SustainabilityCommitment[];
    carbonOffsetRequirements?: CarbonOffsetRequirement;

    // Signatures
    signatures: ContractSignature[];

    // Attachments and history
    attachments: ContractAttachment[];
    auditTrail: ContractAuditEntry[];

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    lastModifiedBy: string;

    // Reminders
    reminders: ContractReminder[];
}

export interface PaymentSchedule {
    dueDate: Date;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    invoiceId?: string;
}

export interface SustainabilityCommitment {
    type: 'carbon_reduction' | 'recycled_content' | 'local_sourcing' | 'certification' | 'reporting';
    target: string;
    deadline: Date;
    verificationMethod: string;
    penalty?: string;
}

export interface CarbonOffsetRequirement {
    targetReduction: number; // percentage
    offsetType: 'direct' | 'verified_credits' | 'both';
    reportingFrequency: 'monthly' | 'quarterly' | 'annually';
    verificationBody?: string;
}

export interface ContractSignature {
    signerId: string;
    signerName: string;
    signerEmail: string;
    signerRole: string;
    company: string;
    signedAt?: Date;
    ipAddress?: string;
    signatureData?: string;
    status: 'pending' | 'signed' | 'declined';
}

export interface ContractAttachment {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: Date;
    uploadedBy: string;
}

export interface ContractAuditEntry {
    timestamp: Date;
    action: string;
    userId: string;
    userName: string;
    details: string;
    metadata?: Record<string, unknown>;
}

export interface ContractReminder {
    id: string;
    type: 'expiration' | 'renewal' | 'payment' | 'review' | 'custom';
    date: Date;
    recipients: string[];
    message: string;
    sent: boolean;
    sentAt?: Date;
}

export const contractService = {
    // Template Management
    async createTemplate(template: Omit<ContractTemplate, '_id' | 'createdAt' | 'updatedAt'>): Promise<ContractTemplate> {
        const db = await getDb('greenchainz');
        const now = new Date();

        const newTemplate: ContractTemplate = {
            ...template,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('contract_templates').insertOne(newTemplate);
        return { ...newTemplate, _id: result.insertedId };
    },

    async getTemplates(type?: string): Promise<ContractTemplate[]> {
        const db = await getDb('greenchainz');
        const query: Record<string, unknown> = { isActive: true };
        if (type) query.type = type;

        return db.collection('contract_templates')
            .find(query)
            .sort({ name: 1 })
            .toArray() as Promise<ContractTemplate[]>;
    },

    async getTemplate(templateId: string): Promise<ContractTemplate | null> {
        const db = await getDb('greenchainz');
        return db.collection('contract_templates').findOne({
            _id: new ObjectId(templateId),
        }) as Promise<ContractTemplate | null>;
    },

    // Contract CRUD
    async createContract(contract: Omit<Contract, '_id' | 'contractNumber' | 'createdAt' | 'updatedAt' | 'auditTrail'>): Promise<Contract> {
        const db = await getDb('greenchainz');
        const now = new Date();

        // Generate unique contract number
        const year = now.getFullYear();
        const count = await db.collection('contracts').countDocuments({
            createdAt: {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year + 1, 0, 1),
            },
        });
        const contractNumber = `GCZ-${year}-${String(count + 1).padStart(5, '0')}`;

        const newContract: Contract = {
            ...contract,
            contractNumber,
            createdAt: now,
            updatedAt: now,
            auditTrail: [{
                timestamp: now,
                action: 'created',
                userId: contract.createdBy,
                userName: contract.createdBy,
                details: 'Contract created',
            }],
        };

        const result = await db.collection('contracts').insertOne(newContract);
        return { ...newContract, _id: result.insertedId };
    },

    async getContract(contractId: string): Promise<Contract | null> {
        const db = await getDb('greenchainz');
        return db.collection('contracts').findOne({
            _id: new ObjectId(contractId),
        }) as Promise<Contract | null>;
    },

    async getContractByNumber(contractNumber: string): Promise<Contract | null> {
        const db = await getDb('greenchainz');
        return db.collection('contracts').findOne({ contractNumber }) as Promise<Contract | null>;
    },

    async updateContract(
        contractId: string,
        updates: Partial<Contract>,
        userId: string,
        userName: string
    ): Promise<Contract | null> {
        const db = await getDb('greenchainz');
        const now = new Date();

        const result = await db.collection('contracts').findOneAndUpdate(
            { _id: new ObjectId(contractId) },
            {
                $set: {
                    ...updates,
                    updatedAt: now,
                    lastModifiedBy: userId,
                },
                $push: {
                    auditTrail: {
                        timestamp: now,
                        action: 'updated',
                        userId,
                        userName,
                        details: `Contract updated: ${Object.keys(updates).join(', ')}`,
                        metadata: updates,
                    },
                },
            },
            { returnDocument: 'after' }
        );

        return result as Contract | null;
    },

    async listContracts(
        filters: {
            buyerId?: string;
            supplierId?: string;
            status?: string | string[];
            type?: string;
            search?: string;
        },
        pagination: { page: number; limit: number } = { page: 1, limit: 20 }
    ): Promise<{ contracts: Contract[]; total: number; pages: number }> {
        const db = await getDb('greenchainz');
        const query: Record<string, unknown> = {};

        if (filters.buyerId) query.buyerId = filters.buyerId;
        if (filters.supplierId) query.supplierId = filters.supplierId;
        if (filters.status) {
            query.status = Array.isArray(filters.status) ? { $in: filters.status } : filters.status;
        }
        if (filters.type) query.type = filters.type;
        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { contractNumber: { $regex: filters.search, $options: 'i' } },
            ];
        }

        const skip = (pagination.page - 1) * pagination.limit;

        const [contracts, total] = await Promise.all([
            db.collection('contracts')
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pagination.limit)
                .toArray(),
            db.collection('contracts').countDocuments(query),
        ]);

        return {
            contracts: contracts as Contract[],
            total,
            pages: Math.ceil(total / pagination.limit),
        };
    },

    // Signature Management
    async requestSignature(contractId: string, signers: Omit<ContractSignature, 'status'>[]): Promise<Contract | null> {
        const db = await getDb('greenchainz');
        const now = new Date();

        const signatures: ContractSignature[] = signers.map((s) => ({
            ...s,
            status: 'pending',
        }));

        return db.collection('contracts').findOneAndUpdate(
            { _id: new ObjectId(contractId) },
            {
                $set: {
                    signatures,
                    status: 'pending_signature',
                    updatedAt: now,
                },
                $push: {
                    auditTrail: {
                        timestamp: now,
                        action: 'signature_requested',
                        userId: 'system',
                        userName: 'System',
                        details: `Signature requested from ${signers.length} parties`,
                    },
                },
            },
            { returnDocument: 'after' }
        ) as Promise<Contract | null>;
    },

    async recordSignature(
        contractId: string,
        signerId: string,
        signatureData: string,
        ipAddress: string
    ): Promise<Contract | null> {
        const db = await getDb('greenchainz');
        const now = new Date();

        const contract = await this.getContract(contractId);
        if (!contract) return null;

        const updatedSignatures = contract.signatures.map((sig) => {
            if (sig.signerId === signerId) {
                return {
                    ...sig,
                    signedAt: now,
                    signatureData,
                    ipAddress,
                    status: 'signed' as const,
                };
            }
            return sig;
        });

        // Check if all signatures are complete
        const allSigned = updatedSignatures.every((s) => s.status === 'signed');
        const newStatus = allSigned ? 'active' : 'pending_signature';

        return db.collection('contracts').findOneAndUpdate(
            { _id: new ObjectId(contractId) },
            {
                $set: {
                    signatures: updatedSignatures,
                    status: newStatus,
                    updatedAt: now,
                    ...(allSigned && { effectiveDate: now }),
                },
                $push: {
                    auditTrail: {
                        timestamp: now,
                        action: 'signed',
                        userId: signerId,
                        userName: updatedSignatures.find((s) => s.signerId === signerId)?.signerName || signerId,
                        details: allSigned ? 'All parties signed - contract is now active' : 'Signature recorded',
                    },
                },
            },
            { returnDocument: 'after' }
        ) as Promise<Contract | null>;
    },

    // Contract Lifecycle
    async renewContract(contractId: string, newExpirationDate: Date, userId: string): Promise<Contract | null> {
        const db = await getDb('greenchainz');
        const now = new Date();

        return db.collection('contracts').findOneAndUpdate(
            { _id: new ObjectId(contractId) },
            {
                $set: {
                    status: 'renewed',
                    renewalDate: now,
                    expirationDate: newExpirationDate,
                    updatedAt: now,
                },
                $push: {
                    auditTrail: {
                        timestamp: now,
                        action: 'renewed',
                        userId,
                        userName: userId,
                        details: `Contract renewed until ${newExpirationDate.toISOString().split('T')[0]}`,
                    },
                },
            },
            { returnDocument: 'after' }
        ) as Promise<Contract | null>;
    },

    async terminateContract(contractId: string, reason: string, userId: string): Promise<Contract | null> {
        const db = await getDb('greenchainz');
        const now = new Date();

        return db.collection('contracts').findOneAndUpdate(
            { _id: new ObjectId(contractId) },
            {
                $set: {
                    status: 'terminated',
                    terminationDate: now,
                    updatedAt: now,
                },
                $push: {
                    auditTrail: {
                        timestamp: now,
                        action: 'terminated',
                        userId,
                        userName: userId,
                        details: `Contract terminated: ${reason}`,
                    },
                },
            },
            { returnDocument: 'after' }
        ) as Promise<Contract | null>;
    },

    // Attachments
    async addAttachment(contractId: string, attachment: ContractAttachment, userId: string): Promise<Contract | null> {
        const db = await getDb('greenchainz');
        const now = new Date();

        return db.collection('contracts').findOneAndUpdate(
            { _id: new ObjectId(contractId) },
            {
                $push: {
                    attachments: attachment,
                    auditTrail: {
                        timestamp: now,
                        action: 'attachment_added',
                        userId,
                        userName: userId,
                        details: `Attachment added: ${attachment.name}`,
                    },
                },
                $set: { updatedAt: now },
            },
            { returnDocument: 'after' }
        ) as Promise<Contract | null>;
    },

    // Reminders
    async setReminder(contractId: string, reminder: ContractReminder): Promise<Contract | null> {
        const db = await getDb('greenchainz');

        return db.collection('contracts').findOneAndUpdate(
            { _id: new ObjectId(contractId) },
            {
                $push: { reminders: reminder },
                $set: { updatedAt: new Date() },
            },
            { returnDocument: 'after' }
        ) as Promise<Contract | null>;
    },

    async getDueReminders(): Promise<{ contract: Contract; reminder: ContractReminder }[]> {
        const db = await getDb('greenchainz');
        const now = new Date();

        const contracts = await db.collection('contracts').find({
            'reminders.date': { $lte: now },
            'reminders.sent': false,
        }).toArray() as Contract[];

        const dueReminders: { contract: Contract; reminder: ContractReminder }[] = [];

        for (const contract of contracts) {
            const dueRems = contract.reminders.filter((r) =>
                new Date(r.date) <= now && !r.sent
            );
            for (const rem of dueRems) {
                dueReminders.push({ contract, reminder: rem });
            }
        }

        return dueReminders;
    },

    // Analytics
    async getContractAnalytics(organizationId: string, dateRange: { start: Date; end: Date }): Promise<{
        totalContracts: number;
        activeContracts: number;
        expiringContracts: number;
        totalValue: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        renewalRate: number;
        averageContractValue: number;
    }> {
        const db = await getDb('greenchainz');

        const baseQuery = {
            $or: [{ buyerId: organizationId }, { supplierId: organizationId }],
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        };

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const [contracts, activeContracts, expiringContracts] = await Promise.all([
            db.collection('contracts').find(baseQuery).toArray(),
            db.collection('contracts').countDocuments({
                ...baseQuery,
                status: 'active',
            }),
            db.collection('contracts').countDocuments({
                status: 'active',
                expirationDate: { $lte: thirtyDaysFromNow },
                $or: [{ buyerId: organizationId }, { supplierId: organizationId }],
            }),
        ]);

        const byStatus: Record<string, number> = {};
        const byType: Record<string, number> = {};
        let totalValue = 0;
        let renewedCount = 0;
        let expiredCount = 0;

        for (const contract of contracts) {
            const c = contract as Contract;
            byStatus[c.status] = (byStatus[c.status] || 0) + 1;
            byType[c.type] = (byType[c.type] || 0) + 1;
            totalValue += c.totalValue || 0;
            if (c.status === 'renewed') renewedCount++;
            if (c.status === 'expired') expiredCount++;
        }

        const totalCompleted = renewedCount + expiredCount;
        const renewalRate = totalCompleted > 0 ? (renewedCount / totalCompleted) * 100 : 0;

        return {
            totalContracts: contracts.length,
            activeContracts,
            expiringContracts,
            totalValue,
            byStatus,
            byType,
            renewalRate,
            averageContractValue: contracts.length > 0 ? totalValue / contracts.length : 0,
        };
    },

    // Generate contract from template
    async generateFromTemplate(
        templateId: string,
        variables: Record<string, string | number | Date>,
        contractData: Omit<Contract, '_id' | 'contractNumber' | 'content' | 'variables' | 'selectedClauses' | 'createdAt' | 'updatedAt' | 'auditTrail'>
    ): Promise<Contract> {
        const template = await this.getTemplate(templateId);
        if (!template) throw new Error('Template not found');

        // Replace variables in content
        let content = template.content;
        for (const [key, value] of Object.entries(variables)) {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }

        // Get all clause IDs from template
        const selectedClauses = template.clauses.map((c) => c.id);

        return this.createContract({
            ...contractData,
            templateId: template._id,
            content,
            variables,
            selectedClauses,
        });
    },
};

export default contractService;
