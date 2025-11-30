/**
 * Redis Cache Service
 * 
 * Provides:
 * - Connection pooling with automatic reconnection
 * - Session storage
 * - General purpose caching
 * - Rate limit storage
 * - Pub/Sub for real-time features
 */

const Redis = require('ioredis');
const { logger } = require('../middleware/logger');

// ==========================================
// REDIS CLIENT SETUP
// ==========================================

let redis = null;
let subscriber = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
const initRedis = () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    const options = {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        showFriendlyErrorStack: process.env.NODE_ENV !== 'production',
        lazyConnect: true,
        // Reconnect strategy
        retryStrategy: (times) => {
            if (times > 10) {
                logger.error('Redis: Max reconnection attempts reached');
                return null; // Stop retrying
            }
            const delay = Math.min(times * 100, 3000);
            logger.warn(`Redis: Reconnecting in ${delay}ms (attempt ${times})`);
            return delay;
        }
    };

    try {
        redis = new Redis(redisUrl, options);

        redis.on('connect', () => {
            logger.info('Redis: Connected');
            isConnected = true;
        });

        redis.on('ready', () => {
            logger.info('Redis: Ready to accept commands');
        });

        redis.on('error', (err) => {
            logger.error('Redis error:', { error: err.message });
            isConnected = false;
        });

        redis.on('close', () => {
            logger.warn('Redis: Connection closed');
            isConnected = false;
        });

        redis.on('reconnecting', () => {
            logger.info('Redis: Reconnecting...');
        });

        return redis;
    } catch (err) {
        logger.error('Redis: Failed to initialize', { error: err.message });
        return null;
    }
};

/**
 * Get Redis client (lazy initialization)
 */
const getRedis = () => {
    if (!redis) {
        initRedis();
    }
    return redis;
};

/**
 * Check if Redis is available
 */
const isRedisAvailable = () => isConnected;

// ==========================================
// CACHING OPERATIONS
// ==========================================

/**
 * Set a cached value with optional TTL
 */
const setCache = async (key, value, ttlSeconds = 3600) => {
    try {
        if (!isConnected) return false;

        const serialized = JSON.stringify(value);
        if (ttlSeconds) {
            await redis.setex(`cache:${key}`, ttlSeconds, serialized);
        } else {
            await redis.set(`cache:${key}`, serialized);
        }
        return true;
    } catch (err) {
        logger.error('Redis setCache error:', { key, error: err.message });
        return false;
    }
};

/**
 * Get a cached value
 */
const getCache = async (key) => {
    try {
        if (!isConnected) return null;

        const value = await redis.get(`cache:${key}`);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        logger.error('Redis getCache error:', { key, error: err.message });
        return null;
    }
};

/**
 * Delete a cached value
 */
const deleteCache = async (key) => {
    try {
        if (!isConnected) return false;

        await redis.del(`cache:${key}`);
        return true;
    } catch (err) {
        logger.error('Redis deleteCache error:', { key, error: err.message });
        return false;
    }
};

/**
 * Delete all keys matching a pattern
 */
const deleteCachePattern = async (pattern) => {
    try {
        if (!isConnected) return false;

        const keys = await redis.keys(`cache:${pattern}`);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        return true;
    } catch (err) {
        logger.error('Redis deleteCachePattern error:', { pattern, error: err.message });
        return false;
    }
};

/**
 * Cache-aside pattern: get from cache or fetch and cache
 */
const cacheAside = async (key, fetchFn, ttlSeconds = 3600) => {
    // Try cache first
    const cached = await getCache(key);
    if (cached !== null) {
        return { data: cached, fromCache: true };
    }

    // Fetch fresh data
    const fresh = await fetchFn();

    // Cache it
    await setCache(key, fresh, ttlSeconds);

    return { data: fresh, fromCache: false };
};

// ==========================================
// SESSION OPERATIONS
// ==========================================

/**
 * Store session data
 */
const setSession = async (sessionId, data, ttlSeconds = 86400) => {
    try {
        if (!isConnected) return false;

        await redis.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
        return true;
    } catch (err) {
        logger.error('Redis setSession error:', { error: err.message });
        return false;
    }
};

/**
 * Get session data
 */
