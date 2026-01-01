/**
 * Azure Redis Cache Service
 * High-performance caching layer using Azure Cache for Redis
 * 
 * Resource: greenchainz (East US 2)
 * Tier: Standard/Premium
 */

const Redis = require('ioredis');
const { azureConfig } = require('../config/azure');

class AzureRedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = azureConfig.redis;
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (!this.config.enabled) {
      console.log('[Redis] Redis caching is disabled');
      return null;
    }

    if (this.isConnected) {
      return this.client;
    }

    try {
      const redisOptions = {
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        tls: this.config.tls ? { 
          servername: this.config.host 
        } : undefined,
        connectTimeout: this.config.connectionTimeout,
        enableOfflineQueue: this.config.enableOfflineQueue,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError(err) {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        }
      };

      this.client = new Redis(redisOptions);

      this.client.on('connect', () => {
        console.log('[Redis] Connected to Azure Redis Cache');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('[Redis] Connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.client.ping();
      console.log('[Redis] Connection verified');

      return this.client;
    } catch (error) {
      console.error('[Redis] Failed to connect:', error.message);
      this.isConnected = false;
      return null;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.isConnected) return null;
    
    try {
      const fullKey = `${this.config.keyPrefix}${key}`;
      const value = await this.client.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`[Redis] Error getting key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set(key, value, ttl = 3600) {
    if (!this.isConnected) return false;
    
    try {
      const fullKey = `${this.config.keyPrefix}${key}`;
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setex(fullKey, ttl, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }
      
      return true;
    } catch (error) {
      console.error(`[Redis] Error setting key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    if (!this.isConnected) return false;
    
    try {
      const fullKey = `${this.config.keyPrefix}${key}`;
      await this.client.del(fullKey);
      return true;
    } catch (error) {
      console.error(`[Redis] Error deleting key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.isConnected) return false;
    
    try {
      const fullKey = `${this.config.keyPrefix}${key}`;
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error(`[Redis] Error checking key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async incr(key, by = 1) {
    if (!this.isConnected) return null;
    
    try {
      const fullKey = `${this.config.keyPrefix}${key}`;
      return await this.client.incrby(fullKey, by);
    } catch (error) {
      console.error(`[Redis] Error incrementing key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set hash field
   */
  async hset(key, field, value) {
    if (!this.isConnected) return false;
    
    try {
      const fullKey = `${this.config.keyPrefix}${key}`;
      const serialized = JSON.stringify(value);
      await this.client.hset(fullKey, field, serialized);
      return true;
    } catch (error) {
      console.error(`[Redis] Error setting hash ${key}:${field}:`, error.message);
      return false;
    }
  }

  /**
   * Get hash field
   */
  async hget(key, field) {
    if (!this.isConnected) return null;
    
    try {
      const fullKey = `${this.config.keyPrefix}${key}`;
      const value = await this.client.hget(fullKey, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`[Redis] Error getting hash ${key}:${field}:`, error.message);
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall(key) {
    if (!this.isConnected) return null;
    
    try {
      const fullKey = `${this.config.keyPrefix}${key}`;
      const hash = await this.client.hgetall(fullKey);
      
      const parsed = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }
      
      return parsed;
    } catch (error) {
      console.error(`[Redis] Error getting hash ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Flush all keys (use with caution!)
   */
  async flushAll() {
    if (!this.isConnected) return false;
    
    try {
      await this.client.flushdb();
      console.log('[Redis] All keys flushed');
      return true;
    } catch (error) {
      console.error('[Redis] Error flushing database:', error.message);
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('[Redis] Disconnected');
    }
  }

  /**
   * Cache wrapper for functions
   */
  async cached(key, ttl, fetchFunction) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }

    // Fetch fresh data
    const fresh = await fetchFunction();
    
    // Store in cache
    await this.set(key, fresh, ttl);
    
    return { data: fresh, fromCache: false };
  }
}

// Export singleton instance
const redisService = new AzureRedisService();

module.exports = {
  redisService,
  AzureRedisService
};
