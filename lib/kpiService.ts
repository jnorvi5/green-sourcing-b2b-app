/**
 * KPI Service
 * 
 * Automated KPI calculation, tracking, and alerting
 * 
 * Features:
 * - Real-time metric tracking
 * - Automated daily/weekly/monthly snapshots
 * - Alert evaluation and notifications
 * - Trend analysis
 */
import { getAnalyticsModels, IKPIMetric, IDashboardSnapshot, IKPIAlert } from '../models/Analytics';
import { getMainDB } from './databases';

// ==================== KPI Definitions ====================
export const KPI_DEFINITIONS = {
    // Platform KPIs
    platform: {
        gmv: { name: 'Gross Merchandise Value', unit: 'USD', target: 1000000 },
        totalOrders: { name: 'Total Orders', unit: 'count', target: 500 },
        totalBuyers: { name: 'Total Buyers', unit: 'count', target: 100 },
        totalSuppliers: { name: 'Total Suppliers', unit: 'count', target: 50 },
        newBuyers: { name: 'New Buyers', unit: 'count', target: 20 },
        newSuppliers: { name: 'New Suppliers', unit: 'count', target: 10 },
        dau: { name: 'Daily Active Users', unit: 'count', target: 200 },
        mau: { name: 'Monthly Active Users', unit: 'count', target: 1000 },
        conversionRate: { name: 'Conversion Rate', unit: 'percent', target: 5 },
        avgOrderValue: { name: 'Average Order Value', unit: 'USD', target: 2000 },
    },

    // Buyer KPIs
    buyer: {
        totalSpend: { name: 'Total Spend', unit: 'USD' },
        orderCount: { name: 'Order Count', unit: 'count' },
        avgOrderValue: { name: 'Avg Order Value', unit: 'USD' },
        suppliersUsed: { name: 'Suppliers Used', unit: 'count' },
        rfqsSent: { name: 'RFQs Sent', unit: 'count' },
        rfqConversionRate: { name: 'RFQ Conversion Rate', unit: 'percent' },
        carbonSaved: { name: 'Carbon Saved', unit: 'kgCO2e' },
        budgetUtilization: { name: 'Budget Utilization', unit: 'percent' },
    },

    // Supplier KPIs
    supplier: {
        revenue: { name: 'Revenue', unit: 'USD' },
        orderCount: { name: 'Order Count', unit: 'count' },
        avgOrderValue: { name: 'Avg Order Value', unit: 'USD' },
        customerCount: { name: 'Customer Count', unit: 'count' },
        repeatCustomerRate: { name: 'Repeat Customer Rate', unit: 'percent' },
        rfqsReceived: { name: 'RFQs Received', unit: 'count' },
        rfqResponseRate: { name: 'RFQ Response Rate', unit: 'percent' },
        rfqWinRate: { name: 'RFQ Win Rate', unit: 'percent' },
        avgLeadTime: { name: 'Avg Lead Time', unit: 'days' },
        onTimeDeliveryRate: { name: 'On-Time Delivery Rate', unit: 'percent' },
        rating: { name: 'Average Rating', unit: 'stars' },
        returnRate: { name: 'Return Rate', unit: 'percent' },
    },

    // Sustainability KPIs
    sustainability: {
        totalCarbonSaved: { name: 'Total Carbon Saved', unit: 'tCO2e', target: 100 },
        avgCarbonScore: { name: 'Avg Carbon Score', unit: 'score', target: 80 },
        sustainableOrdersPercent: { name: 'Sustainable Orders %', unit: 'percent', target: 50 },
        certifiedSuppliersPercent: { name: 'Certified Suppliers %', unit: 'percent', target: 60 },
        recycledMaterialsUsed: { name: 'Recycled Materials Used', unit: 'kg', target: 10000 },
        carbonNeutralOrders: { name: 'Carbon Neutral Orders', unit: 'count' },
    },

    // Operations KPIs
    operations: {
        avgResponseTime: { name: 'Avg Response Time', unit: 'hours', target: 4 },
        supportTicketResolution: { name: 'Support Resolution Time', unit: 'hours', target: 24 },
        platformUptime: { name: 'Platform Uptime', unit: 'percent', target: 99.9 },
        apiLatency: { name: 'API Latency', unit: 'ms', target: 200 },
        errorRate: { name: 'Error Rate', unit: 'percent', target: 0.1 },
    },
};

