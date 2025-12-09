/**
 * Azure Functions Scheduled Jobs
 * 
 * Serverless functions for automated KPI calculations and maintenance
 * 
 * These can be deployed to Azure Functions or run locally via cron
 */
import { kpiService, KPI_DEFINITIONS } from './kpiService';
import { getAnalyticsModels } from '../models/Analytics';
import { getDataProviderModels } from '../models/DataProviders';
import { connectAllDatabases, getDatabaseHealth } from './databases';

// ==================== Job Configurations ====================
export const SCHEDULED_JOBS = {
    hourlyKPISnapshot: {
        name: 'Hourly KPI Snapshot',
        schedule: '0 * * * *', // Every hour
        enabled: true,
    },
    dailyKPISnapshot: {
        name: 'Daily KPI Snapshot',
        schedule: '0 2 * * *', // Daily at 2 AM
        enabled: true,
    },
    weeklyRollup: {
        name: 'Weekly KPI Rollup',
        schedule: '0 3 * * 0', // Sunday at 3 AM
        enabled: true,
    },
    monthlyRollup: {
        name: 'Monthly KPI Rollup',
        schedule: '0 4 1 * *', // 1st of month at 4 AM
        enabled: true,
    },
    alertEvaluation: {
        name: 'Alert Evaluation',
        schedule: '*/15 * * * *', // Every 15 minutes
        enabled: true,
    },
    cacheRefresh: {
        name: 'Data Provider Cache Refresh',
        schedule: '0 */6 * * *', // Every 6 hours
        enabled: true,
    },
    cleanupJob: {
        name: 'Cleanup Old Data',
        schedule: '0 5 * * 0', // Sunday at 5 AM
        enabled: true,
    },
};

// ==================== Job Functions ====================

/**
 * Hourly KPI Snapshot Job
 * Records key metrics every hour for real-time dashboards
 */
export async function runHourlyKPISnapshot(): Promise<void> {
    console.log('🕐 Running Hourly KPI Snapshot...');

    try {
        await connectAllDatabases();
        const platformKPIs = await kpiService.calculatePlatformKPIs();

        // Record each KPI
        const kpisToRecord = [
            { name: 'gmv', category: 'platform', value: platformKPIs.gmv, unit: 'USD' },
            { name: 'totalOrders', category: 'platform', value: platformKPIs.totalOrders, unit: 'count' },
            { name: 'dau', category: 'platform', value: platformKPIs.dau, unit: 'count' },
        ];

        for (const kpi of kpisToRecord) {
            const previous = await kpiService.getLatestMetric(kpi.name, 'hourly');
            await kpiService.recordMetric(
                kpi.name,
                kpi.category as 'platform',
                kpi.value,
                'hourly',
                {
                    unit: kpi.unit,
                    previousValue: previous?.value,
                    target: KPI_DEFINITIONS.platform[kpi.name as keyof typeof KPI_DEFINITIONS.platform]?.target,
                }
            );
        }

        console.log('✅ Hourly KPI Snapshot complete');
    } catch (error) {
        console.error('❌ Hourly KPI Snapshot failed:', error);
        throw error;
    }
}

/**
 * Daily KPI Snapshot Job
 * Comprehensive daily metrics capture
 */
