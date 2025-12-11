// lib/supplierQualificationService.ts
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env['MONGODB_URI'] || '';

export interface QualificationCriteria {
    id: string;
    name: string;
    category: 'financial' | 'operational' | 'sustainability' | 'quality' | 'compliance' | 'social';
    weight: number; // 0-100
    required: boolean;
    description?: string;
    scoringMethod: 'binary' | 'scale' | 'calculated';
    passingScore?: number;
}

export interface QualificationDocument {
    id: string;
    type: 'certification' | 'audit_report' | 'financial_statement' | 'insurance' | 'license' | 'policy' | 'other';
    name: string;
    url?: string;
    expirationDate?: Date;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    verifiedBy?: string;
    verifiedAt?: Date;
    notes?: string;
}

export interface QualificationScore {
    criteriaId: string;
    criteriaName: string;
    score: number;
    maxScore: number;
    weight: number;
    weightedScore: number;
    evidence?: string;
    evaluatedAt: Date;
    evaluatedBy: string;
}

export interface RiskAssessment {
    category: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigationPlan?: string;
    reviewDate?: Date;
}

export interface SupplierQualification {
    _id?: ObjectId;
    qualificationId: string;
    supplierId: string;
    supplierName: string;
    organizationId: string;

    status: 'pending' | 'in_review' | 'qualified' | 'conditionally_qualified' | 'disqualified' | 'suspended';

    tier: 'preferred' | 'approved' | 'provisional' | 'restricted';

    overallScore: number;
    scores: QualificationScore[];

    documents: QualificationDocument[];

    riskAssessment: RiskAssessment[];
    overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';

    certifications: Array<{
        name: string;
        issuer: string;
        validFrom: Date;
        validUntil: Date;
        status: 'valid' | 'expiring_soon' | 'expired';
    }>;

    sustainabilityProfile?: {
        carbonFootprintScore: number;
        renewableEnergyUsage: number;
        wasteReductionScore: number;
        ethicalSourcingScore: number;
        overallSustainabilityScore: number;
    };

    complianceChecks: Array<{
        type: string;
        status: 'passed' | 'failed' | 'pending';
        checkedAt: Date;
        nextCheckDue?: Date;
        notes?: string;
    }>;

    performanceHistory?: {
        onTimeDeliveryRate: number;
        qualityScore: number;
        responseTime: number;
        issueResolutionRate: number;
    };

    qualificationDate?: Date;
    requalificationDue?: Date;
    lastReviewDate?: Date;
    nextReviewDate?: Date;

    reviewHistory: Array<{
        date: Date;
        reviewer: string;
        action: string;
        notes?: string;
    }>;

    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}

export interface ComplianceRequirement {
    _id?: ObjectId;
    requirementId: string;
    organizationId: string;
    name: string;
    category: 'regulatory' | 'industry' | 'internal' | 'sustainability';
    description: string;
    mandatory: boolean;
    applicableSupplierTiers: string[];
    documentRequired?: string;
    frequency: 'one_time' | 'annual' | 'quarterly' | 'monthly';
    createdAt: Date;
    updatedAt: Date;
}

class SupplierQualificationService {
    private client: MongoClient | null = null;

    private async getClient(): Promise<MongoClient> {
        if (!this.client) {
            this.client = new MongoClient(uri);
            await this.client.connect();
        }
        return this.client;
    }

    private async getQualificationCollection() {
        const client = await this.getClient();
        return client.db('suppliers').collection<SupplierQualification>('qualifications');
    }

    private async getRequirementCollection() {
        const client = await this.getClient();
        return client.db('suppliers').collection<ComplianceRequirement>('compliance_requirements');
    }

