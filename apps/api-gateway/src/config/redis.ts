import { Redis } from 'ioredis';

export const redisHost = process.env.REDIS_HOST || 'localhost';
export const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisConnection = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    // Retry connection gracefully every 5 seconds
    return Math.min(times * 500, 5000);
  },
});

redisConnection.on('connect', () => {
  console.log('[Redis] Successfully connected to Redis server');
});

redisConnection.on('error', (err) => {
  console.warn('[Redis Warning] Unable to connect to Redis on port 6379. Make sure Redis is running for BullMQ background queues.');
});
