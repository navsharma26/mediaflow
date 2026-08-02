import { Redis } from 'ioredis';

export const redisHost = process.env.REDIS_HOST || 'localhost';
export const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisConnection = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connected to Redis server');
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Redis Connection Error:', err);
});
