/**
 * EC3 Data Sync Lambda Function
 * 
 * Fetches embodied carbon data from Building Transparency's EC3 API
 * and syncs it to MongoDB for use in GreenChainz sustainability analytics.
 * 
 * Trigger: EventBridge daily at 2 AM UTC
 * Timeout: 5 minutes
 * Memory: 512MB
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { MongoClient, Db, Collection, Document } from 'mongodb';
import { z } from 'zod';
import type { Handler, Context, ScheduledEvent } from 'aws-lambda';
import { EC3Client, EC3Material } from './ec3-client';

// Environment variable schema
const envSchema = z.object({
  AWS_REGION: z.string().default('us-east-1'),
  SECRET_NAME: z.string().default('greenchainz/production/api-keys'),
  SNS_TOPIC_ARN: z.string().optional(),
  MONGODB_DATABASE: z.string().default('greenchainz'),
  MONGODB_COLLECTION: z.string().default('ec3_materials'),
});

type Env = z.infer<typeof envSchema>;

// Secrets schema
const secretsSchema = z.object({
  EC3_API_KEY: z.string(),
  MONGODB_URI: z.string(),
});

type Secrets = z.infer<typeof secretsSchema>;

interface SyncResult {
  success: boolean;
  materialsProcessed: number;
  materialsInserted: number;
  materialsUpdated: number;
  errors: string[];
  durationMs: number;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

// Clients
let secretsClient: SecretsManagerClient;
let snsClient: SNSClient;
let mongoClient: MongoClient | null = null;

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

async function getMongoDb(secrets: Secrets, env: Env): Promise<Db> {
  if (!mongoClient) {
    mongoClient = new MongoClient(secrets.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
    });
    await mongoClient.connect();
    console.log('MongoDB connected successfully');
  }
  return mongoClient.db(env.MONGODB_DATABASE);
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
      Subject: `${isError ? '🚨' : '✅'} EC3 Sync: ${subject}`,
      Message: message,
    }));
    console.log('SNS notification sent');
  } catch (error) {
    console.error('Failed to send SNS notification:', error);
  }
}

interface EC3Document extends Document {
  ec3_id: string;
  name: string;
  category?: string;
  description?: string;
  manufacturer_name?: string;
  manufacturer_id?: string;
  plant_name?: string;
  plant_country?: string;
  gwp_value?: number;
  gwp_unit?: string;
  gwp_declared_unit?: string;
  epd_id?: string;
  epd_program_operator?: string;
  epd_valid_until?: string;
  epd_document_url?: string;
  raw_data: EC3Material;
  source: 'ec3';
  synced_at: Date;
  updated_at: Date;
  created_at: Date;
}

function transformMaterialToDocument(material: EC3Material): EC3Document {
  const now = new Date();
  
  return {
    ec3_id: material.id,
    name: material.name,
    category: material.category,
    description: material.description,
    manufacturer_name: material.manufacturer?.name,
    manufacturer_id: material.manufacturer?.id,
    plant_name: material.plant?.name,
    plant_country: material.plant?.country,
    gwp_value: material.gwp?.value,
    gwp_unit: material.gwp?.unit,
    gwp_declared_unit: material.gwp?.declared_unit,
    epd_id: material.epd?.id,
    epd_program_operator: material.epd?.program_operator,
    epd_valid_until: material.epd?.valid_until,
    epd_document_url: material.epd?.document_url,
    raw_data: material,
    source: 'ec3',
    synced_at: now,
    updated_at: now,
    created_at: now,
  };
}

async function syncMaterials(
  ec3Client: EC3Client,
  collection: Collection<EC3Document>,
  env: Env
): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let materialsProcessed = 0;
  let materialsInserted = 0;
  let materialsUpdated = 0;

  try {
    // Get last sync date
    const lastSync = await collection.findOne(
      {},
      { sort: { synced_at: -1 }, projection: { synced_at: 1 } }
    );
    
    const updatedSince = lastSync?.synced_at 
      ? lastSync.synced_at.toISOString().split('T')[0]
      : undefined;

    console.log(`Fetching materials${updatedSince ? ` updated since ${updatedSince}` : ' (full sync)'}...`);

    // Fetch materials from EC3
    const materials = await ec3Client.fetchAllMaterials({
      updatedSince,
      perPage: 100,
    });

    console.log(`Fetched ${materials.length} materials from EC3`);
    materialsProcessed = materials.length;

    // Batch upsert materials
    const BATCH_SIZE = 100;
    for (let i = 0; i < materials.length; i += BATCH_SIZE) {
      const batch = materials.slice(i, i + BATCH_SIZE);
      const operations = batch.map(material => {
        const doc = transformMaterialToDocument(material);
        return {
          updateOne: {
            filter: { ec3_id: material.id },
            update: {
              $set: {
                ...doc,
                updated_at: new Date(),
              },
              $setOnInsert: {
                created_at: new Date(),
              },
            },
            upsert: true,
          },
        };
      });

      try {
        const result = await collection.bulkWrite(operations);
        materialsInserted += result.upsertedCount;
        materialsUpdated += result.modifiedCount;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${errorMsg}`);
        console.error(`Batch error:`, error);
      }
    }

    // Create indexes if they don't exist
    await collection.createIndex({ ec3_id: 1 }, { unique: true });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ manufacturer_name: 1 });
    await collection.createIndex({ gwp_value: 1 });
    await collection.createIndex({ synced_at: -1 });

    return {
      success: errors.length === 0,
      materialsProcessed,
      materialsInserted,
      materialsUpdated,
      errors,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      materialsProcessed,
      materialsInserted,
      materialsUpdated,
      errors: [...errors, errorMsg],
      durationMs: Date.now() - startTime,
    };
  }
}

export const handler: Handler<ScheduledEvent, LambdaResponse> = async (
  event: ScheduledEvent,
  context: Context
): Promise<LambdaResponse> => {
  console.log('EC3 Sync Lambda started');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Request ID:', context.awsRequestId);

  const env = getEnv();
  let secrets: Secrets;
  let db: Db;

  try {
    // Get secrets
    secrets = await getSecrets(env);
    console.log('Secrets retrieved successfully');

    // Connect to MongoDB
    db = await getMongoDb(secrets, env);
    const collection = db.collection<EC3Document>(env.MONGODB_COLLECTION);

    // Initialize EC3 client
    const ec3Client = new EC3Client({
      apiKey: secrets.EC3_API_KEY,
    });

    // Perform sync
    const result = await syncMaterials(ec3Client, collection, env);

    // Log results
    console.log('Sync completed:', JSON.stringify(result, null, 2));

    // Send notification
    if (result.success) {
      await sendNotification(
        env,
        'Sync Completed Successfully',
        `EC3 Data Sync completed.

Processed: ${result.materialsProcessed} materials
Inserted: ${result.materialsInserted}
Updated: ${result.materialsUpdated}
Duration: ${(result.durationMs / 1000).toFixed(2)}s

Request ID: ${context.awsRequestId}`
      );
    } else {
      await sendNotification(
        env,
        'Sync Completed with Errors',
        `EC3 Data Sync completed with errors.

Processed: ${result.materialsProcessed} materials
Inserted: ${result.materialsInserted}
Updated: ${result.materialsUpdated}
Duration: ${(result.durationMs / 1000).toFixed(2)}s

Errors:
${result.errors.join('\n')}

Request ID: ${context.awsRequestId}`,
        true
      );
    }

    return {
      statusCode: result.success ? 200 : 207,
      body: JSON.stringify({
        message: result.success ? 'EC3 sync completed successfully' : 'EC3 sync completed with errors',
        ...result,
      }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('EC3 Sync failed:', error);

    await sendNotification(
      env,
      'Sync Failed',
      `EC3 Data Sync failed.

Error: ${errorMessage}
${errorStack ? `\nStack:\n${errorStack}` : ''}

Request ID: ${context.awsRequestId}`,
      true
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'EC3 sync failed',
        error: errorMessage,
      }),
    };
  } finally {
    // Don't close MongoDB connection in Lambda - reuse across invocations
  }
};