const getSession = async (sessionId) => {
    try {
        if (!isConnected) return null;

        const data = await redis.get(`session:${sessionId}`);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        logger.error('Redis getSession error:', { error: err.message });
        return null;
    }
};

/**
 * Delete session
 */
const deleteSession = async (sessionId) => {
    try {
        if (!isConnected) return false;

        await redis.del(`session:${sessionId}`);
        return true;
    } catch (err) {
        logger.error('Redis deleteSession error:', { error: err.message });
        return false;
    }
};

// ==========================================
// RATE LIMITING SUPPORT
// ==========================================

/**
 * Increment rate limit counter
 * Returns: { count, ttl }
 */
const incrementRateLimit = async (key, windowSeconds = 60) => {
    try {
        if (!isConnected) return { count: 0, ttl: windowSeconds };

        const fullKey = `ratelimit:${key}`;
        const multi = redis.multi();
        multi.incr(fullKey);
        multi.ttl(fullKey);

        const results = await multi.exec();
        const count = results[0][1];
        let ttl = results[1][1];

        // Set expiry if new key
        if (ttl === -1) {
            await redis.expire(fullKey, windowSeconds);
            ttl = windowSeconds;
        }

        return { count, ttl };
    } catch (err) {
        logger.error('Redis incrementRateLimit error:', { error: err.message });
        return { count: 0, ttl: windowSeconds };
    }
};

/**
 * Check rate limit (without incrementing)
 */
const checkRateLimit = async (key) => {
    try {
        if (!isConnected) return { count: 0, ttl: 0 };

        const fullKey = `ratelimit:${key}`;
        const [count, ttl] = await Promise.all([
            redis.get(fullKey),
            redis.ttl(fullKey)
        ]);

        return {
            count: parseInt(count) || 0,
            ttl: ttl > 0 ? ttl : 0
        };
    } catch (err) {
        logger.error('Redis checkRateLimit error:', { error: err.message });
        return { count: 0, ttl: 0 };
    }
};

// ==========================================
// PUB/SUB
// ==========================================

/**
 * Publish a message to a channel
 */
const publish = async (channel, message) => {
    try {
        if (!isConnected) return false;

        await redis.publish(channel, JSON.stringify(message));
        return true;
    } catch (err) {
        logger.error('Redis publish error:', { channel, error: err.message });
        return false;
    }
};

/**
 * Subscribe to a channel
 */
const subscribe = async (channel, callback) => {
    try {
        if (!subscriber) {
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            subscriber = new Redis(redisUrl);
        }

        await subscriber.subscribe(channel);
        subscriber.on('message', (ch, message) => {
            if (ch === channel) {
                try {
                    callback(JSON.parse(message));
                } catch {
                    callback(message);
                }
            }
        });

        return true;
    } catch (err) {
        logger.error('Redis subscribe error:', { channel, error: err.message });
        return false;
    }
};

// ==========================================
// HEALTH CHECK
// ==========================================

/**
 * Check Redis health
 */
const healthCheck = async () => {
    try {
        if (!redis) return { status: 'disconnected', latency: null };

        const start = Date.now();
        await redis.ping();
        const latency = Date.now() - start;

        return {
            status: 'healthy',
            latency: `${latency}ms`,
            connected: isConnected
        };
    } catch (err) {
        return {
            status: 'unhealthy',
            error: err.message,
            connected: false
        };
    }
};

// ==========================================
// CLEANUP
// ==========================================

/**
 * Close Redis connections
 */
const closeRedis = async () => {
    try {
        if (redis) {
            await redis.quit();
            redis = null;
        }
        if (subscriber) {
            await subscriber.quit();
            subscriber = null;
        }
        isConnected = false;
        logger.info('Redis: Connections closed');
    } catch (err) {
        logger.error('Redis close error:', { error: err.message });
    }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    // Connection
    initRedis,
    getRedis,
    isRedisAvailable,
    closeRedis,

    // Caching
    setCache,
    getCache,
    deleteCache,
    deleteCachePattern,
    cacheAside,

    // Sessions
    setSession,
    getSession,
    deleteSession,

    // Rate limiting
    incrementRateLimit,
    checkRateLimit,

    // Pub/Sub
    publish,
    subscribe,

    // Health
    healthCheck
};
