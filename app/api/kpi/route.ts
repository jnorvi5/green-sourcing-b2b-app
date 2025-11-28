/**
 * KPI API Routes
 * 
 * Endpoints for:
 * - GET /api/kpi - Get KPI dashboard data
 * - GET /api/kpi?type=metric&name=xxx - Get specific metric
 * - POST /api/kpi/snapshot - Create manual snapshot
 * - GET /api/kpi/alerts - Get active alerts
 * - POST /api/kpi/alerts - Create new alert
 */
import { NextRequest, NextResponse } from 'next/server';
import { kpiService, KPI_DEFINITIONS } from '../../../lib/kpiService';
import { getAnalyticsModels, IKPIAlert } from '../../../models/Analytics';

// Request body types
interface KPIRequestBody {
    action?: string;
    snapshotType?: string;
    entityId?: string;
    name?: string;
    description?: string;
    kpiName?: string;
    category?: string;
    condition?: string;
    threshold?: number;
    channels?: string[];
    recipients?: string[];
    cooldownMinutes?: number;
    metricName?: string;
    metricCategory?: string;
    value?: number;
    period?: string;
    unit?: string;
    previousValue?: number;
    target?: number;
    breakdown?: Record<string, number>;
    metadata?: Record<string, unknown>;
}

export const dynamic = 'force-dynamic';

// GET - Retrieve KPI data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'dashboard';
        const name = searchParams.get('name');
        const period = (searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly';
        const limit = parseInt(searchParams.get('limit') || '30');
        const category = searchParams.get('category');
        const entityId = searchParams.get('entityId');

        switch (type) {
            case 'metric':
                // Get specific metric
                if (!name) {
                    return NextResponse.json(
                        { error: 'Metric name required' },
                        { status: 400 }
                    );
                }

                const metric = await kpiService.getLatestMetric(name, period);
                const trend = await kpiService.getMetricTrend(name, period, limit);

                return NextResponse.json({
                    metric,
                    trend,
                    definition: KPI_DEFINITIONS.platform[name as keyof typeof KPI_DEFINITIONS.platform] ||
                        KPI_DEFINITIONS.buyer[name as keyof typeof KPI_DEFINITIONS.buyer] ||
                        KPI_DEFINITIONS.supplier[name as keyof typeof KPI_DEFINITIONS.supplier] ||
                        KPI_DEFINITIONS.sustainability[name as keyof typeof KPI_DEFINITIONS.sustainability] ||
                        KPI_DEFINITIONS.operations[name as keyof typeof KPI_DEFINITIONS.operations],
                });

            case 'snapshot':
                // Get dashboard snapshots
                const { DashboardSnapshot } = await getAnalyticsModels();

                const snapshotQuery: Record<string, unknown> = { period };
                if (entityId) snapshotQuery.entityId = entityId;

                const snapshots = await DashboardSnapshot.find(snapshotQuery)
                    .sort({ periodDate: -1 })
                    .limit(limit)
                    .lean();

                return NextResponse.json({
                    snapshots,
                    count: snapshots.length,
                });

            case 'alerts':
                // Get active alerts
                const { KPIAlert } = await getAnalyticsModels();

                const alertQuery: Record<string, unknown> = {};
                if (category) alertQuery.category = category;

                const alerts = await KPIAlert.find(alertQuery)
                    .sort({ createdAt: -1 })
                    .lean();

                return NextResponse.json({
                    alerts,
                    count: alerts.length,
                });

            case 'definitions':
                // Get KPI definitions
                return NextResponse.json({
                    definitions: KPI_DEFINITIONS,
                });

            case 'dashboard':
            default:
                // Get full dashboard data
                const [platformKPIs, recentAlerts, recentSnapshots] = await Promise.all([
                    kpiService.calculatePlatformKPIs(),
                    (async () => {
                        const { KPIAlert } = await getAnalyticsModels();
                        return KPIAlert.find({ status: { $in: ['active', 'triggered'] } })
                            .sort({ lastTriggered: -1 })
                            .limit(5)
                            .lean();
                    })(),
                    (async () => {
                        const { DashboardSnapshot } = await getAnalyticsModels();
                        return DashboardSnapshot.find({ snapshotType: 'admin', period: 'daily' })
                            .sort({ periodDate: -1 })
                            .limit(7)
                            .lean();
                    })(),
                ]);

                // Calculate trends from snapshots
                const trends = calculateTrends(recentSnapshots);

                return NextResponse.json({
                    kpis: platformKPIs,
                    alerts: recentAlerts,
                    snapshots: recentSnapshots,
                    trends,
                    definitions: KPI_DEFINITIONS,
                });
        }
    } catch (error) {
        console.error('KPI API Error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve KPI data' },
            { status: 500 }
        );
    }
}