    private generateQualificationId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `QUAL-${timestamp}-${random}`.toUpperCase();
    }

    // Default qualification criteria
    getDefaultCriteria(): QualificationCriteria[] {
        return [
            {
                id: 'fin-stability',
                name: 'Financial Stability',
                category: 'financial',
                weight: 15,
                required: true,
                description: 'Assessment of financial health and stability',
                scoringMethod: 'scale',
                passingScore: 60,
            },
            {
                id: 'quality-system',
                name: 'Quality Management System',
                category: 'quality',
                weight: 20,
                required: true,
                description: 'ISO 9001 or equivalent certification',
                scoringMethod: 'binary',
            },
            {
                id: 'env-management',
                name: 'Environmental Management',
                category: 'sustainability',
                weight: 15,
                required: false,
                description: 'ISO 14001 or equivalent environmental certification',
                scoringMethod: 'binary',
            },
            {
                id: 'carbon-footprint',
                name: 'Carbon Footprint Disclosure',
                category: 'sustainability',
                weight: 10,
                required: true,
                description: 'Documented carbon footprint measurement and reduction goals',
                scoringMethod: 'scale',
                passingScore: 50,
            },
            {
                id: 'ethical-sourcing',
                name: 'Ethical Sourcing Practices',
                category: 'social',
                weight: 10,
                required: true,
                description: 'Demonstrated ethical and fair labor practices',
                scoringMethod: 'scale',
                passingScore: 70,
            },
            {
                id: 'delivery-capability',
                name: 'Delivery Capability',
                category: 'operational',
                weight: 15,
                required: true,
                description: 'Track record of on-time delivery',
                scoringMethod: 'calculated',
                passingScore: 85,
            },
            {
                id: 'regulatory-compliance',
                name: 'Regulatory Compliance',
                category: 'compliance',
                weight: 15,
                required: true,
                description: 'Compliance with applicable laws and regulations',
                scoringMethod: 'binary',
            },
        ];
    }

    async createQualification(
        data: Omit<SupplierQualification, '_id' | 'qualificationId' | 'overallScore' | 'overallRiskLevel' | 'createdAt' | 'updatedAt'>
    ): Promise<SupplierQualification> {
        const collection = await this.getQualificationCollection();

        // Calculate overall score
        const overallScore = this.calculateOverallScore(data.scores);

        // Calculate overall risk level
        const overallRiskLevel = this.calculateOverallRiskLevel(data.riskAssessment);

        const qualification: SupplierQualification = {
            ...data,
            qualificationId: this.generateQualificationId(),
            overallScore,
            overallRiskLevel,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(qualification);
        return { ...qualification, _id: result.insertedId };
    }

    async getQualification(qualificationId: string): Promise<SupplierQualification | null> {
        const collection = await this.getQualificationCollection();
        return collection.findOne({ qualificationId });
    }

    async getQualificationBySupplierId(supplierId: string): Promise<SupplierQualification | null> {
        const collection = await this.getQualificationCollection();
        return collection.findOne({ supplierId });
    }

    async listQualifications(
        organizationId: string,
        filters?: {
            status?: SupplierQualification['status'];
            tier?: SupplierQualification['tier'];
            riskLevel?: SupplierQualification['overallRiskLevel'];
            requalificationDue?: boolean;
        }
    ): Promise<SupplierQualification[]> {
        const collection = await this.getQualificationCollection();

        const query: Record<string, unknown> = { organizationId };

        if (filters?.status) query['status'] = filters.status;
        if (filters?.tier) query['tier'] = filters.tier;
        if (filters?.riskLevel) query['overallRiskLevel'] = filters.riskLevel;

        if (filters?.requalificationDue) {
            const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            query['requalificationDue'] = { $lte: thirtyDaysFromNow };
        }

        return collection.find(query).sort({ updatedAt: -1 }).toArray();
    }

    async updateQualification(
        qualificationId: string,
        updates: Partial<SupplierQualification>,
        updatedBy: string
    ): Promise<SupplierQualification | null> {
        const collection = await this.getQualificationCollection();

        // Recalculate scores if scores are updated
        if (updates.scores) {
            updates.overallScore = this.calculateOverallScore(updates.scores);
        }

        // Recalculate risk if risk assessment is updated
        if (updates.riskAssessment) {
            updates.overallRiskLevel = this.calculateOverallRiskLevel(updates.riskAssessment);
        }

        // Add to review history
        const reviewEntry = {
            date: new Date(),
            reviewer: updatedBy,
            action: 'Updated qualification',
            notes: `Fields updated: ${Object.keys(updates).join(', ')}`,
        };

        const result = await collection.findOneAndUpdate(
            { qualificationId },
            {
                $set: { ...updates, updatedAt: new Date() },
                $push: { reviewHistory: reviewEntry }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    async evaluateCriteria(
        qualificationId: string,
        scores: QualificationScore[],
        evaluatedBy: string
    ): Promise<SupplierQualification | null> {
        const overallScore = this.calculateOverallScore(scores);

        // Determine status and tier based on score
        let status: SupplierQualification['status'] = 'in_review';
        let tier: SupplierQualification['tier'] = 'restricted';

        if (overallScore >= 85) {
            status = 'qualified';
            tier = 'preferred';
        } else if (overallScore >= 70) {
            status = 'qualified';
            tier = 'approved';
        } else if (overallScore >= 55) {
            status = 'conditionally_qualified';
            tier = 'provisional';
        } else {
            status = 'disqualified';
            tier = 'restricted';
        }

        return this.updateQualification(
            qualificationId,
            {
                scores,
                overallScore,
                status,
                tier,
                qualificationDate: status === 'qualified' ? new Date() : undefined,
                requalificationDue: status === 'qualified'
                    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    : undefined,
            },
            evaluatedBy
        );
    }

    async addDocument(
        qualificationId: string,
        document: Omit<QualificationDocument, 'id'>
    ): Promise<SupplierQualification | null> {
        const collection = await this.getQualificationCollection();

        const docWithId: QualificationDocument = {
            ...document,
            id: new ObjectId().toString(),
        };

        const result = await collection.findOneAndUpdate(
            { qualificationId },
            {
                $push: { documents: docWithId },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    async verifyDocument(
        qualificationId: string,
        documentId: string,
        status: 'approved' | 'rejected',
        verifiedBy: string,
        notes?: string
    ): Promise<SupplierQualification | null> {
        const collection = await this.getQualificationCollection();

        const result = await collection.findOneAndUpdate(
            {
                qualificationId,
                'documents.id': documentId
            },
            {
                $set: {
                    'documents.$.status': status,
                    'documents.$.verifiedBy': verifiedBy,
                    'documents.$.verifiedAt': new Date(),
                    'documents.$.notes': notes,
                    updatedAt: new Date(),
                }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    async performRiskAssessment(
        qualificationId: string,
        assessments: RiskAssessment[],
        assessedBy: string
    ): Promise<SupplierQualification | null> {
        const overallRiskLevel = this.calculateOverallRiskLevel(assessments);

        return this.updateQualification(
            qualificationId,
            {
                riskAssessment: assessments,
                overallRiskLevel,
            },
            assessedBy
        );
    }

    async runComplianceCheck(
        qualificationId: string,
        checkType: string,
        status: 'passed' | 'failed',
        notes?: string
    ): Promise<SupplierQualification | null> {
        const collection = await this.getQualificationCollection();

        const check = {
            type: checkType,
            status,
            checkedAt: new Date(),
            nextCheckDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            notes,
        };

        const result = await collection.findOneAndUpdate(
            { qualificationId },
            {
                $push: { complianceChecks: check },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );

        return result;
    }

    async getExpiringCertifications(
        organizationId: string,
        daysAhead: number = 60
    ): Promise<Array<{
        supplier: string;
        supplierId: string;
        certification: string;
        expirationDate: Date;
        daysUntilExpiry: number;
    }>> {
        const collection = await this.getQualificationCollection();
        const cutoffDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

        const qualifications = await collection.find({
            organizationId,
            'certifications.validUntil': { $lte: cutoffDate },
        }).toArray();

        const expiring: Array<{
            supplier: string;
            supplierId: string;
            certification: string;
            expirationDate: Date;
            daysUntilExpiry: number;
        }> = [];

        qualifications.forEach(q => {
            q.certifications.forEach(cert => {
                if (new Date(cert.validUntil) <= cutoffDate) {
                    const daysUntilExpiry = Math.ceil(
                        (new Date(cert.validUntil).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
                    );
                    expiring.push({
                        supplier: q.supplierName,
                        supplierId: q.supplierId,
                        certification: cert.name,
                        expirationDate: cert.validUntil,
                        daysUntilExpiry,
                    });
                }
            });
        });

        return expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    }

    async getQualificationDashboard(organizationId: string): Promise<{
        summary: {
            total: number;
            qualified: number;
            conditionallyQualified: number;
            pendingReview: number;
            disqualified: number;
        };
        byTier: Record<string, number>;
        byRiskLevel: Record<string, number>;
        upcomingRequalifications: number;
        expiringCertifications: number;
        averageScore: number;
    }> {
        const collection = await this.getQualificationCollection();

        const qualifications = await collection.find({ organizationId }).toArray();

        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysFromNow = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        const summary = {
            total: qualifications.length,
            qualified: qualifications.filter(q => q.status === 'qualified').length,
            conditionallyQualified: qualifications.filter(q => q.status === 'conditionally_qualified').length,
            pendingReview: qualifications.filter(q => ['pending', 'in_review'].includes(q.status)).length,
            disqualified: qualifications.filter(q => q.status === 'disqualified').length,
        };

        const byTier: Record<string, number> = {};
        const byRiskLevel: Record<string, number> = {};

        qualifications.forEach(q => {
            byTier[q.tier] = (byTier[q.tier] || 0) + 1;
            byRiskLevel[q.overallRiskLevel] = (byRiskLevel[q.overallRiskLevel] || 0) + 1;
        });

        const upcomingRequalifications = qualifications.filter(
            q => q.requalificationDue && new Date(q.requalificationDue) <= thirtyDaysFromNow
        ).length;

        let expiringCertifications = 0;
        qualifications.forEach(q => {
            q.certifications.forEach(cert => {
                if (new Date(cert.validUntil) <= sixtyDaysFromNow) {
                    expiringCertifications++;
                }
            });
        });

        const totalScore = qualifications.reduce((sum, q) => sum + q.overallScore, 0);
        const averageScore = qualifications.length > 0
            ? Math.round(totalScore / qualifications.length)
            : 0;

        return {
            summary,
            byTier,
            byRiskLevel,
            upcomingRequalifications,
            expiringCertifications,
            averageScore,
        };
    }

    // Compliance Requirements
    async createRequirement(
        data: Omit<ComplianceRequirement, '_id' | 'requirementId' | 'createdAt' | 'updatedAt'>
    ): Promise<ComplianceRequirement> {
        const collection = await this.getRequirementCollection();

        const requirement: ComplianceRequirement = {
            ...data,
            requirementId: `REQ-${Date.now().toString(36)}`.toUpperCase(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await collection.insertOne(requirement);
        return { ...requirement, _id: result.insertedId };
    }

    async listRequirements(organizationId: string): Promise<ComplianceRequirement[]> {
        const collection = await this.getRequirementCollection();
        return collection.find({ organizationId }).sort({ category: 1, name: 1 }).toArray();
    }

    private calculateOverallScore(scores: QualificationScore[]): number {
        if (scores.length === 0) return 0;

        const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
        if (totalWeight === 0) return 0;

        const weightedSum = scores.reduce((sum, s) => sum + s.weightedScore, 0);
        return Math.round((weightedSum / totalWeight) * 100);
    }

    private calculateOverallRiskLevel(assessments: RiskAssessment[]): 'low' | 'medium' | 'high' | 'critical' {
        if (assessments.length === 0) return 'low';

        const riskLevels = { low: 1, medium: 2, high: 3, critical: 4 };
        const maxRisk = Math.max(...assessments.map(a => riskLevels[a.level]));

        const reverseMapping: Record<number, 'low' | 'medium' | 'high' | 'critical'> = {
            1: 'low',
            2: 'medium',
            3: 'high',
            4: 'critical',
        };

        return reverseMapping[maxRisk];
    }
}

export const supplierQualificationService = new SupplierQualificationService();