export async function runDailyKPISnapshot(): Promise<void> {
    console.log('📅 Running Daily KPI Snapshot...');

    try {
        await connectAllDatabases();

        // Create admin dashboard snapshot
        await kpiService.createDailySnapshot('admin');

        // Calculate and store all platform KPIs
        const platformKPIs = await kpiService.calculatePlatformKPIs();

        const allKPIs = [
            // Platform KPIs
            { name: 'gmv', category: 'platform', value: platformKPIs.gmv, unit: 'USD', target: KPI_DEFINITIONS.platform.gmv.target },
            { name: 'totalOrders', category: 'platform', value: platformKPIs.totalOrders, unit: 'count', target: KPI_DEFINITIONS.platform.totalOrders.target },
            { name: 'totalBuyers', category: 'platform', value: platformKPIs.totalBuyers, unit: 'count', target: KPI_DEFINITIONS.platform.totalBuyers.target },
            { name: 'totalSuppliers', category: 'platform', value: platformKPIs.totalSuppliers, unit: 'count', target: KPI_DEFINITIONS.platform.totalSuppliers.target },
            { name: 'newBuyers', category: 'platform', value: platformKPIs.newBuyers, unit: 'count', target: KPI_DEFINITIONS.platform.newBuyers.target },
            { name: 'newSuppliers', category: 'platform', value: platformKPIs.newSuppliers, unit: 'count', target: KPI_DEFINITIONS.platform.newSuppliers.target },
            { name: 'dau', category: 'platform', value: platformKPIs.dau, unit: 'count', target: KPI_DEFINITIONS.platform.dau.target },
            { name: 'mau', category: 'platform', value: platformKPIs.mau, unit: 'count', target: KPI_DEFINITIONS.platform.mau.target },
            { name: 'avgOrderValue', category: 'platform', value: platformKPIs.avgOrderValue, unit: 'USD', target: KPI_DEFINITIONS.platform.avgOrderValue.target },
            // Sustainability KPIs
            { name: 'totalCarbonSaved', category: 'sustainability', value: platformKPIs.totalCarbonSaved, unit: 'tCO2e', target: KPI_DEFINITIONS.sustainability.totalCarbonSaved.target },
            { name: 'avgCarbonScore', category: 'sustainability', value: platformKPIs.avgCarbonScore, unit: 'score', target: KPI_DEFINITIONS.sustainability.avgCarbonScore.target },
        ];

        for (const kpi of allKPIs) {
            const previous = await kpiService.getLatestMetric(kpi.name, 'daily');
            await kpiService.recordMetric(
                kpi.name,
                kpi.category as 'platform' | 'sustainability',
                kpi.value,
                'daily',
                {
                    unit: kpi.unit,
                    previousValue: previous?.value,
                    target: kpi.target,
                }
            );
        }

        console.log('✅ Daily KPI Snapshot complete');
    } catch (error) {
        console.error('❌ Daily KPI Snapshot failed:', error);
        throw error;
    }
}

/**
 * Weekly Rollup Job
 * Aggregates daily metrics into weekly summaries
 */
export async function runWeeklyRollup(): Promise<void> {
    console.log('📊 Running Weekly KPI Rollup...');

    try {
        await connectAllDatabases();
        const { KPIMetric } = await getAnalyticsModels();

        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - 7));

        // Get all daily metrics from the past week
        const weeklyMetrics = await KPIMetric.aggregate([
            {
                $match: {
                    period: 'daily',
                    periodStart: { $gte: weekStart },
                },
            },
            {
                $group: {
                    _id: '$name',
                    avgValue: { $avg: '$value' },
                    maxValue: { $max: '$value' },
                    minValue: { $min: '$value' },
                    totalValue: { $sum: '$value' },
                    category: { $first: '$category' },
                    unit: { $first: '$unit' },
                    target: { $first: '$target' },
                },
            },
        ]);

        // Record weekly summaries
        for (const metric of weeklyMetrics) {
            const value = ['gmv', 'totalOrders', 'newBuyers', 'newSuppliers'].includes(metric._id)
                ? metric.totalValue
                : metric.avgValue;

            await kpiService.recordMetric(
                metric._id,
                metric.category,
                value,
                'weekly',
                {
                    unit: metric.unit,
                    target: metric.target,
                    breakdown: {
                        avg: metric.avgValue,
                        max: metric.maxValue,
                        min: metric.minValue,
                        total: metric.totalValue,
                    },
                }
            );
        }

        console.log('✅ Weekly KPI Rollup complete');
    } catch (error) {
        console.error('❌ Weekly KPI Rollup failed:', error);
        throw error;
    }
}

/**
 * Monthly Rollup Job
 * Aggregates weekly/daily metrics into monthly summaries
 */