// POST - Create snapshots or alerts
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as KPIRequestBody;
        const { action } = body;

        switch (action) {
            case 'snapshot':
                // Create manual snapshot
                const { snapshotType = 'admin', entityId } = body;

                const snapshot = await kpiService.createDailySnapshot(snapshotType, entityId);

                return NextResponse.json({
                    success: true,
                    snapshot,
                });

            case 'alert':
                // Create new alert
                const { KPIAlert } = await getAnalyticsModels();

                const {
                    name,
                    description,
                    kpiName,
                    category,
                    condition,
                    threshold,
                    channels = ['email'],
                    recipients = [],
                    cooldownMinutes = 60,
                } = body;

                if (!name || !kpiName || !condition || threshold === undefined) {
                    return NextResponse.json(
                        { error: 'Missing required alert fields' },
                        { status: 400 }
                    );
                }

                const alert = new KPIAlert({
                    name,
                    description,
                    kpiName,
                    category: category || 'platform',
                    condition,
                    threshold,
                    channels,
                    recipients,
                    cooldownMinutes,
                    status: 'active',
                    triggerCount: 0,
                });

                await alert.save();

                return NextResponse.json({
                    success: true,
                    alert,
                });

            case 'evaluate':
                // Manually evaluate alerts
                const results = await kpiService.evaluateAlerts();

                return NextResponse.json({
                    success: true,
                    results,
                    triggered: results.filter((r: { triggered: boolean }) => r.triggered).length,
                });

            case 'record':
                // Record a metric
                const {
                    metricName,
                    metricCategory,
                    value,
                    period,
                    unit,
                    previousValue,
                    target,
                    breakdown,
                    metadata,
                } = body;

                if (!metricName || !metricCategory || value === undefined || !period) {
                    return NextResponse.json(
                        { error: 'Missing required metric fields' },
                        { status: 400 }
                    );
                }

                const metric = await kpiService.recordMetric(
                    metricName,
                    metricCategory,
                    value,
                    period,
                    { unit, previousValue, target, breakdown, metadata }
                );

                return NextResponse.json({
                    success: true,
                    metric,
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use: snapshot, alert, evaluate, record' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('KPI API Error:', error);
        return NextResponse.json(
            { error: 'Failed to process KPI request' },
            { status: 500 }
        );
    }
}

// DELETE - Remove alert
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const alertId = searchParams.get('alertId');

        if (!alertId) {
            return NextResponse.json(
                { error: 'Alert ID required' },
                { status: 400 }
            );
        }

        const { KPIAlert } = await getAnalyticsModels();

        const result = await KPIAlert.findByIdAndDelete(alertId);

        if (!result) {
            return NextResponse.json(
                { error: 'Alert not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Alert deleted',
        });
    } catch (error) {
        console.error('KPI API Error:', error);
        return NextResponse.json(
            { error: 'Failed to delete alert' },
            { status: 500 }
        );
    }
}

// Helper function to calculate trends
function calculateTrends(snapshots: Array<{ platform?: { gmv?: number; orders?: number; activeUsers?: number } }>) {
    if (snapshots.length < 2) return {};

    const latest = snapshots[0];
    const previous = snapshots[1];

    const calculateChange = (current: number | undefined, prev: number | undefined) => {
        if (!current || !prev || prev === 0) return 0;
        return ((current - prev) / prev) * 100;
    };

    return {
        gmvChange: calculateChange(latest.platform?.gmv, previous.platform?.gmv),
        ordersChange: calculateChange(latest.platform?.orders, previous.platform?.orders),
        activeUsersChange: calculateChange(latest.platform?.activeUsers, previous.platform?.activeUsers),
    };
}
