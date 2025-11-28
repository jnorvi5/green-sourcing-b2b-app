// lib/sustainabilityReportingService.ts - Sustainability Reporting Service
import { getDb } from './mongodb';
import { ObjectId } from 'mongodb';

export interface SustainabilityReport {
    _id?: ObjectId;
    reportId: string;
    organizationId: string;
    type: 'monthly' | 'quarterly' | 'annual' | 'custom';
    period: {
        start: Date;
        end: Date;
    };
    status: 'draft' | 'pending_review' | 'approved' | 'published';

    // Carbon Metrics
    carbonMetrics: {
        totalEmissions: number; // kg CO2e
        scope1: number;
        scope2: number;
        scope3: number;
        offsetCredits: number;
        netEmissions: number;
        intensityPerRevenue: number; // kg CO2e per $1000 revenue
        intensityPerUnit: number;
        yearOverYearChange: number; // percentage
        vsTarget: number; // percentage vs target
    };

    // Material Sourcing
    materialMetrics: {
        totalProcured: number; // kg
        recycledContent: number; // percentage
        localSourcing: number; // percentage (within 500 miles)
        certifiedMaterials: number; // percentage with sustainability certifications
        supplierDiversity: number; // percentage
        topMaterialsByCarbon: {
            material: string;
            quantity: number;
            carbonFootprint: number;
            percentage: number;
        }[];
    };

    // Supplier Performance
    supplierMetrics: {
        totalActiveSuppliers: number;
        certifiedSuppliers: number;
        avgSustainabilityScore: number;
        suppliersByTier: {
            gold: number;
            silver: number;
            bronze: number;
            uncertified: number;
        };
        topPerformers: {
            supplierId: string;
            supplierName: string;
            score: number;
            improvement: number;
        }[];
        atRiskSuppliers: {
            supplierId: string;
            supplierName: string;
            issue: string;
            riskLevel: 'low' | 'medium' | 'high';
        }[];
    };

    // Circular Economy
    circularMetrics: {
        wasteGenerated: number; // kg
        wasteRecycled: number; // kg
        wasteLandfill: number; // kg
        recyclingRate: number; // percentage
        materialRecovery: number; // kg materials recovered
        packagingReduction: number; // percentage reduction
    };

    // Water & Energy (if applicable)
    resourceMetrics?: {
        waterConsumption: number; // liters
        waterRecycled: number;
        energyConsumption: number; // kWh
        renewableEnergy: number; // percentage
    };

    // Goals & Progress
    goals: {
        id: string;
        name: string;
        target: number;
        current: number;
        unit: string;
        deadline: Date;
        status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
    }[];

    // Compliance
    compliance: {
        frameworks: string[]; // GRI, SASB, TCFD, CDP, etc.
        certifications: string[];
        auditStatus: 'pending' | 'in_progress' | 'completed';
        lastAuditDate?: Date;
        nextAuditDate?: Date;
        complianceScore: number; // 0-100
    };

    // Narrative sections
    executiveSummary: string;
    highlights: string[];
    challenges: string[];
    nextSteps: string[];

    // Metadata
    createdBy: string;
    approvedBy?: string;
    approvedAt?: Date;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface SustainabilityGoal {
    _id?: ObjectId;
    organizationId: string;
    name: string;
    description: string;
    category: 'carbon' | 'waste' | 'water' | 'energy' | 'sourcing' | 'supplier' | 'social' | 'custom';
    metricType: string;
    baselineValue: number;
    baselineDate: Date;
    targetValue: number;
    targetDate: Date;
    currentValue: number;
    unit: string;
    trackingFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    status: 'draft' | 'active' | 'achieved' | 'missed' | 'cancelled';
    milestones: {
        date: Date;
        target: number;
        actual?: number;
        note?: string;
    }[];
    linkedSDGs: number[]; // UN Sustainable Development Goals
    createdAt: Date;
    updatedAt: Date;
}

export interface CarbonTransaction {
    _id?: ObjectId;
    organizationId: string;
    transactionId: string;
    type: 'purchase' | 'delivery' | 'manufacturing' | 'disposal' | 'offset' | 'credit';
    scope: 1 | 2 | 3;
    category: string; // e.g., 'purchased_goods', 'transportation', 'business_travel'
    sourceId?: string; // RFQ, PO, Invoice ID
    sourceType?: string;

