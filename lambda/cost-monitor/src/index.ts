/**
 * AWS Cost Monitor Lambda Function
 * 
 * Monitors AWS costs and sends alerts when spending exceeds thresholds.
 * Uses AWS Cost Explorer API to get current month's spending.
 * 
 * Trigger: EventBridge daily at 6 AM UTC
 * Timeout: 2 minutes
 * Memory: 256MB
 */

import {
  CostExplorerClient,
  GetCostAndUsageCommand,
  GetCostForecastCommand,
} from '@aws-sdk/client-cost-explorer';
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { z } from 'zod';
import type { Handler, Context, ScheduledEvent } from 'aws-lambda';

// Environment variable schema
const envSchema = z.object({
  AWS_REGION: z.string().default('us-east-1'),
  SNS_TOPIC_ARN: z.string(),
  MONTHLY_BUDGET: z.coerce.number().default(100),
  WARNING_THRESHOLD_PERCENT: z.coerce.number().default(80),
  CRITICAL_THRESHOLD_PERCENT: z.coerce.number().default(100),
});

type Env = z.infer<typeof envSchema>;

interface CostResult {
  currentMonthCost: number;
  previousDayCost: number;
  forecastedMonthCost: number;
  costByService: Record<string, number>;
  budgetUsedPercent: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  daysRemaining: number;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

// Clients
let costExplorerClient: CostExplorerClient;
let cloudWatchClient: CloudWatchClient;
let snsClient: SNSClient;

function getEnv(): Env {
  return envSchema.parse(process.env);
}

function getDateRange(): { startDate: string; endDate: string; monthStart: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  
  // First day of current month
  const monthStart = new Date(Date.UTC(year, month, 1));
  
  // Today
  const today = new Date(Date.UTC(year, month, now.getUTCDate()));
  
  // Tomorrow (for end date - Cost Explorer uses exclusive end)
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  return {
    startDate: monthStart.toISOString().split('T')[0] ?? '',
    endDate: tomorrow.toISOString().split('T')[0] ?? '',
    monthStart: monthStart.toISOString().split('T')[0] ?? '',
  };
}

function getMonthEndDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  
  // Last day of current month
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  return lastDay.toISOString().split('T')[0] ?? '';
}

function getDaysRemainingInMonth(): number {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const today = now.getUTCDate();
  
  return lastDay.getUTCDate() - today;
}

async function getCurrentMonthCost(env: Env): Promise<{
  total: number;
  byService: Record<string, number>;
}> {
  costExplorerClient = costExplorerClient ?? new CostExplorerClient({ region: env.AWS_REGION });

  const { startDate, endDate } = getDateRange();

  const response = await costExplorerClient.send(new GetCostAndUsageCommand({
    TimePeriod: {
      Start: startDate,
      End: endDate,
    },
    Granularity: 'MONTHLY',
    Metrics: ['UnblendedCost'],
    GroupBy: [
      {
        Type: 'DIMENSION',
        Key: 'SERVICE',
      },
    ],
    Filter: {
      Tags: {
        Key: 'project',
        Values: ['greenchainz'],
        MatchOptions: ['EQUALS'],
      },
    },
  }));

  const byService: Record<string, number> = {};
  let total = 0;

  const groups = response.ResultsByTime?.[0]?.Groups ?? [];
  for (const group of groups) {
    const serviceName = group.Keys?.[0] ?? 'Unknown';
    const amount = parseFloat(group.Metrics?.['UnblendedCost']?.Amount ?? '0');
    byService[serviceName] = amount;
    total += amount;
  }

  return { total, byService };
}

async function getPreviousDayCost(env: Env): Promise<number> {
  costExplorerClient = costExplorerClient ?? new CostExplorerClient({ region: env.AWS_REGION });

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const today = new Date(now);
  
  const startDate = yesterday.toISOString().split('T')[0] ?? '';
  const endDate = today.toISOString().split('T')[0] ?? '';

  const response = await costExplorerClient.send(new GetCostAndUsageCommand({
    TimePeriod: {
      Start: startDate,
      End: endDate,
    },
    Granularity: 'DAILY',
    Metrics: ['UnblendedCost'],
    Filter: {
      Tags: {
        Key: 'project',
        Values: ['greenchainz'],
        MatchOptions: ['EQUALS'],
      },
    },
  }));

  const amount = response.ResultsByTime?.[0]?.Total?.['UnblendedCost']?.Amount;
  return parseFloat(amount ?? '0');
}

async function getForecastedCost(env: Env): Promise<number> {
  costExplorerClient = costExplorerClient ?? new CostExplorerClient({ region: env.AWS_REGION });

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const startDate = tomorrow.toISOString().split('T')[0] ?? '';
  const endDate = getMonthEndDate();

  // If we're at the end of the month, no forecast needed
  if (startDate >= endDate) {
    return 0;
  }

  try {
    const response = await costExplorerClient.send(new GetCostForecastCommand({
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Metric: 'UNBLENDED_COST',
      Granularity: 'MONTHLY',
      Filter: {
        Tags: {
          Key: 'project',
          Values: ['greenchainz'],
          MatchOptions: ['EQUALS'],
        },
      },
    }));

    return parseFloat(response.Total?.Amount ?? '0');
  } catch (error) {
    // Forecast might not be available if there's not enough data
    console.warn('Could not get cost forecast:', error);
    return 0;
  }
}