export async function runMonthlyRollup(): Promise<void> {
    console.log('📈 Running Monthly KPI Rollup...');

    try {
        await connectAllDatabases();
        const { KPIMetric } = await getAnalyticsModels();

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all daily metrics from the past month
        const monthlyMetrics = await KPIMetric.aggregate([
            {
                $match: {
                    period: 'daily',
                    periodStart: { $gte: monthStart, $lt: monthEnd },
                },
            },
            {
                $group: {
                    _id: '$name',
                    avgValue: { $avg: '$value' },
                    maxValue: { $max: '$value' },
                    minValue: { $min: '$value' },
                    totalValue: { $sum: '$value' },
                    category: { $first: '$category' },
                    unit: { $first: '$unit' },
                    target: { $first: '$target' },
                },
            },
        ]);

        // Record monthly summaries
        for (const metric of monthlyMetrics) {
            const value = ['gmv', 'totalOrders', 'newBuyers', 'newSuppliers'].includes(metric._id)
                ? metric.totalValue
                : metric.avgValue;

            await kpiService.recordMetric(
                metric._id,
                metric.category,
                value,
                'monthly',
                {
                    unit: metric.unit,
                    target: metric.target,
                    breakdown: {
                        avg: metric.avgValue,
                        max: metric.maxValue,
                        min: metric.minValue,
                        total: metric.totalValue,
                    },
                }
            );
        }

        console.log('✅ Monthly KPI Rollup complete');
    } catch (error) {
        console.error('❌ Monthly KPI Rollup failed:', error);
        throw error;
    }
}

/**
 * Alert Evaluation Job
 * Checks all active alerts and triggers notifications
 */
export async function runAlertEvaluation(): Promise<void> {
    console.log('🔔 Running Alert Evaluation...');

    try {
        await connectAllDatabases();
        const results = await kpiService.evaluateAlerts();

        const triggered = results.filter(r => r.triggered);
        console.log(`✅ Alert Evaluation complete: ${triggered.length}/${results.length} triggered`);

        // Send notifications for triggered alerts
        for (const result of triggered) {
            // TODO: Implement notification sending (email, Slack, etc.)
            console.log(`🚨 Alert: ${result.alert.name}`);
        }
    } catch (error) {
        console.error('❌ Alert Evaluation failed:', error);
        throw error;
    }
}

/**
 * Cache Refresh Job
 * Updates external data provider caches
 */
export async function runCacheRefresh(): Promise<void> {
    console.log('🔄 Running Cache Refresh...');

    try {
        await connectAllDatabases();
        const { DataProviderSync } = await getDataProviderModels();

        // Get all sync configurations
        const syncConfigs = await DataProviderSync.find({ status: 'active' });

        for (const config of syncConfigs) {
            try {
                // Check if sync is needed
                const nextSync = new Date(config.lastSyncAt.getTime() + config.syncIntervalMinutes * 60 * 1000);
                if (new Date() < nextSync) continue;

                console.log(`Syncing ${config.providerName}...`);

                // Update sync status
                await DataProviderSync.findByIdAndUpdate(config._id, {
                    status: 'syncing',
                    lastSyncAt: new Date(),
                });

                // TODO: Actually call provider APIs to refresh data
                // await syncEC3Data();
                // await syncAutodeskData();
                // await syncEPDData();

                await DataProviderSync.findByIdAndUpdate(config._id, {
                    status: 'active',
                });

                console.log(`✅ ${config.providerName} synced`);
            } catch (err) {
                console.error(`❌ Failed to sync ${config.providerName}:`, err);
                await DataProviderSync.findByIdAndUpdate(config._id, {
                    status: 'failed',
                    errorLog: [
                        ...(config.errorLog || []).slice(-9),
                        {
                            timestamp: new Date(),
                            error: err instanceof Error ? err.message : 'Unknown error',
                        },
                    ],
                });
            }
        }

        console.log('✅ Cache Refresh complete');
    } catch (error) {
        console.error('❌ Cache Refresh failed:', error);
        throw error;
    }
}

