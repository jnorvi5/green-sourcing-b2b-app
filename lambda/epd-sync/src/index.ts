/**
 * EPD International Data Sync Lambda Function
 * 
 * Fetches Environmental Product Declaration data from EPD International API
 * and syncs it to MongoDB for use in GreenChainz sustainability analytics.
 * 
 * Trigger: EventBridge weekly on Sundays at 3 AM UTC
 * Timeout: 10 minutes
 * Memory: 1024MB
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { MongoClient, Db, Collection, Document } from 'mongodb';
import { z } from 'zod';
import type { Handler, Context, ScheduledEvent } from 'aws-lambda';
import { EPDClient, EPDProduct } from './epd-client';

// Environment variable schema
const envSchema = z.object({
  AWS_REGION: z.string().default('us-east-1'),
  SECRET_NAME: z.string().default('greenchainz/production/api-keys'),
  SNS_TOPIC_ARN: z.string().optional(),
  MONGODB_DATABASE: z.string().default('greenchainz'),
  MONGODB_COLLECTION: z.string().default('epd_products'),
});

type Env = z.infer<typeof envSchema>;

// Secrets schema
const secretsSchema = z.object({
  EPD_INTERNATIONAL_API_KEY: z.string(),
  MONGODB_URI: z.string(),
});

type Secrets = z.infer<typeof secretsSchema>;

interface SyncResult {
  success: boolean;
  epdsProcessed: number;
  epdsInserted: number;
  epdsUpdated: number;
  epdsExpired: number;
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
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 60000,
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
      Subject: `${isError ? '🚨' : '✅'} EPD Sync: ${subject}`,
      Message: message,
    }));
    console.log('SNS notification sent');
  } catch (error) {
    console.error('Failed to send SNS notification:', error);
  }
}

interface EPDDocument extends Document {
  epd_uuid: string;
  name: string;
  registration_number?: string;
  status?: string;
  valid_until?: string;
  published_date?: string;
  declared_unit_value?: number;
  declared_unit?: string;
  manufacturer_name?: string;
  manufacturer_country?: string;
  manufacturer_website?: string;
  product_category_name?: string;
  product_category_code?: string;
  pcr_name?: string;
  pcr_version?: string;
  program_operator_name?: string;
  program_operator_website?: string;
  gwp_a1a3?: number;
  gwp_a4?: number;
  gwp_a5?: number;
  gwp_b1b7?: number;
  gwp_c1c4?: number;
  gwp_d?: number;
  gwp_total?: number;
  odp?: number;
  ap?: number;
  ep?: number;
  pocp?: number;
  document_url?: string;
  external_links?: Array<{ type?: string; url?: string }>;
  raw_data: EPDProduct;
  source: 'epd_international';
  is_valid: boolean;
  synced_at: Date;
  updated_at: Date;
  created_at: Date;
}

function transformEPDToDocument(epd: EPDProduct): EPDDocument {
  const now = new Date();
  const validUntil = epd.validUntil ? new Date(epd.validUntil) : null;
  const isValid = validUntil ? validUntil > now : true;

  // Calculate combined lifecycle stages
  const gwpB1B7 = [
    epd.impacts?.gwp?.b1,
    epd.impacts?.gwp?.b2,
    epd.impacts?.gwp?.b3,
    epd.impacts?.gwp?.b4,
    epd.impacts?.gwp?.b5,
    epd.impacts?.gwp?.b6,
    epd.impacts?.gwp?.b7,
  ].filter((v): v is number => v !== undefined && v !== null).reduce((a, b) => a + b, 0) || undefined;

  const gwpC1C4 = [
    epd.impacts?.gwp?.c1,
    epd.impacts?.gwp?.c2,
    epd.impacts?.gwp?.c3,
    epd.impacts?.gwp?.c4,
  ].filter((v): v is number => v !== undefined && v !== null).reduce((a, b) => a + b, 0) || undefined;

  return {
    epd_uuid: epd.uuid,
    name: epd.name,
    registration_number: epd.registrationNumber,
    status: epd.status,
    valid_until: epd.validUntil,
    published_date: epd.publishedDate,
    declared_unit_value: epd.declaredUnit?.value,
    declared_unit: epd.declaredUnit?.unit,
    manufacturer_name: epd.manufacturer?.name,
    manufacturer_country: epd.manufacturer?.country,
    manufacturer_website: epd.manufacturer?.website,
    product_category_name: epd.productCategory?.name,
    product_category_code: epd.productCategory?.code,
    pcr_name: epd.pcr?.name,
    pcr_version: epd.pcr?.version,
    program_operator_name: epd.programOperator?.name,
    program_operator_website: epd.programOperator?.website,
    gwp_a1a3: epd.impacts?.gwp?.a1a3,
    gwp_a4: epd.impacts?.gwp?.a4,
    gwp_a5: epd.impacts?.gwp?.a5,
    gwp_b1b7: gwpB1B7,
    gwp_c1c4: gwpC1C4,
    gwp_d: epd.impacts?.gwp?.d,
    gwp_total: epd.impacts?.gwp?.total,
    odp: epd.impacts?.odp,
    ap: epd.impacts?.ap,
    ep: epd.impacts?.ep,
    pocp: epd.impacts?.pocp,
    document_url: epd.documentUrl,
    external_links: epd.externalLinks,
    raw_data: epd,
    source: 'epd_international',
    is_valid: isValid,
    synced_at: now,
    updated_at: now,
    created_at: now,
  };
}

async function syncEPDs(
  epdClient: EPDClient,
  collection: Collection<EPDDocument>,
  env: Env
): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let epdsProcessed = 0;
  let epdsInserted = 0;
  let epdsUpdated = 0;
  let epdsExpired = 0;

  try {
    // Fetch all valid EPDs
    console.log('Fetching EPDs from EPD International API...');
    
    const epds = await epdClient.fetchAllEPDs({
      status: 'valid',
      perPage: 100,
    });

    console.log(`Fetched ${epds.length} EPDs from EPD International`);
    epdsProcessed = epds.length;

    // Batch upsert EPDs
    const BATCH_SIZE = 50;
    for (let i = 0; i < epds.length; i += BATCH_SIZE) {
      const batch = epds.slice(i, i + BATCH_SIZE);
      const operations = batch.map(epd => {
        const doc = transformEPDToDocument(epd);
        return {
          updateOne: {
            filter: { epd_uuid: epd.uuid },
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
        epdsInserted += result.upsertedCount;
        epdsUpdated += result.modifiedCount;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${errorMsg}`);
        console.error(`Batch error:`, error);
      }
    }

    // Mark expired EPDs
    const expireResult = await collection.updateMany(
      {
        is_valid: true,
        valid_until: { $lt: new Date().toISOString() },
      },
      {
        $set: {
          is_valid: false,
          updated_at: new Date(),
        },
      }
    );
    epdsExpired = expireResult.modifiedCount;

    // Create indexes if they don't exist
    await collection.createIndex({ epd_uuid: 1 }, { unique: true });
    await collection.createIndex({ manufacturer_name: 1 });
    await collection.createIndex({ product_category_code: 1 });
    await collection.createIndex({ gwp_total: 1 });
    await collection.createIndex({ is_valid: 1 });
    await collection.createIndex({ synced_at: -1 });
    await collection.createIndex({ valid_until: 1 });
    await collection.createIndex({ 
      name: 'text', 
      manufacturer_name: 'text',
      product_category_name: 'text'
    });

    return {
      success: errors.length === 0,
      epdsProcessed,
      epdsInserted,
      epdsUpdated,
      epdsExpired,
      errors,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      epdsProcessed,
      epdsInserted,
      epdsUpdated,
      epdsExpired,
      errors: [...errors, errorMsg],
      durationMs: Date.now() - startTime,
    };
  }
}

export const handler: Handler<ScheduledEvent, LambdaResponse> = async (
  event: ScheduledEvent,
  context: Context
): Promise<LambdaResponse> => {
  console.log('EPD International Sync Lambda started');
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
    const collection = db.collection<EPDDocument>(env.MONGODB_COLLECTION);

    // Initialize EPD client
    const epdClient = new EPDClient({
      apiKey: secrets.EPD_INTERNATIONAL_API_KEY,
    });

    // Perform sync
    const result = await syncEPDs(epdClient, collection, env);

    // Log results
    console.log('Sync completed:', JSON.stringify(result, null, 2));

    // Send notification
    if (result.success) {
      await sendNotification(
        env,
        'Weekly Sync Completed Successfully',
        `EPD International Data Sync completed.

Processed: ${result.epdsProcessed} EPDs
Inserted: ${result.epdsInserted}
Updated: ${result.epdsUpdated}
Marked Expired: ${result.epdsExpired}
Duration: ${(result.durationMs / 1000).toFixed(2)}s

Request ID: ${context.awsRequestId}`
      );
    } else {
      await sendNotification(
        env,
        'Weekly Sync Completed with Errors',
        `EPD International Data Sync completed with errors.

Processed: ${result.epdsProcessed} EPDs
Inserted: ${result.epdsInserted}
Updated: ${result.epdsUpdated}
Marked Expired: ${result.epdsExpired}
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
        message: result.success ? 'EPD sync completed successfully' : 'EPD sync completed with errors',
        ...result,
      }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('EPD Sync failed:', error);

    await sendNotification(
      env,
      'Weekly Sync Failed',
      `EPD International Data Sync failed.

Error: ${errorMessage}
${errorStack ? `\nStack:\n${errorStack}` : ''}

Request ID: ${context.awsRequestId}`,
      true
    );

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'EPD sync failed',
        error: errorMessage,
      }),
    };
  }
};
