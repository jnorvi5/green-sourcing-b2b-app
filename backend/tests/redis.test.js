/**
 * Redis Cache Service Tests
 */

const redis = require('../services/redis');

describe('Redis Cache Service', () => {

    describe('Module Exports', () => {
        it('should export connection functions', () => {
            expect(typeof redis.initRedis).toBe('function');
            expect(typeof redis.getRedis).toBe('function');
            expect(typeof redis.isRedisAvailable).toBe('function');
            expect(typeof redis.closeRedis).toBe('function');
        });

        it('should export caching functions', () => {
            expect(typeof redis.setCache).toBe('function');
            expect(typeof redis.getCache).toBe('function');
            expect(typeof redis.deleteCache).toBe('function');
            expect(typeof redis.deleteCachePattern).toBe('function');
            expect(typeof redis.cacheAside).toBe('function');
        });

        it('should export session functions', () => {
            expect(typeof redis.setSession).toBe('function');
            expect(typeof redis.getSession).toBe('function');
            expect(typeof redis.deleteSession).toBe('function');
        });

        it('should export rate limiting functions', () => {
            expect(typeof redis.incrementRateLimit).toBe('function');
            expect(typeof redis.checkRateLimit).toBe('function');
        });

        it('should export pub/sub functions', () => {
            expect(typeof redis.publish).toBe('function');
            expect(typeof redis.subscribe).toBe('function');
        });

        it('should export health check', () => {
            expect(typeof redis.healthCheck).toBe('function');
        });
    });

    describe('Fallback Behavior (No Redis)', () => {
        it('should return false from isRedisAvailable when not connected', () => {
            expect(redis.isRedisAvailable()).toBe(false);
        });

        it('should handle setCache gracefully when disconnected', async () => {
            const result = await redis.setCache('test-key', { data: 'test' });
            expect(result).toBe(false);
        });

        it('should handle getCache gracefully when disconnected', async () => {
            const result = await redis.getCache('test-key');
            expect(result).toBeNull();
        });

        it('should handle checkRateLimit gracefully when disconnected', async () => {
            const result = await redis.checkRateLimit('test-ip');
            expect(result).toEqual({ count: 0, ttl: 0 });
        });
    });
});
