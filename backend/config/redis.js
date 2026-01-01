const Redis = require('ioredis');

let redisClient = null;

const initRedis = () => {
  if (process.env.REDIS_HOST && process.env.REDIS_KEY) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST, // e.g. greenchainz.redis.cache.windows.net
      port: 6380,
      password: process.env.REDIS_KEY,
      tls: { servername: process.env.REDIS_HOST }
    });

    redisClient.on('connect', () => {
      console.log('✅ Connected to Azure Cache for Redis');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error', err);
    });
  } else {
    console.log('⚠️  REDIS_HOST or REDIS_KEY not found, Redis caching disabled');
  }
};

const getClient = () => redisClient;

module.exports = { initRedis, getClient };
