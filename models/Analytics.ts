/**
 * KPI Models - Analytics Database
 * 
 * Automated KPI tracking and business intelligence
 * 
 * KPI Categories:
 * - Platform: GMV, MAU, DAU, conversion rates
 * - Buyers: Spend, orders, carbon savings
 * - Suppliers: Revenue, RFQ metrics, ratings
 * - Sustainability: Carbon saved, certifications
 * - Operations: Lead times, support metrics
 */
import { Schema, Model, Document } from 'mongoose';
import { getAnalyticsDB } from '../lib/databases';

// ==================== KPI Metric ====================
export interface IKPIMetric extends Document {
    name: string;
    category: 'platform' | 'buyer' | 'supplier' | 'sustainability' | 'operations' | 'financial';
    subcategory?: string;
    value: number;
    previousValue?: number;
    change?: number;
    changePercent?: number;
    unit: string;
    period: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    periodStart: Date;
    periodEnd: Date;
    target?: number;
    targetStatus?: 'on_track' | 'at_risk' | 'behind' | 'exceeded';
    breakdown?: Record<string, number>;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

const KPIMetricSchema = new Schema<IKPIMetric>({
    name: { type: String, required: true, index: true },
    category: {
        type: String,
        enum: ['platform', 'buyer', 'supplier', 'sustainability', 'operations', 'financial'],
        required: true,
        index: true,
    },
    subcategory: String,
    value: { type: Number, required: true },
    previousValue: Number,
    change: Number,
    changePercent: Number,
    unit: { type: String, required: true },
    period: {
        type: String,
        enum: ['realtime', 'hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
        required: true,
        index: true,
    },
    periodStart: { type: Date, required: true, index: true },
    periodEnd: { type: Date, required: true },
    target: Number,
    targetStatus: { type: String, enum: ['on_track', 'at_risk', 'behind', 'exceeded'] },
    breakdown: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

KPIMetricSchema.index({ name: 1, period: 1, periodStart: -1 });
KPIMetricSchema.index({ category: 1, period: 1, periodStart: -1 });

// ==================== Event Tracking ====================
export interface IEvent extends Document {
    eventType: string;
    category: 'user' | 'product' | 'rfq' | 'order' | 'system' | 'integration';
    action: string;
    userId?: string;
    userType?: 'buyer' | 'supplier' | 'admin';
    entityType?: string;
    entityId?: string;
    properties?: Record<string, unknown>;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    timestamp: Date;
}

const EventSchema = new Schema<IEvent>({
    eventType: { type: String, required: true, index: true },
    category: {
        type: String,
        enum: ['user', 'product', 'rfq', 'order', 'system', 'integration'],
        required: true,
        index: true,
    },
    action: { type: String, required: true },
    userId: { type: String, index: true },
    userType: { type: String, enum: ['buyer', 'supplier', 'admin'] },
    entityType: String,
    entityId: { type: String, index: true },
    properties: { type: Schema.Types.Mixed },
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    referrer: String,
    timestamp: { type: Date, default: Date.now, index: true },
});

// TTL index - auto-delete events older than 90 days
EventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// ==================== Dashboard Snapshot ====================
export interface IDashboardSnapshot extends Document {
    snapshotType: 'admin' | 'buyer' | 'supplier' | 'executive';
    entityId?: string; // userId or companyId for non-admin
    period: 'daily' | 'weekly' | 'monthly';
    periodDate: Date;

    // Platform KPIs (admin)
    platform?: {
        gmv: number;
        revenue: number;
        orders: number;
        newBuyers: number;
        newSuppliers: number;
        activeUsers: number;
        dau: number;
        mau: number;
        conversionRate: number;
        avgOrderValue: number;
        carbonSaved: number;
    };

    // Buyer KPIs
    buyer?: {
        totalSpend: number;
        orders: number;
        avgOrderValue: number;
        suppliersUsed: number;
        carbonSaved: number;
        rfqsSent: number;
        rfqResponseRate: number;
        savingsVsBudget: number;
    };

    // Supplier KPIs
    supplier?: {
        revenue: number;
        orders: number;
        avgOrderValue: number;
        newCustomers: number;
        repeatCustomerRate: number;
        rfqsReceived: number;
        rfqsResponded: number;
        rfqWinRate: number;
        avgLeadTime: number;
        onTimeDelivery: number;
        rating: number;
        reviewCount: number;
    };

    // Sustainability KPIs
    sustainability?: {
        totalCarbonSaved: number;
        avgCarbonScore: number;
        sustainableOrdersPercent: number;
        certifiedSuppliersPercent: number;
        recycledMaterialsUsed: number;
    };

    metadata?: Record<string, unknown>;
    createdAt: Date;
}

const DashboardSnapshotSchema = new Schema<IDashboardSnapshot>({
    snapshotType: {
        type: String,
        enum: ['admin', 'buyer', 'supplier', 'executive'],
        required: true,
        index: true,
    },
    entityId: { type: String, index: true },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: true,
    },
    periodDate: { type: Date, required: true, index: true },

    platform: {
        gmv: Number,
        revenue: Number,
        orders: Number,
        newBuyers: Number,
        newSuppliers: Number,
        activeUsers: Number,
        dau: Number,
        mau: Number,
        conversionRate: Number,
        avgOrderValue: Number,
        carbonSaved: Number,
    },

    buyer: {
        totalSpend: Number,
        orders: Number,
        avgOrderValue: Number,
        suppliersUsed: Number,
        carbonSaved: Number,
        rfqsSent: Number,
        rfqResponseRate: Number,
        savingsVsBudget: Number,
    },

    supplier: {
        revenue: Number,
        orders: Number,
        avgOrderValue: Number,
        newCustomers: Number,
        repeatCustomerRate: Number,
        rfqsReceived: Number,
        rfqsResponded: Number,
        rfqWinRate: Number,
        avgLeadTime: Number,
        onTimeDelivery: Number,
        rating: Number,
        reviewCount: Number,
    },

    sustainability: {
        totalCarbonSaved: Number,
        avgCarbonScore: Number,
        sustainableOrdersPercent: Number,
        certifiedSuppliersPercent: Number,
        recycledMaterialsUsed: Number,
    },

    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: { createdAt: true, updatedAt: false },
});

DashboardSnapshotSchema.index({ snapshotType: 1, period: 1, periodDate: -1 });
DashboardSnapshotSchema.index({ entityId: 1, period: 1, periodDate: -1 });

// ==================== Alert/Threshold ====================
export interface IKPIAlert extends Document {
    name: string;
    kpiName: string;
    condition: 'above' | 'below' | 'change_above' | 'change_below';
    threshold: number;
    currentValue?: number;
    status: 'active' | 'triggered' | 'resolved' | 'disabled';
    severity: 'info' | 'warning' | 'critical';
    recipients: string[];
    channels: ('email' | 'slack' | 'webhook')[];
    webhookUrl?: string;
    lastTriggered?: Date;
    triggerCount: number;
    cooldownMinutes: number;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const KPIAlertSchema = new Schema<IKPIAlert>({
    name: { type: String, required: true },
    kpiName: { type: String, required: true, index: true },
    condition: { type: String, enum: ['above', 'below', 'change_above', 'change_below'], required: true },
    threshold: { type: Number, required: true },
    currentValue: Number,
    status: { type: String, enum: ['active', 'triggered', 'resolved', 'disabled'], default: 'active' },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
    recipients: [{ type: String }],
    channels: [{ type: String, enum: ['email', 'slack', 'webhook'] }],
    webhookUrl: String,
    lastTriggered: Date,
    triggerCount: { type: Number, default: 0 },
    cooldownMinutes: { type: Number, default: 60 },
    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
});

// ==================== Model Factory ====================
interface AnalyticsModels {
    KPIMetric: Model<IKPIMetric>;
    Event: Model<IEvent>;
    DashboardSnapshot: Model<IDashboardSnapshot>;
    KPIAlert: Model<IKPIAlert>;
}

let models: AnalyticsModels | null = null;

export async function getAnalyticsModels(): Promise<AnalyticsModels> {
    if (models) return models;

    const conn = await getAnalyticsDB();

    models = {
        KPIMetric: conn.model<IKPIMetric>('KPIMetric', KPIMetricSchema),
        Event: conn.model<IEvent>('Event', EventSchema),
        DashboardSnapshot: conn.model<IDashboardSnapshot>('DashboardSnapshot', DashboardSnapshotSchema),
        KPIAlert: conn.model<IKPIAlert>('KPIAlert', KPIAlertSchema),
    };

    return models;
}

// Export individual model getters
export const getKPIMetricModel = async () => (await getAnalyticsModels()).KPIMetric;
export const getEventModel = async () => (await getAnalyticsModels()).Event;
export const getDashboardSnapshotModel = async () => (await getAnalyticsModels()).DashboardSnapshot;
export const getKPIAlertModel = async () => (await getAnalyticsModels()).KPIAlert;

export default { getAnalyticsModels, getKPIMetricModel, getEventModel, getDashboardSnapshotModel, getKPIAlertModel };
