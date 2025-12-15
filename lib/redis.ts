/**
 * Mock Redis Client for GreenChainz
 * 
 * In-memory replacement for Redis to support agent caching
 * until a real Redis instance (like Upstash) is configured.
 */

class MockRedis {
  private cache = new Map<string, { value: unknown; expiry: number }>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    // Default TTL 24 hours if not specified
    const ttlSeconds = options?.ex || 86400;
    const expiry = Date.now() + (ttlSeconds * 1000);
    
    this.cache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

export const redis = new MockRedis();
