"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Azure Functions - KPI Scheduled Jobs
 *
 * Timer-triggered functions for automated KPI calculations:
 * - DailyKPISnapshot: Runs daily at 2 AM UTC
 * - HourlyKPISnapshot: Runs every hour
 * - WeeklyRollup: Runs every Sunday at 3 AM UTC
 * - MonthlyRollup: Runs 1st of month at 4 AM UTC
 * - AlertEvaluation: Runs every 15 minutes
 */
const functions_1 = require("@azure/functions");
// Base URL for your Next.js API
const API_BASE_URL = process.env.NEXT_API_BASE_URL || 'http://localhost:3001';
const JOBS_API_KEY = process.env.JOBS_API_KEY || '';
async function triggerJob(jobName, context) {
    const startTime = Date.now();
    try {
        context.log(`Starting job: ${jobName}`);
        const response = await fetch(`${API_BASE_URL}/api/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobName,
                apiKey: JOBS_API_KEY,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API returned ${response.status}: ${errorText}`);
        }
        const result = await response.json();
        context.log(`Job ${jobName} completed in ${Date.now() - startTime}ms`);
        return {
            success: true,
            duration: Date.now() - startTime,
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        context.error(`Job ${jobName} failed: ${errorMessage}`);
        return {
            success: false,
            duration: Date.now() - startTime,
            error: errorMessage,
        };
    }
}
// ==================== Timer Functions ====================
/**
 * Daily KPI Snapshot - Runs at 2 AM UTC every day
 * Captures comprehensive daily metrics
 */
functions_1.app.timer('DailyKPISnapshot', {
    schedule: '0 0 2 * * *', // CRON: At 2:00 AM every day
    handler: async (myTimer, context) => {
        context.log('DailyKPISnapshot function triggered');
        const result = await triggerJob('dailyKPISnapshot', context);
        context.log('DailyKPISnapshot result:', result);
    },
});
/**
 * Hourly KPI Snapshot - Runs every hour
 * Quick metrics capture for real-time dashboards
 */
functions_1.app.timer('HourlyKPISnapshot', {
    schedule: '0 0 * * * *', // CRON: Every hour
    handler: async (myTimer, context) => {
        context.log('HourlyKPISnapshot function triggered');
        const result = await triggerJob('hourlyKPISnapshot', context);
        context.log('HourlyKPISnapshot result:', result);
    },
});
/**
 * Weekly Rollup - Runs every Sunday at 3 AM UTC
 * Aggregates daily metrics into weekly summaries
 */
functions_1.app.timer('WeeklyRollup', {
    schedule: '0 0 3 * * 0', // CRON: At 3:00 AM every Sunday
    handler: async (myTimer, context) => {
        context.log('WeeklyRollup function triggered');
        const result = await triggerJob('weeklyRollup', context);
        context.log('WeeklyRollup result:', result);
    },
});
/**
 * Monthly Rollup - Runs 1st of every month at 4 AM UTC
 * Aggregates daily/weekly metrics into monthly summaries
 */
functions_1.app.timer('MonthlyRollup', {
    schedule: '0 0 4 1 * *', // CRON: At 4:00 AM on the 1st of every month
    handler: async (myTimer, context) => {
        context.log('MonthlyRollup function triggered');
        const result = await triggerJob('monthlyRollup', context);
        context.log('MonthlyRollup result:', result);
    },
});
/**
 * Alert Evaluation - Runs every 15 minutes
 * Checks all active alerts and triggers notifications
 */
functions_1.app.timer('AlertEvaluation', {
    schedule: '0 */15 * * * *', // CRON: Every 15 minutes
    handler: async (myTimer, context) => {
        context.log('AlertEvaluation function triggered');
        const result = await triggerJob('alertEvaluation', context);
        context.log('AlertEvaluation result:', result);
    },
});
/**
 * Cache Refresh - Runs every 6 hours
 * Updates external data provider caches (EC3, Autodesk, EPD)
 */
functions_1.app.timer('CacheRefresh', {
    schedule: '0 0 */6 * * *', // CRON: Every 6 hours
    handler: async (myTimer, context) => {
        context.log('CacheRefresh function triggered');
        const result = await triggerJob('cacheRefresh', context);
        context.log('CacheRefresh result:', result);
    },
});
/**
 * Weekly Cleanup - Runs every Sunday at 5 AM UTC
 * Removes old metrics data to save storage
 */
functions_1.app.timer('WeeklyCleanup', {
    schedule: '0 0 5 * * 0', // CRON: At 5:00 AM every Sunday
    handler: async (myTimer, context) => {
        context.log('WeeklyCleanup function triggered');
        const result = await triggerJob('cleanupJob', context);
        context.log('WeeklyCleanup result:', result);
    },
});
/**
 * Health Check - Runs every 5 minutes
 * Monitors system health and database connections
 */
functions_1.app.timer('HealthCheck', {
    schedule: '0 */5 * * * *', // CRON: Every 5 minutes
    handler: async (myTimer, context) => {
        context.log('HealthCheck function triggered');
        const result = await triggerJob('healthCheck', context);
        if (!result.success) {
            context.warn('Health check failed - system may be degraded');
        }
    },
});
// ==================== HTTP Trigger for Manual Execution ====================
functions_1.app.http('ManualJobTrigger', {
    methods: ['POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { jobName } = body;
            if (!jobName) {
                return {
                    status: 400,
                    body: JSON.stringify({ error: 'jobName is required' }),
                };
            }
            const validJobs = [
                'hourlyKPISnapshot',
                'dailyKPISnapshot',
                'weeklyRollup',
                'monthlyRollup',
                'alertEvaluation',
                'cacheRefresh',
                'cleanupJob',
                'healthCheck',
            ];
            if (!validJobs.includes(jobName)) {
                return {
                    status: 400,
                    body: JSON.stringify({ error: `Invalid job. Valid jobs: ${validJobs.join(', ')}` }),
                };
            }
            const result = await triggerJob(jobName, context);
            return {
                status: result.success ? 200 : 500,
                body: JSON.stringify(result),
            };
        }
        catch (error) {
            return {
                status: 500,
                body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            };
        }
    },
});
//# sourceMappingURL=kpiJobs.js.map