    emissionFactor: number;
    activityData: number;
    unit: string;
    emissions: number; // kg CO2e

    supplier?: {
        id: string;
        name: string;
    };

    verificationStatus: 'unverified' | 'estimated' | 'verified' | 'audited';
    verificationSource?: string;

    timestamp: Date;
    createdAt: Date;
}

export const sustainabilityReportingService = {
    // Report Management
    async createReport(
        organizationId: string,
        type: SustainabilityReport['type'],
        period: { start: Date; end: Date },
        createdBy: string
    ): Promise<SustainabilityReport> {
        const db = await getDb('analytics');
        const now = new Date();

        // Generate unique report ID
        const year = period.start.getFullYear();
        const quarter = Math.floor(period.start.getMonth() / 3) + 1;
        const reportId = `SR-${year}-Q${quarter}-${Date.now().toString(36)}`;

        // Calculate all metrics
        const [carbonMetrics, materialMetrics, supplierMetrics, circularMetrics] = await Promise.all([
            this.calculateCarbonMetrics(organizationId, period),
            this.calculateMaterialMetrics(organizationId, period),
            this.calculateSupplierMetrics(organizationId, period),
            this.calculateCircularMetrics(organizationId, period),
        ]);

        const goals = await this.getActiveGoals(organizationId);

        const report: SustainabilityReport = {
            reportId,
            organizationId,
            type,
            period,
            status: 'draft',
            carbonMetrics,
            materialMetrics,
            supplierMetrics,
            circularMetrics,
            goals: goals.map((g) => ({
                id: g._id?.toString() || '',
                name: g.name,
                target: g.targetValue,
                current: g.currentValue,
                unit: g.unit,
                deadline: g.targetDate,
                status: this.calculateGoalStatus(g),
            })),
            compliance: {
                frameworks: ['GRI', 'SASB'],
                certifications: [],
                auditStatus: 'pending',
                complianceScore: 0,
            },
            executiveSummary: '',
            highlights: [],
            challenges: [],
            nextSteps: [],
            createdBy,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('sustainability_reports').insertOne(report);
        return { ...report, _id: result.insertedId };
    },

    async getReport(reportId: string): Promise<SustainabilityReport | null> {
        const db = await getDb('analytics');
        return db.collection('sustainability_reports').findOne({ reportId }) as Promise<SustainabilityReport | null>;
    },

    async listReports(organizationId: string, options?: { type?: string; status?: string }): Promise<SustainabilityReport[]> {
        const db = await getDb('analytics');
        const query: Record<string, unknown> = { organizationId };

        if (options?.type) query.type = options.type;
        if (options?.status) query.status = options.status;

        return db.collection('sustainability_reports')
            .find(query)
            .sort({ 'period.start': -1 })
            .toArray() as Promise<SustainabilityReport[]>;
    },

    async updateReport(
        reportId: string,
        updates: Partial<SustainabilityReport>
    ): Promise<SustainabilityReport | null> {
        const db = await getDb('analytics');

        return db.collection('sustainability_reports').findOneAndUpdate(
            { reportId },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date(),
                },
            },
            { returnDocument: 'after' }
        ) as Promise<SustainabilityReport | null>;
    },