// ==================== KPI Calculator Class ====================
export class KPIService {

    /**
     * Record a KPI metric
     */
    async recordMetric(
        name: string,
        category: IKPIMetric['category'],
        value: number,
        period: IKPIMetric['period'],
        options?: {
            unit?: string;
            previousValue?: number;
            target?: number;
            breakdown?: Record<string, number>;
            metadata?: Record<string, unknown>;
        }
    ): Promise<IKPIMetric> {
        const { KPIMetric } = await getAnalyticsModels();

        const now = new Date();
        const periodDates = this.getPeriodDates(period, now);

        const change = options?.previousValue ? value - options.previousValue : undefined;
        const changePercent = options?.previousValue && options.previousValue !== 0
            ? ((value - options.previousValue) / options.previousValue) * 100
            : undefined;

        const targetStatus = options?.target
            ? this.calculateTargetStatus(value, options.target)
            : undefined;

        const metric = new KPIMetric({
            name,
            category,
            value,
            previousValue: options?.previousValue,
            change,
            changePercent,
            unit: options?.unit || 'count',
            period,
            periodStart: periodDates.start,
            periodEnd: periodDates.end,
            target: options?.target,
            targetStatus,
            breakdown: options?.breakdown,
            metadata: options?.metadata,
        });

        await metric.save();
        return metric;
    }

    /**
     * Get latest KPI value
     */
    async getLatestMetric(
        name: string,
        period: IKPIMetric['period'] = 'daily'
    ): Promise<IKPIMetric | null> {
        const { KPIMetric } = await getAnalyticsModels();

        return KPIMetric.findOne({ name, period })
            .sort({ periodStart: -1 })
            .lean();
    }

