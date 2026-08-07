import { redis } from '../config/redis.js';
import logger from '../config/logger.js';

const DEFAULT_TTL_SECONDS = 300;

export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(...keys: string[]): Promise<void>;
  clear(pattern: string): Promise<void>;
}

export class CacheService implements Cache {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache read failed');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      logger.warn({ err: error, key }, 'Cache write failed');
    }
  }

  async delete(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
      await redis.del(...keys);
    } catch (error) {
      logger.warn({ err: error, keys }, 'Cache deletion failed');
    }
  }

  async clear(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      logger.warn({ err: error, pattern }, 'Cache clear failed');
    }
  }
}

export const cacheService = new CacheService();