async function publishMetrics(
  env: Env,
  result: CostResult
): Promise<void> {
  cloudWatchClient = cloudWatchClient ?? new CloudWatchClient({ region: env.AWS_REGION });

  const timestamp = new Date();

  await cloudWatchClient.send(new PutMetricDataCommand({
    Namespace: 'GreenChainz/Costs',
    MetricData: [
      {
        MetricName: 'MonthToDateCost',
        Value: result.currentMonthCost,
        Unit: 'None',
        Timestamp: timestamp,
        Dimensions: [
          { Name: 'Project', Value: 'greenchainz' },
        ],
      },
      {
        MetricName: 'DailyCost',
        Value: result.previousDayCost,
        Unit: 'None',
        Timestamp: timestamp,
        Dimensions: [
          { Name: 'Project', Value: 'greenchainz' },
        ],
      },
      {
        MetricName: 'BudgetUsedPercent',
        Value: result.budgetUsedPercent,
        Unit: 'Percent',
        Timestamp: timestamp,
        Dimensions: [
          { Name: 'Project', Value: 'greenchainz' },
        ],
      },
      {
        MetricName: 'ForecastedMonthCost',
        Value: result.forecastedMonthCost,
        Unit: 'None',
        Timestamp: timestamp,
        Dimensions: [
          { Name: 'Project', Value: 'greenchainz' },
        ],
      },
    ],
  }));
}

async function sendNotification(
  env: Env,
  result: CostResult
): Promise<void> {
  snsClient = snsClient ?? new SNSClient({ region: env.AWS_REGION });

  const statusEmoji = result.status === 'CRITICAL' ? '🚨' : result.status === 'WARNING' ? '⚠️' : '✅';
  
  const topServices = Object.entries(result.costByService)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([service, cost]) => `  - ${service}: $${cost.toFixed(2)}`)
    .join('\n');

  const message = `${statusEmoji} GreenChainz AWS Cost Report

Status: ${result.status}
Budget: $${env.MONTHLY_BUDGET.toFixed(2)}/month

Current Month Spending:
  - Month to Date: $${result.currentMonthCost.toFixed(2)} (${result.budgetUsedPercent.toFixed(1)}% of budget)
  - Yesterday: $${result.previousDayCost.toFixed(2)}
  - Forecasted Total: $${result.forecastedMonthCost.toFixed(2)}

Days Remaining: ${result.daysRemaining}

Top Services by Cost:
${topServices}

${result.status !== 'OK' ? `
⚠️ ACTION REQUIRED: Spending has exceeded ${result.status === 'CRITICAL' ? '100%' : '80%'} of monthly budget!
` : ''}
---
Report generated at ${new Date().toISOString()}`;

  await snsClient.send(new PublishCommand({
    TopicArn: env.SNS_TOPIC_ARN,
    Subject: `${statusEmoji} AWS Cost Alert: ${result.status} - $${result.currentMonthCost.toFixed(2)}/${env.MONTHLY_BUDGET}`,
    Message: message,
  }));
}

async function checkCosts(env: Env): Promise<CostResult> {
  // Get current month's cost
  const { total: currentMonthCost, byService } = await getCurrentMonthCost(env);

  // Get yesterday's cost
  const previousDayCost = await getPreviousDayCost(env);

  // Get forecasted cost for the month
  const forecastedCost = await getForecastedCost(env);
  const forecastedMonthCost = currentMonthCost + forecastedCost;

  // Calculate budget usage
  const budgetUsedPercent = (currentMonthCost / env.MONTHLY_BUDGET) * 100;

  // Determine status
  let status: CostResult['status'] = 'OK';
  if (budgetUsedPercent >= env.CRITICAL_THRESHOLD_PERCENT) {
    status = 'CRITICAL';
  } else if (budgetUsedPercent >= env.WARNING_THRESHOLD_PERCENT) {
    status = 'WARNING';
  }

  return {
    currentMonthCost,
    previousDayCost,
    forecastedMonthCost,
    costByService: byService,
    budgetUsedPercent,
    status,
    daysRemaining: getDaysRemainingInMonth(),
  };
}

export const handler: Handler<ScheduledEvent, LambdaResponse> = async (
  event: ScheduledEvent,
  context: Context
): Promise<LambdaResponse> => {
  console.log('Cost Monitor Lambda started');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Request ID:', context.awsRequestId);

  const env = getEnv();

  try {
    // Check costs
    const result = await checkCosts(env);
    console.log('Cost check result:', JSON.stringify(result, null, 2));

    // Publish CloudWatch metrics
    await publishMetrics(env, result);
    console.log('Metrics published to CloudWatch');

    // Send notification if WARNING or CRITICAL, or daily summary
    if (result.status !== 'OK' || event.source === 'manual') {
      await sendNotification(env, result);
      console.log('Notification sent');
    } else {
      // Send daily summary
      await sendNotification(env, result);
      console.log('Daily summary sent');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cost check completed',
        ...result,
      }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Cost Monitor failed:', error);

    // Try to send error notification
    try {
      snsClient = snsClient ?? new SNSClient({ region: env.AWS_REGION });
      await snsClient.send(new PublishCommand({
        TopicArn: env.SNS_TOPIC_ARN,
        Subject: '🚨 AWS Cost Monitor Failed',
        Message: `Cost monitoring Lambda failed.

Error: ${errorMessage}
${errorStack ? `\nStack:\n${errorStack}` : ''}

Request ID: ${context.awsRequestId}`,
      }));
    } catch {
      console.error('Failed to send error notification');
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Cost check failed',
        error: errorMessage,
      }),
    };
  }
};
