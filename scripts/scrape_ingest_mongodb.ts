import { MongoClient, Collection } from 'mongodb';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import 'dotenv/config';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------
// User can set this in .env or paste it here (not recommended for commit)
const MONGODB_URI = process.env['MONGODB_URI'] || '[PASTE_YOUR_CONNECTION_STRING_HERE]';
const DB_NAME = 'greenchainz_lake';
const COLLECTION_NAME = 'raw_ingest';

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------
interface IngestPayload {
  url: string;
  domain: string;
  timestamp: Date;
  data_type: 'product_page' | 'spec_sheet' | 'epd' | 'image' | 'other';
  payload: any;
}

// ---------------------------------------------------------
// MONGODB CLIENT
// ---------------------------------------------------------
async function getMongoClient(): Promise<MongoClient> {
  if (MONGODB_URI === '[PASTE_YOUR_CONNECTION_STRING_HERE]') {
    console.error('❌ ERROR: Please set MONGODB_URI in .env or paste the connection string in the script.');
    process.exit(1);
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client;
}

// ---------------------------------------------------------
// INGESTION FUNCTION
// ---------------------------------------------------------
async function ingestData(collection: Collection, data: IngestPayload) {
  try {
    // 4. Handle duplicates: Use updateOne({ url: ... }, { $set: ... }, { upsert: true }).
    const result = await collection.updateOne(
      { url: data.url },
      { $set: data },
      { upsert: true }
    );

    console.log(`✅ Ingested ${data.url} | Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedId || 0}`);

  } catch (error) {
    // 5. If you encounter an error, log it to the console and continue.
    console.error(`❌ Error ingesting data for ${data.url}:`, error);
  }
}

// ---------------------------------------------------------
// SCRAPING FUNCTION
// ---------------------------------------------------------
async function scrapeUrl(url: string, collection: Collection) {
  console.log(`🕷️  Scraping ${url}...`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GreenChainz/1.0; +https://greenchainz.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Basic extraction
    $('script, style').remove();

    const domain = new URL(url).hostname;

    // Dump raw JSON as requested
    const payload = {
      title: $('title').text(),
      meta: $('meta').toArray().map(el => $(el).attr()),
      headers: $('h1, h2, h3').toArray().map(el => $(el).text().trim()).filter(t => t),
      text_content: $('body').text().replace(/\s+/g, ' ').trim().substring(0, 50000), // Limit size
      links: $('a').toArray().map(el => ({ text: $(el).text().trim(), href: $(el).attr('href') })).filter(l => l.href),
    };

    const ingestItem: IngestPayload = {
      url: url,
      domain: domain,
      timestamp: new Date(),
      data_type: 'product_page',
      payload: payload
    };

    await ingestData(collection, ingestItem);

  } catch (error) {
    console.error(`❌ Scraping failed for ${url}:`, error);
  }
}

// ---------------------------------------------------------
// MAIN EXECUTION
// ---------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  Single URL: npx ts-node scripts/scrape_ingest_mongodb.ts <url>
  Batch CSV:  npx ts-node scripts/scrape_ingest_mongodb.ts batch <csv-file>
    `);
    process.exit(0);
  }

  let client: MongoClient | undefined;
  try {
    client = await getMongoClient();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    if (args[0] === 'batch') {
      if (!args[1]) {
        console.error('Please provide a CSV file path.');
        process.exit(1);
      }
      const csvPath = args[1];
      if (fs.existsSync(csvPath)) {
        const urls = fs.readFileSync(csvPath, 'utf-8')
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && line.startsWith('http'));

        console.log(`📋 Found ${urls.length} URLs to scrape from ${csvPath}`);

        for (const url of urls) {
          await scrapeUrl(url, collection);
          // Rate limit: 1 sec
          await new Promise(r => setTimeout(r, 1000));
        }
      } else {
        console.error(`File not found: ${csvPath}`);
      }
    } else {
      // Treat as single URL
      const url = args[0];
      if (url.startsWith('http')) {
        await scrapeUrl(url, collection);
      } else {
        console.error('Invalid URL. Must start with http');
      }
    }
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Execute
// Check if this module is being run directly.
// In TS/CommonJS environments, require.main === module is standard.
// In ES modules, we use import.meta.url, but we are running via ts-node which might default to CJS or ESM depending on config.
// The safe way compatible with both often involves checking process.argv[1].

const isMainModule = () => {
    // Check if the current file is the main entry point
    const entryFile = process.argv[1];
    return entryFile && (entryFile.endsWith('scrape_ingest_mongodb.ts') || entryFile === __filename);
};

if (isMainModule()) {
  main().catch(console.error);
}

export { scrapeUrl, ingestData, getMongoClient };
