import { Queue } from 'bullmq';
import { redisHost, redisPort } from '../config/redis.js';

const connection = {
  host: redisHost,
  port: redisPort,
};

export const imageQueue = new Queue('image-processing-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const videoQueue = new Queue('video-processing-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

console.log('[BullMQ Queues] Initialized image-processing-queue and video-processing-queue');
