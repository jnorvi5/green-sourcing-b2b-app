const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

// Support both DATABASE_URL (Supabase/Heroku style) and individual env vars
let config;
let usingMockPool = false;

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[YOUR-DB-PASSWORD]')) {
    // Use connection string (Supabase, Heroku, etc.)
    config = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : false,
        max: Number(process.env.PGPOOL_MAX || 20),
        min: Number(process.env.PGPOOL_MIN || 2),
        idleTimeoutMillis: Number(process.env.PGPOOL_IDLE || 30000),
        connectionTimeoutMillis: Number(process.env.PGPOOL_CONNECTION_TIMEOUT || 5000),
    };
} else if (process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD && process.env.SUPABASE_DB_PASSWORD !== '[YOUR-DB-PASSWORD]') {
    // Build connection string from Supabase URL
    const supabaseRef = process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;

    config = {
        connectionString: `postgresql://postgres.${supabaseRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
        ssl: { rejectUnauthorized: false },
        max: Number(process.env.PGPOOL_MAX || 10),
        min: Number(process.env.PGPOOL_MIN || 1),
        idleTimeoutMillis: Number(process.env.PGPOOL_IDLE || 30000),
        connectionTimeoutMillis: Number(process.env.PGPOOL_CONNECTION_TIMEOUT || 10000),
    };
    console.log('[DB] Using Supabase PostgreSQL connection');
} else if (process.env.POSTGRES_HOST) {
    // Fallback to individual env vars (local PostgreSQL)
    config = {
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT || 5432),
        user: process.env.POSTGRES_USER || 'user',
        password: process.env.POSTGRES_PASSWORD || 'password',
        database: process.env.POSTGRES_DB || 'greenchainz_dev',
        max: Number(process.env.PGPOOL_MAX || 20),
        min: Number(process.env.PGPOOL_MIN || 2),
        idleTimeoutMillis: Number(process.env.PGPOOL_IDLE || 30000),
        connectionTimeoutMillis: Number(process.env.PGPOOL_CONNECTION_TIMEOUT || 5000),
        statement_timeout: Number(process.env.PGPOOL_STATEMENT_TIMEOUT || 30000)
    };
} else {
    // No PostgreSQL configured - use mock pool
    console.warn('[DB] ⚠️ No PostgreSQL configured - using mock pool (data will not persist)');
    usingMockPool = true;
    config = {
        host: 'localhost',
        port: 5432,
        user: 'mock',
        password: 'mock',
        database: 'mock',
        max: 1,
        min: 0,
        idleTimeoutMillis: 100,
        connectionTimeoutMillis: 100,
    };
}

// Create mock pool that doesn't actually connect
class MockPool {
    constructor() {
        this.totalCount = 0;
        this.idleCount = 0;
        this.waitingCount = 0;
    }

    on() { }

    async query(text, params) {
        console.warn('[DB Mock] Query attempted (no database connected):', text.substring(0, 50));
        return { rows: [], rowCount: 0 };
    }

    async connect() {
        return {
            query: this.query.bind(this),
            release: () => { }
        };
    }

    async end() { }
}

const pool = usingMockPool ? new MockPool() : new Pool(config);

if (!usingMockPool) {
    pool.on('error', (err) => {
        console.error('Unexpected PG client error', err);
    });
}

// Log pool statistics periodically for monitoring (development only)
if (process.env.NODE_ENV !== 'production') {
    setInterval(() => {
        console.log('Pool stats:', {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
        });
    }, 60000); // Log every minute
}

module.exports = { pool, usingMockPool };
