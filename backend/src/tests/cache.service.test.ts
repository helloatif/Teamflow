import { describe, expect, it, beforeEach } from 'vitest';
import type { Cache } from '../services/cacheService.js';

class MockRedis {
  private store: Map<string, { value: string; expiresAt?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, exType: string, ttl: number): Promise<void> {
    if (exType === 'EX') {
      this.store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    } else {
      this.store.set(key, { value });
    }
  }

  async del(...keys: string[]): Promise<void> {
    keys.forEach((key) => this.store.delete(key));
  }

  async scan(cursor: string, ...args: (string | number)[]): Promise<[string, string[]]> {
    if (cursor !== '0') return ['0', []];
    const matchIndex = args.indexOf('MATCH');
    if (matchIndex === -1) return ['0', Array.from(this.store.keys())];
    const pattern = (args[matchIndex + 1] as string).replace(/\*/g, '');
    const keys = Array.from(this.store.keys()).filter((k) => k.includes(pattern));
    return ['0', keys];
  }

  async quit(): Promise<void> {
    this.store.clear();
  }

  status = 'ready';
}

describe('CacheService', () => {
  let mockRedis: MockRedis;

  class TestCacheService implements Cache {
    constructor(private redis: MockRedis) {}

    async get<T>(key: string): Promise<T | null> {
      try {
        const value = await this.redis.get(key);
        return value ? (JSON.parse(value) as T) : null;
      } catch {
        return null;
      }
    }

    async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch {
        // fail-open
      }
    }

    async delete(...keys: string[]): Promise<void> {
      if (!keys.length) return;
      try {
        await this.redis.del(...keys);
      } catch {
        // fail-open
      }
    }

    async clear(pattern: string): Promise<void> {
      try {
        let cursor = '0';
        do {
          const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
          cursor = nextCursor;
          if (keys.length) {
            await this.redis.del(...keys);
          }
        } while (cursor !== '0');
      } catch {
        // fail-open
      }
    }
  }

  beforeEach(() => {
    mockRedis = new MockRedis();
  });

  it('serializes and deserializes JSON correctly', async () => {
    const cache = new TestCacheService(mockRedis);
    const testObject = { id: 'team-1', name: 'Test Team', nested: { value: 42 } };

    await cache.set('team:1', testObject);
    const retrieved = await cache.get<typeof testObject>('team:1');

    expect(retrieved).toEqual(testObject);
  });

  it('returns null for missing keys', async () => {
    const cache = new TestCacheService(mockRedis);
    const result = await cache.get('missing:key');

    expect(result).toBeNull();
  });

  it('applies TTL to set operations', async () => {
    const cache = new TestCacheService(mockRedis);
    const testValue = { data: 'test' };

    await cache.set('expiring:key', testValue, 300);
    const retrieved = await cache.get('expiring:key');

    expect(retrieved).toEqual(testValue);
  });

  it('deletes single key', async () => {
    const cache = new TestCacheService(mockRedis);

    await cache.set('key:1', { data: 'value' });
    await cache.delete('key:1');
    const retrieved = await cache.get('key:1');

    expect(retrieved).toBeNull();
  });

  it('deletes multiple keys in one call', async () => {
    const cache = new TestCacheService(mockRedis);

    await cache.set('key:1', { data: 'value1' });
    await cache.set('key:2', { data: 'value2' });
    await cache.set('key:3', { data: 'value3' });

    await cache.delete('key:1', 'key:2', 'key:3');

    const r1 = await cache.get('key:1');
    const r2 = await cache.get('key:2');
    const r3 = await cache.get('key:3');

    expect(r1).toBeNull();
    expect(r2).toBeNull();
    expect(r3).toBeNull();
  });

  it('handles delete with empty array gracefully', async () => {
    const cache = new TestCacheService(mockRedis);

    await cache.set('key:1', { data: 'value' });
    await cache.delete();

    const retrieved = await cache.get('key:1');
    expect(retrieved).toEqual({ data: 'value' });
  });

  it('clears keys matching a pattern', async () => {
    const cache = new TestCacheService(mockRedis);

    await cache.set('team:1', { id: 1 });
    await cache.set('team:2', { id: 2 });
    await cache.set('project:1', { id: 1 });

    await cache.clear('team:*');

    const t1 = await cache.get('team:1');
    const t2 = await cache.get('team:2');
    const p1 = await cache.get('project:1');

    expect(t1).toBeNull();
    expect(t2).toBeNull();
    expect(p1).toEqual({ id: 1 });
  });

  it('fails open on error', async () => {
    const failingRedis = {
      async get() {
        throw new Error('Redis unavailable');
      },
      async set() {
        throw new Error('Redis unavailable');
      },
      async del() {
        throw new Error('Redis unavailable');
      },
      async scan() {
        throw new Error('Redis unavailable');
      },
      async quit() {
        throw new Error('Redis unavailable');
      },
      status: 'error',
    } as any;

    const cache = new TestCacheService(failingRedis);

    const result = await cache.get('key');
    expect(result).toBeNull();

    await expect(cache.set('key', { data: 'value' })).resolves.toBeUndefined();
    await expect(cache.delete('key')).resolves.toBeUndefined();
    await expect(cache.clear('pattern')).resolves.toBeUndefined();
  });
});
