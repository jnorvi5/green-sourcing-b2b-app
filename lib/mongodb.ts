/**
 * MongoDB Native Driver Connection
 * Optimized for serverless environments
 */
import { MongoClient, Db } from 'mongodb';

interface MongoClientCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoClientCache: MongoClientCache | undefined;
}

let cached: MongoClientCache = global.mongoClientCache ?? { client: null, promise: null };

if (!global.mongoClientCache) {
  global.mongoClientCache = cached;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }
  return uri;
}

async function getMongoClient(): Promise<MongoClient> {
  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = MongoClient.connect(getMongoUri(), opts).then((client) => {
      console.log('✅ MongoDB connected successfully');
      return client;
    });
  }

  try {
    cached.client = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection failed:', e);
    throw e;
  }

  return cached.client;
}

/**
 * Get MongoDB database instance
 */
export async function connectMongoDB(): Promise<Db> {
  const client = await getMongoClient();
  return client.db('greenchainz');
}

export default connectMongoDB;

