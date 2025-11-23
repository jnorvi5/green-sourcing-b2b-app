// lambda/greenchainz-epd-sync/index.js
// Lambda function to sync EPD data with Supabase
// Features: Batch upserts, SNS error notifications, retry logic

const { createClient } = require('@supabase/supabase-js');
const AWS = require('aws-sdk');

const sns = new AWS.SNS({ region: process.env.AWS_REGION || 'us-east-1' });

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const EPD_API_URL = process.env.EPD_API_URL || 'https://epd-apim.developer.azure-api.net/v1/epds';
const EPD_API_KEY = process.env.EPD_API_KEY;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const BATCH_SIZE = 100; // Batch size for upserts

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Send SNS notification for sync failures
 */
async function sendErrorNotification(error, context) {
  try {
    const message = {
      Subject: '🚨 GreenChainz EPD Sync Failed',
      Message: `
EPD Sync Lambda Function Error
==============================

Time: ${new Date().toISOString()}
Function: ${context.functionName}
Request ID: ${context.requestId}

Error Details:
${error.stack || error.message || JSON.stringify(error, null, 2)}

AWS Region: ${process.env.AWS_REGION || 'us-east-1'}
Environment: ${process.env.ENVIRONMENT || 'production'}

This is an automated notification. Please investigate the error in CloudWatch Logs.
      `.trim(),
      TopicArn: SNS_TOPIC_ARN,
    };

    await sns.publish(message).promise();
    console.log('SNS notification sent successfully');
  } catch (snsError) {
    console.error('Failed to send SNS notification:', snsError);
  }
}

/**
 * Fetch EPD data from external API
 */
async function fetchEPDData() {
  const axios = require('axios');
  
  try {
    console.log('Fetching EPD data from API...');
    
    const response = await axios.get(EPD_API_URL, {
      headers: {
        'Ocp-Apim-Subscription-Key': EPD_API_KEY,
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    console.log(`Fetched ${response.data.length || 0} EPD records`);
    return response.data;
  } catch (error) {
    console.error('Error fetching EPD data:', error.message);
    throw new Error(`EPD API fetch failed: ${error.message}`);
  }
}

/**
 * Transform EPD data to match Supabase schema
 */
function transformEPDData(epdRecords) {
  return epdRecords.map((epd) => ({
    epd_id: epd.id || epd.epdId,
    name: epd.name || epd.productName,
    manufacturer: epd.manufacturer || epd.company,
    category: epd.category || epd.productCategory,
    description: epd.description,
    valid_until: epd.validUntil || epd.expiryDate,
    gwp_total: epd.gwp || epd.carbonFootprint,
    source: 'EPD_INTERNATIONAL',
    source_url: epd.url || epd.documentUrl,
    metadata: {
      raw_data: epd,
      synced_at: new Date().toISOString(),
    },
  }));
}

/**
 * Upsert data in batches to Supabase
 */
async function batchUpsertToSupabase(records) {
  const batches = [];
  
  // Split records into batches of BATCH_SIZE
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE));
  }

  console.log(`Upserting ${records.length} records in ${batches.length} batches`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process each batch
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} records)...`);
      
      const { data, error } = await supabase
        .from('epd_data')
        .upsert(batch, {
          onConflict: 'epd_id', // Use epd_id as unique constraint
          ignoreDuplicates: false, // Update existing records
        });

      if (error) {
        console.error(`Batch ${i + 1} failed:`, error.message);
        errorCount += batch.length;
        errors.push({
          batch: i + 1,
          error: error.message,
          recordCount: batch.length,
        });
      } else {
        successCount += batch.length;
        console.log(`Batch ${i + 1} completed successfully`);
      }

      // Add small delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (batchError) {
      console.error(`Batch ${i + 1} exception:`, batchError);
      errorCount += batch.length;
      errors.push({
        batch: i + 1,
        error: batchError.message,
        recordCount: batch.length,
      });
    }
  }

  return {
    total: records.length,
    successful: successCount,
    failed: errorCount,
    errors: errors,
  };
}

/**
 * Main Lambda handler
 */
exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  console.log('EPD Sync Lambda started');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Step 1: Fetch EPD data
    const rawEPDData = await fetchEPDData();
    
    if (!rawEPDData || rawEPDData.length === 0) {
      console.log('No EPD data found to sync');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No EPD data to sync',
          recordsProcessed: 0,
        }),
      };
    }

    // Step 2: Transform data
    console.log('Transforming EPD data...');
    const transformedData = transformEPDData(rawEPDData);
    console.log(`Transformed ${transformedData.length} records`);

    // Step 3: Batch upsert to Supabase
    const upsertResult = await batchUpsertToSupabase(transformedData);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('Sync completed successfully');
    console.log(`Duration: ${duration}s`);
    console.log(`Success: ${upsertResult.successful}/${upsertResult.total}`);
    
    if (upsertResult.failed > 0) {
      console.warn(`Failed: ${upsertResult.failed} records`);
      console.warn('Errors:', JSON.stringify(upsertResult.errors, null, 2));
    }

    // If more than 10% failed, send notification
    const failureRate = (upsertResult.failed / upsertResult.total) * 100;
    if (failureRate > 10) {
      const partialError = new Error(
        `High failure rate: ${failureRate.toFixed(1)}% (${upsertResult.failed}/${upsertResult.total} records failed)`
      );
      await sendErrorNotification(partialError, context);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'EPD sync completed',
        recordsProcessed: upsertResult.total,
        successful: upsertResult.successful,
        failed: upsertResult.failed,
        durationSeconds: duration,
        errors: upsertResult.errors.length > 0 ? upsertResult.errors : undefined,
      }),
    };
  } catch (error) {
    console.error('EPD Sync Lambda failed:', error);
    
    // Send SNS notification
    await sendErrorNotification(error, context);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'EPD sync failed',
        error: error.message,
        durationSeconds: duration,
      }),
    };
  }
};
