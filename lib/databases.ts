/**
 * Multi-Database Connection Manager
 * 
 * Manages connections to multiple MongoDB databases:
 * - greenchainz (main): Products, RFQs, Orders
 * - buyers: Buyer profiles, projects, saved materials
 * - suppliers: Supplier profiles, inventory, pricing
 * - analytics: KPIs, metrics, reports, events
 * - dataproviders: EC3, Autodesk cache, carbon data
 * 
 * Architecture:
 * - Same cluster with multiple databases for logical separation
 * - Can be split across clusters as needed for scaling
 */
import mongoose, { Connection } from 'mongoose';

// Database URIs from environment variables
const getDefaultUri = (dbName: string): string => {
  const baseUri = process.env.MONGODB_URI || 'mongodb+srv://ADMIN:RnUH4PqyIfiComGB@cluster0.q9gvyyg.mongodb.net/greenchainz?retryWrites=true&w=majority';
  return baseUri.replace('/greenchainz', `/${dbName}`);
};

const DATABASE_URIS: Record<string, string> = {
  greenchainz: process.env.MONGODB_URI || 'mongodb+srv://ADMIN:RnUH4PqyIfiComGB@cluster0.q9gvyyg.mongodb.net/greenchainz?retryWrites=true&w=majority',
  buyers: process.env.MONGODB_BUYERS_URI || getDefaultUri('buyers'),
  suppliers: process.env.MONGODB_SUPPLIERS_URI || getDefaultUri('suppliers'),
  analytics: process.env.MONGODB_ANALYTICS_URI || getDefaultUri('analytics'),
  dataproviders: process.env.MONGODB_DATAPROVIDERS_URI || getDefaultUri('dataproviders'),
};

// Database names
export const DB_NAMES = {
  MAIN: 'greenchainz',
  BUYERS: 'buyers',
  SUPPLIERS: 'suppliers',
  ANALYTICS: 'analytics',
  DATA_PROVIDERS: 'dataproviders',
} as const;

// Connection cache
interface ConnectionCache {
  [key: string]: {
    conn: Connection | null;
    promise: Promise<Connection> | null;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var dbConnections: ConnectionCache | undefined;
}

const connections: ConnectionCache = global.dbConnections || {};
if (!global.dbConnections) {
  global.dbConnections = connections;
}

/**
 * Get a connection to a specific database
 */
export async function getDatabase(dbName: string): Promise<Connection> {
  const cacheKey = dbName;

  if (!connections[cacheKey]) {
    connections[cacheKey] = { conn: null, promise: null };
  }

  const cached = connections[cacheKey];

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = DATABASE_URIS[dbName] || DATABASE_URIS.greenchainz;

    if (!uri) {
      throw new Error(`No connection URI configured for database: ${dbName}`);
    }

    cached.promise = mongoose.createConnection(uri, {
      bufferCommands: false,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).asPromise().then((conn) => {
      console.log(`✅ Connected to database: ${dbName}`);
      return conn;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Convenience functions for each database
export const getMainDB = () => getDatabase(DB_NAMES.MAIN);
export const getBuyersDB = () => getDatabase(DB_NAMES.BUYERS);
export const getSuppliersDB = () => getDatabase(DB_NAMES.SUPPLIERS);
export const getAnalyticsDB = () => getDatabase(DB_NAMES.ANALYTICS);
export const getDataProvidersDB = () => getDatabase(DB_NAMES.DATA_PROVIDERS);

/**
 * Connect to all databases at once
 */
export async function connectAllDatabases(): Promise<void> {
  await Promise.all([
    getMainDB(),
    getBuyersDB(),
    getSuppliersDB(),
    getAnalyticsDB(),
    getDataProvidersDB(),
  ]);
  console.log('✅ All databases connected');
}

/**
 * Get database health status
 */
export async function getDatabaseHealth(): Promise<Record<string, { status: string; latency?: number }>> {
  const health: Record<string, { status: string; latency?: number }> = {};
  
  for (const dbName of Object.values(DB_NAMES)) {
    const start = Date.now();
    try {
      const conn = await getDatabase(dbName);
      await conn.db?.admin().ping();
      health[dbName] = {
        status: 'connected',
        latency: Date.now() - start,
      };
    } catch (error) {
      health[dbName] = {
        status: 'disconnected',
      };
    }
  }
  
  return health;
}

/**
 * Close all database connections
 */
export async function closeAllConnections(): Promise<void> {
  const closePromises = Object.values(connections).map(async (cached) => {
    if (cached.conn) {
      await cached.conn.close();
      cached.conn = null;
      cached.promise = null;
    }
  });
  await Promise.all(closePromises);
  console.log('✅ All database connections closed');
}

export default {
  getDatabase,
  getMainDB,
  getBuyersDB,
  getSuppliersDB,
  getAnalyticsDB,
  getDataProvidersDB,
  connectAllDatabases,
  getDatabaseHealth,
  closeAllConnections,
};
