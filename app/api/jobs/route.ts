/**
 * Scheduled Jobs API
 * 
 * Endpoints for:
 * - GET /api/jobs - List all scheduled jobs
 * - POST /api/jobs - Trigger a job manually
 * - GET /api/jobs/health - System health check
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    SCHEDULED_JOBS,
    runJob,
    runHealthCheck,
    JobName
} from '../../../lib/scheduledJobs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for long-running jobs

// GET - List jobs or get health
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'health') {
            const health = await runHealthCheck();
            return NextResponse.json(health);
        }

        // Return list of scheduled jobs
        return NextResponse.json({
            jobs: Object.entries(SCHEDULED_JOBS).map(([key, config]) => ({
                id: key,
                ...config,
            })),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Jobs API Error:', error);
        return NextResponse.json(
            { error: 'Failed to get jobs info' },
            { status: 500 }
        );
    }
}

// POST - Trigger a job manually
export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { jobName?: string; apiKey?: string };
        const { jobName, apiKey } = body;

        // Simple API key check (for Azure Functions or external callers)
        const expectedKey = process.env.JOBS_API_KEY;
        if (expectedKey && apiKey !== expectedKey) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!jobName) {
            return NextResponse.json(
                { error: 'Job name required' },
                { status: 400 }
            );
        }

        // Validate job name
        const validJobs = [...Object.keys(SCHEDULED_JOBS), 'healthCheck'] as const;
        if (!validJobs.includes(jobName as JobName)) {
            return NextResponse.json(
                { error: `Invalid job name. Valid jobs: ${validJobs.join(', ')}` },
                { status: 400 }
            );
        }

        console.log(`🚀 Manually triggering job: ${jobName}`);

        const result = await runJob(jobName as JobName);

        return NextResponse.json({
            job: jobName,
            ...result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Jobs API Error:', error);
        return NextResponse.json(
            { error: 'Failed to run job' },
            { status: 500 }
        );
    }
}
