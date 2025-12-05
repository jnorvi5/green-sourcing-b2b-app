/**
 * Supabase Backup Lambda Function
 * 
 * Creates daily backups of Supabase PostgreSQL database and uploads to S3.
 * Uses Supabase Management API to trigger and download backups.
 * 
 * Trigger: EventBridge daily at 4 AM UTC
 * Timeout: 15 minutes
 * Memory: 256MB
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { z } from 'zod';
import type { Handler, Context, ScheduledEvent } from 'aws-lambda';

// Environment variable schema
const envSchema = z.object({
  AWS_REGION: z.string().default('us-east-1'),
  SECRET_NAME: z.string().default('greenchainz/production/api-keys'),
  SNS_TOPIC_ARN: z.string().optional(),
  BACKUP_BUCKET: z.string().default('gc-data-backups-prod'),
});

type Env = z.infer<typeof envSchema>;

// Secrets schema
const secretsSchema = z.object({
  SUPABASE_ACCESS_TOKEN: z.string(),
  SUPABASE_PROJECT_REF: z.string(),
});

type Secrets = z.infer<typeof secretsSchema>;

interface BackupResult {
  success: boolean;
  backupId?: string;
  s3Key?: string;
  s3Bucket?: string;
  sizeBytes?: number;
  durationMs: number;
  error?: string;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

// Supabase API response types
interface SupabaseBackup {
  id: string;
  inserted_at: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED';
  is_physical_backup: boolean;
}

interface SupabaseBackupDownload {
  url: string;
  expires_at: string;
}

// Clients
let secretsClient: SecretsManagerClient;
let s3Client: S3Client;
let snsClient: SNSClient;

function getEnv(): Env {
  return envSchema.parse(process.env);
}

async function getSecrets(env: Env): Promise<Secrets> {
  secretsClient = secretsClient ?? new SecretsManagerClient({ region: env.AWS_REGION });

  const command = new GetSecretValueCommand({
    SecretId: env.SECRET_NAME,
  });

  const response = await secretsClient.send(command);
  
  if (!response.SecretString) {
    throw new Error('Secret string is empty');
  }

  const rawSecrets: unknown = JSON.parse(response.SecretString);
  return secretsSchema.parse(rawSecrets);
}

async function sendNotification(
  env: Env,
  subject: string,
  message: string,
  isError = false
): Promise<void> {
  if (!env.SNS_TOPIC_ARN) {
    console.log('SNS topic not configured, skipping notification');
    return;
  }

  snsClient = snsClient ?? new SNSClient({ region: env.AWS_REGION });

  try {
    await snsClient.send(new PublishCommand({
      TopicArn: env.SNS_TOPIC_ARN,
      Subject: `${isError ? '🚨' : '✅'} Supabase Backup: ${subject}`,
      Message: message,
    }));
    console.log('SNS notification sent');
  } catch (error) {
    console.error('Failed to send SNS notification:', error);
  }
}

async function getLatestBackup(
  secrets: Secrets
): Promise<SupabaseBackup | null> {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${secrets.SUPABASE_PROJECT_REF}/database/backups`,
    {
      headers: {
        'Authorization': `Bearer ${secrets.SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get backups: ${response.status} ${errorText}`);
  }

  const data = await response.json() as SupabaseBackup[];
  
  // Get the most recent completed backup
  const completedBackups = data.filter(b => b.status === 'COMPLETED');
  if (completedBackups.length === 0) {
    return null;
  }

  // Sort by date descending
  completedBackups.sort((a, b) => 
    new Date(b.inserted_at).getTime() - new Date(a.inserted_at).getTime()
  );

  return completedBackups[0] ?? null;
}

async function downloadBackup(
  secrets: Secrets,
  backupId: string
): Promise<{ data: Buffer; size: number }> {
  // Get download URL
  const urlResponse = await fetch(
    `https://api.supabase.com/v1/projects/${secrets.SUPABASE_PROJECT_REF}/database/backups/${backupId}/download`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secrets.SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!urlResponse.ok) {
    const errorText = await urlResponse.text();
    throw new Error(`Failed to get download URL: ${urlResponse.status} ${errorText}`);
  }

  const downloadInfo = await urlResponse.json() as SupabaseBackupDownload;

  // Download the backup
  console.log('Downloading backup...');
  const backupResponse = await fetch(downloadInfo.url);

  if (!backupResponse.ok) {
    throw new Error(`Failed to download backup: ${backupResponse.status}`);
  }

  const arrayBuffer = await backupResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    data: buffer,
    size: buffer.length,
  };
}

async function uploadToS3(
  env: Env,
  data: Buffer,
  backupId: string,
  timestamp: Date
): Promise<{ key: string; bucket: string }> {
  s3Client = s3Client ?? new S3Client({ region: env.AWS_REGION });

  const dateStr = timestamp.toISOString().split('T')[0];
  const key = `supabase/${dateStr}/${backupId}.sql.gz`;

  await s3Client.send(new PutObjectCommand({
    Bucket: env.BACKUP_BUCKET,
    Key: key,
    Body: data,
    ContentType: 'application/gzip',
    Metadata: {
      'backup-id': backupId,
      'backup-date': timestamp.toISOString(),
      'source': 'supabase',
    },
  }));

  return {
    key,
    bucket: env.BACKUP_BUCKET,
  };
}

async function performBackup(
  secrets: Secrets,
  env: Env
): Promise<BackupResult> {
  const startTime = Date.now();

  try {
    // Get the latest backup
    console.log('Getting latest Supabase backup...');
    const backup = await getLatestBackup(secrets);

    if (!backup) {
      throw new Error('No completed backups found');
    }

    console.log(`Found backup ${backup.id} from ${backup.inserted_at}`);

    // Check if backup is recent (within last 24 hours)
    const backupDate = new Date(backup.inserted_at);
    const hoursSinceBackup = (Date.now() - backupDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceBackup > 25) {
      console.warn(`Warning: Latest backup is ${hoursSinceBackup.toFixed(1)} hours old`);
    }

    // Download backup
    const { data, size } = await downloadBackup(secrets, backup.id);
    console.log(`Downloaded backup: ${(size / 1024 / 1024).toFixed(2)} MB`);

    // Upload to S3
    const { key, bucket } = await uploadToS3(env, data, backup.id, backupDate);
    console.log(`Uploaded to s3://${bucket}/${key}`);

    return {
      success: true,
      backupId: backup.id,
      s3Key: key,
      s3Bucket: bucket,
      sizeBytes: size,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      durationMs: Date.now() - startTime,
      error: errorMessage,
    };
  }
}

export const handler: Handler<ScheduledEvent, LambdaResponse> = async (
  event: ScheduledEvent,
  context: Context
): Promise<LambdaResponse> => {
  console.log('Supabase Backup Lambda started');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Request ID:', context.awsRequestId);

  const env = getEnv();
  let secrets: Secrets;

  try {
    // Get secrets
    secrets = await getSecrets(env);
    console.log('Secrets retrieved successfully');

    // Perform backup
    const result = await performBackup(secrets, env);

    // Log results
    console.log('Backup completed:', JSON.stringify(result, null, 2));

    // Send notification
    if (result.success) {
      await sendNotification(
        env,
        'Backup Completed Successfully',
        `Supabase Database Backup completed.

Backup ID: ${result.backupId}
S3 Location: s3://${result.s3Bucket}/${result.s3Key}
Size: ${((result.sizeBytes ?? 0) / 1024 / 1024).toFixed(2)} MB
Duration: ${(result.durationMs / 1000).toFixed(2)}s

Request ID: ${context.awsRequestId}`
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'Backup completed successfully',
          ...result,
        }),
      };
    } else {
      await sendNotification(
        env,
        'Backup Failed',
        `Supabase Database Backup failed.

Error: ${result.error}
Duration: ${(result.durationMs / 1000).toFixed(2)}s

Request ID: ${context.awsRequestId}`,
        true
      );

      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Backup failed',
          ...result,
        }),
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Supabase Backup failed:', error);

    await sendNotification(
      env,
      'Backup Failed',
      `Supabase Database Backup failed with exception.

Error: ${errorMessage}
${errorStack ? `\nStack:\n${errorStack}` : ''}

Request ID: ${context.awsRequestId}`,
      true
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Backup failed',
        error: errorMessage,
      }),
    };
  }
};