    /**
     * Get KPI trend over time
     */
    async getMetricTrend(
        name: string,
        period: IKPIMetric['period'],
        limit: number = 30
    ): Promise<IKPIMetric[]> {
        const { KPIMetric } = await getAnalyticsModels();

        return KPIMetric.find({ name, period })
            .sort({ periodStart: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * Calculate platform-wide KPIs
     */
    async calculatePlatformKPIs(): Promise<Record<string, number>> {
        const mainDB = await getMainDB();

        // Get collections
        const ordersCol = mainDB.collection('orders');
        const productsCol = mainDB.collection('products');
        const usersCol = mainDB.collection('users');
        const rfqsCol = mainDB.collection('rfqs');

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // Run aggregations in parallel
        const [
            orderStats,
            userStats,
            productStats,
            rfqStats,
        ] = await Promise.all([
            // Order stats
            ordersCol.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                {
                    $group: {
                        _id: null,
                        totalGMV: { $sum: '$total' },
                        totalOrders: { $sum: 1 },
                        avgOrderValue: { $avg: '$total' },
                        totalCarbon: { $sum: '$totalCarbon' },
                    },
                },
            ]).toArray(),

            // User stats
            usersCol.aggregate([
                {
                    $facet: {
                        buyers: [{ $match: { role: 'buyer' } }, { $count: 'count' }],
                        suppliers: [{ $match: { role: 'supplier' } }, { $count: 'count' }],
                        newBuyers: [{ $match: { role: 'buyer', createdAt: { $gte: startOfMonth } } }, { $count: 'count' }],
                        newSuppliers: [{ $match: { role: 'supplier', createdAt: { $gte: startOfMonth } } }, { $count: 'count' }],
                        activeToday: [{ $match: { lastLoginAt: { $gte: startOfDay } } }, { $count: 'count' }],
                        activeThisMonth: [{ $match: { lastLoginAt: { $gte: startOfMonth } } }, { $count: 'count' }],
                    },
                },
            ]).toArray(),

            // Product stats
            productsCol.aggregate([
                { $match: { status: 'active' } },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        avgCarbonScore: { $avg: '$greenData.carbonScore' },
                    },
                },
            ]).toArray(),

            // RFQ stats
            rfqsCol.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRFQs: { $sum: 1 },
                        respondedRFQs: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$quotes', []] } }, 0] }, 1, 0] } },
                        wonRFQs: { $sum: { $cond: [{ $eq: ['$status', 'awarded'] }, 1, 0] } },
                    },
                },
            ]).toArray(),
        ]);

        const orders = orderStats[0] || { totalGMV: 0, totalOrders: 0, avgOrderValue: 0, totalCarbon: 0 };
        const users = userStats[0] || {};
        const products = productStats[0] || { totalProducts: 0, avgCarbonScore: 0 };
        const rfqs = rfqStats[0] || { totalRFQs: 0, respondedRFQs: 0, wonRFQs: 0 };

        return {
            gmv: orders.totalGMV || 0,
            totalOrders: orders.totalOrders || 0,
            avgOrderValue: orders.avgOrderValue || 0,
            totalBuyers: users.buyers?.[0]?.count || 0,
            totalSuppliers: users.suppliers?.[0]?.count || 0,
            newBuyers: users.newBuyers?.[0]?.count || 0,
            newSuppliers: users.newSuppliers?.[0]?.count || 0,
            dau: users.activeToday?.[0]?.count || 0,
            mau: users.activeThisMonth?.[0]?.count || 0,
            totalProducts: products.totalProducts || 0,
            avgCarbonScore: products.avgCarbonScore || 0,
            totalRFQs: rfqs.totalRFQs || 0,
            rfqResponseRate: rfqs.totalRFQs > 0 ? (rfqs.respondedRFQs / rfqs.totalRFQs) * 100 : 0,
            rfqWinRate: rfqs.respondedRFQs > 0 ? (rfqs.wonRFQs / rfqs.respondedRFQs) * 100 : 0,
            totalCarbonSaved: orders.totalCarbon || 0,
        };
    }

    /**
     * Create daily dashboard snapshot
     */
    async createDailySnapshot(
        snapshotType: IDashboardSnapshot['snapshotType'],
        entityId?: string
    ): Promise<IDashboardSnapshot> {
        const { DashboardSnapshot } = await getAnalyticsModels();

        const now = new Date();
        const periodDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let snapshotData: Partial<IDashboardSnapshot> = {
            snapshotType,
            entityId,
            period: 'daily',
            periodDate,
        };

        if (snapshotType === 'admin') {
            const platformKPIs = await this.calculatePlatformKPIs();
            snapshotData.platform = {
                gmv: platformKPIs.gmv,
                revenue: platformKPIs.gmv * 0.05, // 5% take rate
                orders: platformKPIs.totalOrders,
                newBuyers: platformKPIs.newBuyers,
                newSuppliers: platformKPIs.newSuppliers,
                activeUsers: platformKPIs.dau,
                dau: platformKPIs.dau,
                mau: platformKPIs.mau,
                conversionRate: platformKPIs.totalBuyers > 0
                    ? (platformKPIs.totalOrders / platformKPIs.totalBuyers / 30) * 100
                    : 0,
                avgOrderValue: platformKPIs.avgOrderValue,
                carbonSaved: platformKPIs.totalCarbonSaved,
            };
            snapshotData.sustainability = {
                totalCarbonSaved: platformKPIs.totalCarbonSaved,
                avgCarbonScore: platformKPIs.avgCarbonScore,
                sustainableOrdersPercent: 75, // Calculate from orders
                certifiedSuppliersPercent: 60, // Calculate from suppliers
                recycledMaterialsUsed: 5000, // Calculate from products
            };
        }

        const snapshot = new DashboardSnapshot(snapshotData);
        await snapshot.save();
        return snapshot;
    }

    /**
     * Evaluate all active alerts
     */
    async evaluateAlerts(): Promise<Array<{ alert: IKPIAlert; triggered: boolean }>> {
        const { KPIAlert, KPIMetric } = await getAnalyticsModels();

        const activeAlerts = await KPIAlert.find({ status: 'active' });
        const results: Array<{ alert: IKPIAlert; triggered: boolean }> = [];

        for (const alert of activeAlerts) {
            const latestMetric = await KPIMetric.findOne({ name: alert.kpiName })
                .sort({ periodStart: -1 })
                .lean();

            if (!latestMetric) continue;

            let triggered = false;

            switch (alert.condition) {
                case 'above':
                    triggered = latestMetric.value > alert.threshold;
                    break;
                case 'below':
                    triggered = latestMetric.value < alert.threshold;
                    break;
                case 'change_above':
                    triggered = (latestMetric.changePercent || 0) > alert.threshold;
                    break;
                case 'change_below':
                    triggered = (latestMetric.changePercent || 0) < alert.threshold;
                    break;
            }

            // Check cooldown
            if (triggered && alert.lastTriggered) {
                const cooldownEnd = new Date(alert.lastTriggered.getTime() + alert.cooldownMinutes * 60 * 1000);
                if (new Date() < cooldownEnd) {
                    triggered = false;
                }
            }

            if (triggered) {
                await KPIAlert.findByIdAndUpdate(alert._id, {
                    status: 'triggered',
                    currentValue: latestMetric.value,
                    lastTriggered: new Date(),
                    $inc: { triggerCount: 1 },
                });

                // TODO: Send notifications based on alert.channels
                console.log(`🚨 Alert triggered: ${alert.name} - ${latestMetric.value}`);
            }

            results.push({ alert, triggered });
        }

        return results;
    }

    /**
     * Get period start/end dates
     */
    private getPeriodDates(period: IKPIMetric['period'], date: Date): { start: Date; end: Date } {
        const d = new Date(date);

        switch (period) {
            case 'realtime':
                return { start: d, end: d };

            case 'hourly':
                const hourStart = new Date(d.setMinutes(0, 0, 0));
                return { start: hourStart, end: new Date(hourStart.getTime() + 60 * 60 * 1000) };

            case 'daily':
                const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                return { start: dayStart, end: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) };

            case 'weekly':
                const weekStart = new Date(d.setDate(d.getDate() - d.getDay()));
                weekStart.setHours(0, 0, 0, 0);
                return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) };

            case 'monthly':
                const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
                return { start: monthStart, end: new Date(d.getFullYear(), d.getMonth() + 1, 1) };

            case 'quarterly':
                const quarter = Math.floor(d.getMonth() / 3);
                const quarterStart = new Date(d.getFullYear(), quarter * 3, 1);
                return { start: quarterStart, end: new Date(d.getFullYear(), quarter * 3 + 3, 1) };

            case 'yearly':
                const yearStart = new Date(d.getFullYear(), 0, 1);
                return { start: yearStart, end: new Date(d.getFullYear() + 1, 0, 1) };

            default:
                return { start: d, end: d };
        }
    }

    /**
     * Calculate target status
     */
    private calculateTargetStatus(value: number, target: number): IKPIMetric['targetStatus'] {
        const ratio = value / target;

        if (ratio >= 1) return 'exceeded';
        if (ratio >= 0.9) return 'on_track';
        if (ratio >= 0.7) return 'at_risk';
        return 'behind';
    }
}

// Singleton instance
export const kpiService = new KPIService();

export default kpiService;
