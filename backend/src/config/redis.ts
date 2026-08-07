import { Redis } from 'ioredis';
import env from './env.js';
import logger from './logger.js';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: (attempt: number) => Math.min(attempt * 100, 2000),
});

redis.on('ready', () => {
  logger.info('Redis connected');
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting');
});

redis.on('error', (error: Error) => {
  logger.error({ err: error }, 'Redis connection failed');
});

export const connectRedis = async (): Promise<void> => {
  if (redis.status === 'wait') {
    await redis.connect();
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redis.status !== 'end') {
    await redis.quit();
  }
};