/**
 * Cleanup Job
 * Removes old data to save storage
 */
export async function runCleanup(): Promise<void> {
    console.log('🧹 Running Cleanup Job...');

    try {
        await connectAllDatabases();
        const { KPIMetric, DashboardSnapshot } = await getAnalyticsModels();

        const now = new Date();

        // Keep hourly data for 7 days
        const hourlyRetention = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const hourlyDeleted = await KPIMetric.deleteMany({
            period: 'hourly',
            periodStart: { $lt: hourlyRetention },
        });

        // Keep daily data for 90 days
        const dailyRetention = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const dailyDeleted = await KPIMetric.deleteMany({
            period: 'daily',
            periodStart: { $lt: dailyRetention },
        });

        // Keep weekly data for 1 year
        const weeklyRetention = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const weeklyDeleted = await KPIMetric.deleteMany({
            period: 'weekly',
            periodStart: { $lt: weeklyRetention },
        });

        // Keep daily snapshots for 90 days
        const snapshotDeleted = await DashboardSnapshot.deleteMany({
            period: 'daily',
            periodDate: { $lt: dailyRetention },
        });

        console.log(`✅ Cleanup complete:
      - Hourly metrics: ${hourlyDeleted.deletedCount} deleted
      - Daily metrics: ${dailyDeleted.deletedCount} deleted
      - Weekly metrics: ${weeklyDeleted.deletedCount} deleted
      - Daily snapshots: ${snapshotDeleted.deletedCount} deleted`);
    } catch (error) {
        console.error('❌ Cleanup Job failed:', error);
        throw error;
    }
}

/**
 * Health Check Job
 * Monitors system health and database connections
 */
export async function runHealthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
    console.log('💓 Running Health Check...');

    try {
        const dbHealth = await getDatabaseHealth();

        const healthyDbs = Object.values(dbHealth).filter(h => h.status === 'connected').length;
        const totalDbs = Object.keys(dbHealth).length;

        const status = healthyDbs === totalDbs ? 'healthy' : healthyDbs > 0 ? 'degraded' : 'unhealthy';

        console.log(`✅ Health Check: ${status} (${healthyDbs}/${totalDbs} databases connected)`);

        return {
            status,
            details: {
                databases: dbHealth,
                timestamp: new Date().toISOString(),
            },
        };
    } catch (error) {
        console.error('❌ Health Check failed:', error);
        return {
            status: 'unhealthy',
            details: {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
        };
    }
}

// ==================== Job Runner ====================

export type JobName = 'hourlyKPISnapshot' | 'dailyKPISnapshot' | 'weeklyRollup' | 'monthlyRollup' | 'alertEvaluation' | 'cacheRefresh' | 'cleanupJob' | 'healthCheck';

const JOB_FUNCTIONS: Record<JobName, () => Promise<unknown>> = {
    hourlyKPISnapshot: runHourlyKPISnapshot,
    dailyKPISnapshot: runDailyKPISnapshot,
    weeklyRollup: runWeeklyRollup,
    monthlyRollup: runMonthlyRollup,
    alertEvaluation: runAlertEvaluation,
    cacheRefresh: runCacheRefresh,
    cleanupJob: runCleanup,
    healthCheck: runHealthCheck,
};

export async function runJob(jobName: JobName): Promise<{ success: boolean; duration: number; error?: string }> {
    const startTime = Date.now();

    try {
        const jobFn = JOB_FUNCTIONS[jobName];
        if (!jobFn) {
            throw new Error(`Unknown job: ${jobName}`);
        }

        await jobFn();

        return {
            success: true,
            duration: Date.now() - startTime,
        };
    } catch (error) {
        return {
            success: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

const scheduledJobsService = {
    runHourlyKPISnapshot,
    runDailyKPISnapshot,
    runWeeklyRollup,
    runMonthlyRollup,
    runAlertEvaluation,
    runCacheRefresh,
    runCleanup,
    runHealthCheck,
    runJob,
    SCHEDULED_JOBS,
};

export default scheduledJobsService;
