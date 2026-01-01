import Redis from 'ioredis';

/**
 * GreenChainz Redis Client
 *
 * Supports both Azure Cache for Redis and Upstash (via TCP).
 * Falls back to in-memory MockRedis if REDIS_URL is not provided.
 */

// Define the shape of our Redis interface to ensure consistency
interface IRedisClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
}

class RedisWrapper implements IRedisClient {
  private client: Redis;

  constructor(connectionString: string) {
    console.log('Initializing Redis client...');
    // Enable TLS if the URL starts with rediss://
    // ioredis handles 'rediss://' protocol automatically for TLS
    this.client = new Redis(connectionString, {
      // Retry strategy: exponential backoff
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Azure Redis requires TLS usually. If connection string is rediss://, ioredis handles it.
      // If we need specific TLS options (like for self-signed certs), we can add them here.
      // But for standard Azure/Upstash, standard 'rediss://' string is sufficient.
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Error getting key from Redis', { key, error });
      return null;
    }
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      if (options?.ex) {
        await this.client.set(key, stringValue, 'EX', options.ex);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      console.error('Error setting key in Redis', { key, error });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting key from Redis', { key, error });
    }
  }
}

class MockRedis implements IRedisClient {
  // Store values as serialized strings to mimic real Redis behavior
  // This ensures tests catch issues with non-serializable data or type coercion (e.g. Dates becoming strings)
  private cache = new Map<string, { value: string; expiry: number }>();

  constructor() {
    console.log('Initializing Mock Redis (In-Memory)...');
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    try {
      return JSON.parse(item.value) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    // Default TTL 24 hours if not specified
    const ttlSeconds = options?.ex || 86400;
    const expiry = Date.now() + (ttlSeconds * 1000);

    // Serialize to ensure behavior matches production Redis
    const stringValue = JSON.stringify(value);

    this.cache.set(key, { value: stringValue, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

// Factory to create the appropriate client
const createRedisClient = (): IRedisClient => {
  if (process.env['REDIS_URL']) {
    return new RedisWrapper(process.env['REDIS_URL']);
  } else {
    // Warn only in production if Redis is missing
    if (process.env['NODE_ENV'] === 'production') {
      console.warn('WARNING: REDIS_URL not set in production. Using in-memory MockRedis. Data will be lost on restart.');
    }
    return new MockRedis();
  }
};

export const redis = createRedisClient();