    async approveReport(reportId: string, approvedBy: string): Promise<SustainabilityReport | null> {
        const db = await getDb('analytics');
        const now = new Date();

        return db.collection('sustainability_reports').findOneAndUpdate(
            { reportId },
            {
                $set: {
                    status: 'approved',
                    approvedBy,
                    approvedAt: now,
                    updatedAt: now,
                },
            },
            { returnDocument: 'after' }
        ) as Promise<SustainabilityReport | null>;
    },

    async publishReport(reportId: string): Promise<SustainabilityReport | null> {
        const db = await getDb('analytics');
        const now = new Date();

        return db.collection('sustainability_reports').findOneAndUpdate(
            { reportId },
            {
                $set: {
                    status: 'published',
                    publishedAt: now,
                    updatedAt: now,
                },
            },
            { returnDocument: 'after' }
        ) as Promise<SustainabilityReport | null>;
    },

    // Carbon Tracking
    async recordCarbonTransaction(transaction: Omit<CarbonTransaction, '_id' | 'transactionId' | 'createdAt'>): Promise<CarbonTransaction> {
        const db = await getDb('analytics');
        const now = new Date();

        const transactionId = `CT-${now.getFullYear()}-${Date.now().toString(36)}`;

        const newTransaction: CarbonTransaction = {
            ...transaction,
            transactionId,
            createdAt: now,
        };

        const result = await db.collection('carbon_transactions').insertOne(newTransaction);
        return { ...newTransaction, _id: result.insertedId };
    },

    async getCarbonTransactions(
        organizationId: string,
        dateRange: { start: Date; end: Date },
        filters?: { scope?: number; category?: string; type?: string }
    ): Promise<CarbonTransaction[]> {
        const db = await getDb('analytics');
        const query: Record<string, unknown> = {
            organizationId,
            timestamp: { $gte: dateRange.start, $lte: dateRange.end },
        };

        if (filters?.scope) query.scope = filters.scope;
        if (filters?.category) query.category = filters.category;
        if (filters?.type) query.type = filters.type;

        return db.collection('carbon_transactions')
            .find(query)
            .sort({ timestamp: -1 })
            .toArray() as Promise<CarbonTransaction[]>;
    },

