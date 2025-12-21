const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const EC3_API_BASE = 'https://buildingtransparency.org/api';
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'greenchainz_lake';
const COLLECTION_NAME = 'raw_ingest';

const EC3_CLIENT_ID = process.env.EC3_CLIENT_ID;
const EC3_CLIENT_SECRET = process.env.EC3_CLIENT_SECRET;

async function getAccessToken() {
    if (!EC3_CLIENT_ID || !EC3_CLIENT_SECRET) {
        throw new Error('EC3_CLIENT_ID and EC3_CLIENT_SECRET must be set in environment variables.');
    }

    try {
        const tokenString = Buffer.from(`${EC3_CLIENT_ID}:${EC3_CLIENT_SECRET}`).toString('base64');
        const response = await axios.post(`${EC3_API_BASE}/oauth2/token`,
            'grant_type=client_credentials&scope=read',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${tokenString}`
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function searchConcreteProducts(token, client) {
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    console.log('Starting search for Concrete products in USA with GWP < 300...');

    while (hasMore) {
        try {
            const params = {
                page_number: page,
                page_size: pageSize,
                category: 'Concrete',
                jurisdiction: 'USA',
            };

            const response = await axios.get(`${EC3_API_BASE}/materials`, {
                headers: { 'Authorization': `Bearer ${token}` },
                params: params
            });

            const products = response.data.results || response.data;

            if (!Array.isArray(products) || products.length === 0) {
                hasMore = false;
                break;
            }

            const filteredProducts = products.filter(p => {
                // Check GWP
                // We trust the API to return 'Concrete' and 'USA' jurisdiction products
                // based on the query parameters. We only filter for GWP here.
                const gwpValue = p.gwp ? (typeof p.gwp === 'object' ? p.gwp.value : p.gwp) : null;
                const isLowGWP = gwpValue !== null && gwpValue < 300;

                return isLowGWP;
            });

            console.log(`Page ${page}: Found ${products.length} products, ${filteredProducts.length} match criteria.`);

            if (filteredProducts.length > 0) {
                await ingestToMongo(client, filteredProducts);
            }

            if (products.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }

        } catch (error) {
            console.error(`Error on page ${page}:`, error.response ? error.response.data : error.message);
            hasMore = false;
        }
    }

    console.log('Search complete.');
}

async function ingestToMongo(client, products) {
    try {
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Add metadata
        const docs = products.map(p => ({
            ...p,
            _ingested_at: new Date(),
            _source: 'EC3_API_SCRIPT'
        }));

        const result = await collection.insertMany(docs);
        console.log(`Ingested ${result.insertedCount} documents into MongoDB.`);
    } catch (error) {
        console.error('Error ingesting to MongoDB:', error);
    }
}

async function main() {
    if (!MONGODB_URI) {
        console.error('MONGODB_URI must be set in environment variables.');
        return;
    }

    const client = new MongoClient(MONGODB_URI);

    try {
        console.log('Connecting to EC3...');
        const token = await getAccessToken();
        console.log('Authenticated. Token obtained.');

        await client.connect();
        console.log('Connected to MongoDB.');

        await searchConcreteProducts(token, client);

    } catch (error) {
        console.error('Script failed:', error.message);
        if (error.message.includes('EC3_CLIENT_ID')) {
             console.log('\nPlease set EC3_CLIENT_ID and EC3_CLIENT_SECRET in your environment.');
        }
    } finally {
        await client.close();
        console.log('MongoDB connection closed.');
    }
}

main();
