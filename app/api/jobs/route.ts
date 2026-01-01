import { NextRequest, NextResponse } from 'next/server';

// Job names as defined in Azure Functions
type JobName =
  | 'hourlyKPISnapshot'
  | 'dailyKPISnapshot'
  | 'weeklyRollup'
  | 'monthlyRollup'
  | 'alertEvaluation'
  | 'cacheRefresh'
  | 'cleanupJob'
  | 'healthCheck';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobName, apiKey } = body;

    // Validate API Key
    const expectedApiKey = process.env.JOBS_API_KEY;
    if (apiKey !== expectedApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!jobName) {
      return NextResponse.json({ error: 'Missing jobName' }, { status: 400 });
    }

    console.log(`[API] Received job: ${jobName}`);

    // Execute the requested job
    // Ideally, these would call dedicated service functions.
    // For now, we will log and return success to ensure the wiring is correct.
    // You should implement the actual logic for each job in their respective services.

    let result = { message: 'Job executed successfully', job: jobName };

    switch (jobName as JobName) {
      case 'healthCheck':
        // Simple health check
        break;

      case 'dailyKPISnapshot':
        // TODO: Call KPI service to snapshot daily metrics
        console.log('Executing Daily KPI Snapshot logic...');
        break;

      case 'hourlyKPISnapshot':
        // TODO: Call KPI service
        console.log('Executing Hourly KPI Snapshot logic...');
        break;

      case 'weeklyRollup':
        console.log('Executing Weekly Rollup logic...');
        break;

      case 'monthlyRollup':
        console.log('Executing Monthly Rollup logic...');
        break;

      case 'alertEvaluation':
         console.log('Evaluating alerts...');
         break;

      case 'cacheRefresh':
        console.log('Refreshing caches...');
        break;

      case 'cleanupJob':
        console.log('Running cleanup...');
        break;

      default:
        console.warn(`Unknown job name: ${jobName}`);
        return NextResponse.json({ error: `Unknown job: ${jobName}` }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Job execution error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
