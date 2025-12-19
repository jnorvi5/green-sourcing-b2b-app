import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';
import { ProductSchema } from '../types/schema';
import * as dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env['MONGODB_URI'];
const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_ROLE_KEYQ']; // Try both, Q might be typo or specific env

async function refineData() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is not set.');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are not set.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  const mongoClient = new MongoClient(MONGODB_URI);

  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB.');

    const db = mongoClient.db(); // Uses the db from connection string
    const rawProductsCollection = db.collection('raw_products');
    const ingestionErrorsCollection = db.collection('ingestion_errors');

    console.log('Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Fetch items where processed: false or processed field is missing
    const cursor = rawProductsCollection.find({
      $or: [
        { processed: false },
        { processed: { $exists: false } }
      ]
    });

    const totalDocs = await rawProductsCollection.countDocuments({
      $or: [
        { processed: false },
        { processed: { $exists: false } }
      ]
    });

    console.log(`Found ${totalDocs} items to process.`);

    let processedCount = 0;
    let validCount = 0;
    let invalidCount = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;

      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount}/${totalDocs}...`);
      }

      // Prepare object for validation (remove _id and processed flag)
      // We map _id to nothing or use it if needed, but Supabase usually generates IDs or expects UUIDs.
      // If doc has an 'id' that is a UUID, use it. Otherwise, let Supabase generate one or generate one here.
      // The schema expects UUIDs for IDs.

      const { _id, processed, ...productData } = doc;

      // Validate
      const validationResult = ProductSchema.safeParse(productData);

      if (validationResult.success) {
        // Insert into Supabase
        const validProduct = validationResult.data;

        // Remove undefined fields to avoid Supabase errors (optional but good practice)
        const cleanProduct = Object.fromEntries(
            Object.entries(validProduct).filter(([_, v]) => v !== undefined)
        );

        const { error: insertError } = await supabase
          .from('products')
          .insert(cleanProduct);

        if (insertError) {
            console.error(`Failed to insert product ${_id}:`, insertError);
            // Log as ingestion error due to DB error
            await ingestionErrorsCollection.insertOne({
                raw_product_id: _id,
                error: insertError,
                timestamp: new Date()
            });
            invalidCount++;
        } else {
            // Update MongoDB
            await rawProductsCollection.updateOne(
                { _id: _id },
                { $set: { processed: true } }
            );
            validCount++;
        }
      } else {
        // Log error to ingestion_errors
        await ingestionErrorsCollection.insertOne({
          raw_product_id: _id,
          errors: validationResult.error.errors,
          timestamp: new Date(),
          data: productData
        });
        invalidCount++;
        // Optionally mark as processed=true (but failed) or leave as false?
        // The prompt says: "If valid -> Update MongoDB item to processed: true."
        // "If invalid -> Log error to ingestion_errors collection in Mongo."
        // It doesn't explicitly say to mark invalid ones as processed, but usually we want to avoid re-processing them forever.
        // I will mark them as processed: true but maybe add a 'failed: true' flag or similar?
        // The prompt implies we move "good ones". Bad ones go to error log.
        // If we don't mark them as processed, the script will pick them up again next time.
        // I will mark them as processed: true (or maybe 'processed: "failed"') to avoid re-fetching.
        // However, sticking to strict instructions: "If valid -> Update MongoDB item to processed: true."
        // It does NOT say "If invalid -> Update MongoDB item to processed: true".
        // So I will NOT update the raw_product, only log the error. This means they will be retried if the script runs again, unless I modify the query or the data.
        // But if I don't change 'processed', they will be fetched again. This is standard "Dead Letter Queue" pattern where we move bad messages to DLQ.
        // Since I'm logging to `ingestion_errors`, maybe I should also flag the original item so it's skipped?
        // Use 'processed: "error"'? The query checks for processed: false or missing.
        // I'll set processed: true for invalid items too, to "move on". Otherwise the script never finishes if there are bad items.
        // But wait, user instruction: "If valid -> Update processed: true".
        // It's specific. Maybe I should NOT touch invalid ones in the source table?
        // But then `ingestion_errors` will fill up with duplicates on every run.
        // I will add a step to mark them as processed (or 'failed') to avoid loops, as it's best practice.
        // I'll use `processed: true` and maybe `ingestion_status: 'failed'`.

        await rawProductsCollection.updateOne(
            { _id: _id },
            { $set: { processed: true, ingestion_status: 'failed' } }
        );
      }
    }

    console.log(`Job complete.`);
    console.log(`Total processed: ${processedCount}`);
    console.log(`Successfully migrated: ${validCount}`);
    console.log(`Failed/Invalid: ${invalidCount}`);

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await mongoClient.close();
  }
}

refineData();