    // Goal Management
    async createGoal(goal: Omit<SustainabilityGoal, '_id' | 'createdAt' | 'updatedAt'>): Promise<SustainabilityGoal> {
        const db = await getDb('analytics');
        const now = new Date();

        const newGoal: SustainabilityGoal = {
            ...goal,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('sustainability_goals').insertOne(newGoal);
        return { ...newGoal, _id: result.insertedId };
    },

    async getActiveGoals(organizationId: string): Promise<SustainabilityGoal[]> {
        const db = await getDb('analytics');
        return db.collection('sustainability_goals').find({
            organizationId,
            status: 'active',
        }).toArray() as Promise<SustainabilityGoal[]>;
    },

    async updateGoalProgress(goalId: string, currentValue: number, note?: string): Promise<SustainabilityGoal | null> {
        const db = await getDb('analytics');
        const now = new Date();

        return db.collection('sustainability_goals').findOneAndUpdate(
            { _id: new ObjectId(goalId) },
            {
                $set: { currentValue, updatedAt: now },
                $push: {
                    milestones: {
                        date: now,
                        target: null,
                        actual: currentValue,
                        note,
                    },
                },
            },
            { returnDocument: 'after' }
        ) as Promise<SustainabilityGoal | null>;
    },

    // Calculation Methods
    async calculateCarbonMetrics(organizationId: string, period: { start: Date; end: Date }): Promise<SustainabilityReport['carbonMetrics']> {
        const db = await getDb('analytics');

        const transactions = await db.collection('carbon_transactions').find({
            organizationId,
            timestamp: { $gte: period.start, $lte: period.end },
        }).toArray() as CarbonTransaction[];

        const scope1 = transactions.filter((t) => t.scope === 1).reduce((sum, t) => sum + t.emissions, 0);
        const scope2 = transactions.filter((t) => t.scope === 2).reduce((sum, t) => sum + t.emissions, 0);
        const scope3 = transactions.filter((t) => t.scope === 3).reduce((sum, t) => sum + t.emissions, 0);
        const offsetCredits = transactions.filter((t) => t.type === 'offset').reduce((sum, t) => sum + Math.abs(t.emissions), 0);
        const totalEmissions = scope1 + scope2 + scope3;
        const netEmissions = totalEmissions - offsetCredits;

        // Get previous period for comparison
        const periodLength = period.end.getTime() - period.start.getTime();
        const prevPeriod = {
            start: new Date(period.start.getTime() - periodLength),
            end: new Date(period.end.getTime() - periodLength),
        };

        const prevTransactions = await db.collection('carbon_transactions').find({
            organizationId,
            timestamp: { $gte: prevPeriod.start, $lte: prevPeriod.end },
        }).toArray() as CarbonTransaction[];

        const prevTotal = prevTransactions.reduce((sum, t) => sum + t.emissions, 0);
        const yearOverYearChange = prevTotal > 0 ? ((totalEmissions - prevTotal) / prevTotal) * 100 : 0;

        return {
            totalEmissions,
            scope1,
            scope2,
            scope3,
            offsetCredits,
            netEmissions,
            intensityPerRevenue: 0, // Would need revenue data
            intensityPerUnit: 0,
            yearOverYearChange,
            vsTarget: 0, // Would need target data
        };
    },

    async calculateMaterialMetrics(organizationId: string, period: { start: Date; end: Date }): Promise<SustainabilityReport['materialMetrics']> {
        const db = await getDb('greenchainz');

        // Get orders/procurement data
        const orders = await db.collection('orders').find({
            buyerId: organizationId,
            createdAt: { $gte: period.start, $lte: period.end },
        }).toArray();

        let totalProcured = 0;
        let recycledQuantity = 0;
        let localQuantity = 0;
        let certifiedQuantity = 0;
        const materialCarbonMap: Record<string, { quantity: number; carbon: number }> = {};

        for (const order of orders) {
            const quantity = order.quantity || 0;
            totalProcured += quantity;

            if (order.isRecycled) recycledQuantity += quantity;
            if (order.isLocal) localQuantity += quantity;
            if (order.certifications?.length > 0) certifiedQuantity += quantity;

            const materialName = order.materialName || 'Unknown';
            if (!materialCarbonMap[materialName]) {
                materialCarbonMap[materialName] = { quantity: 0, carbon: 0 };
            }
            materialCarbonMap[materialName].quantity += quantity;
            materialCarbonMap[materialName].carbon += order.carbonFootprint || 0;
        }

        const topMaterialsByCarbon = Object.entries(materialCarbonMap)
            .map(([material, data]) => ({
                material,
                quantity: data.quantity,
                carbonFootprint: data.carbon,
                percentage: totalProcured > 0 ? (data.carbon / Object.values(materialCarbonMap).reduce((s, d) => s + d.carbon, 0)) * 100 : 0,
            }))
            .sort((a, b) => b.carbonFootprint - a.carbonFootprint)
            .slice(0, 5);

        return {
            totalProcured,
            recycledContent: totalProcured > 0 ? (recycledQuantity / totalProcured) * 100 : 0,
            localSourcing: totalProcured > 0 ? (localQuantity / totalProcured) * 100 : 0,
            certifiedMaterials: totalProcured > 0 ? (certifiedQuantity / totalProcured) * 100 : 0,
            supplierDiversity: 0, // Would need diversity data
            topMaterialsByCarbon,
        };
    },

    async calculateSupplierMetrics(organizationId: string, period: { start: Date; end: Date }): Promise<SustainabilityReport['supplierMetrics']> {
        const db = await getDb('suppliers');

        const suppliers = await db.collection('suppliers').find({
            'buyers': organizationId,
        }).toArray();

        const certifiedSuppliers = suppliers.filter((s) => s.sustainabilityCertified).length;
        const avgScore = suppliers.length > 0
            ? suppliers.reduce((sum, s) => sum + (s.sustainabilityScore || 0), 0) / suppliers.length
            : 0;

        const suppliersByTier = {
            gold: suppliers.filter((s) => (s.sustainabilityScore || 0) >= 80).length,
            silver: suppliers.filter((s) => (s.sustainabilityScore || 0) >= 60 && (s.sustainabilityScore || 0) < 80).length,
            bronze: suppliers.filter((s) => (s.sustainabilityScore || 0) >= 40 && (s.sustainabilityScore || 0) < 60).length,
            uncertified: suppliers.filter((s) => (s.sustainabilityScore || 0) < 40 || !s.sustainabilityScore).length,
        };

        const topPerformers = suppliers
            .filter((s) => s.sustainabilityScore)
            .sort((a, b) => (b.sustainabilityScore || 0) - (a.sustainabilityScore || 0))
            .slice(0, 5)
            .map((s) => ({
                supplierId: s._id.toString(),
                supplierName: s.companyName || 'Unknown',
                score: s.sustainabilityScore || 0,
                improvement: s.scoreImprovement || 0,
            }));

        const atRiskSuppliers = suppliers
            .filter((s) => s.riskLevel === 'high' || (s.sustainabilityScore || 100) < 40)
            .slice(0, 5)
            .map((s) => ({
                supplierId: s._id.toString(),
                supplierName: s.companyName || 'Unknown',
                issue: s.riskIssue || 'Low sustainability score',
                riskLevel: (s.riskLevel || 'medium') as 'low' | 'medium' | 'high',
            }));

        return {
            totalActiveSuppliers: suppliers.length,
            certifiedSuppliers,
            avgSustainabilityScore: avgScore,
            suppliersByTier,
            topPerformers,
            atRiskSuppliers,
        };
    },

    async calculateCircularMetrics(organizationId: string, period: { start: Date; end: Date }): Promise<SustainabilityReport['circularMetrics']> {
        // This would typically come from waste management data
        // For now, return placeholder values
        return {
            wasteGenerated: 0,
            wasteRecycled: 0,
            wasteLandfill: 0,
            recyclingRate: 0,
            materialRecovery: 0,
            packagingReduction: 0,
        };
    },

    calculateGoalStatus(goal: SustainabilityGoal): 'on_track' | 'at_risk' | 'behind' | 'achieved' {
        if (goal.currentValue >= goal.targetValue) return 'achieved';

        const now = new Date();
        const totalDuration = goal.targetDate.getTime() - goal.baselineDate.getTime();
        const elapsed = now.getTime() - goal.baselineDate.getTime();
        const progress = (elapsed / totalDuration) * 100;

        const valueProgress = ((goal.currentValue - goal.baselineValue) / (goal.targetValue - goal.baselineValue)) * 100;

        if (valueProgress >= progress) return 'on_track';
        if (valueProgress >= progress - 10) return 'at_risk';
        return 'behind';
    },

    // Export report
    async generatePDFData(reportId: string): Promise<Record<string, unknown>> {
        const report = await this.getReport(reportId);
        if (!report) throw new Error('Report not found');

        // Format data for PDF generation
        return {
            title: `Sustainability Report - ${report.type.charAt(0).toUpperCase() + report.type.slice(1)}`,
            period: `${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}`,
            executiveSummary: report.executiveSummary,
            carbonMetrics: report.carbonMetrics,
            materialMetrics: report.materialMetrics,
            supplierMetrics: report.supplierMetrics,
            circularMetrics: report.circularMetrics,
            goals: report.goals,
            compliance: report.compliance,
            highlights: report.highlights,
            challenges: report.challenges,
            nextSteps: report.nextSteps,
            generatedAt: new Date().toISOString(),
        };
    },
};

export default sustainabilityReportingService;
