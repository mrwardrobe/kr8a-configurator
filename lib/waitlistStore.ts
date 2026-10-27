import { Redis } from '@upstash/redis';
import { randomUUID } from 'node:crypto';

export interface WaitlistStore {
  limit(key: string, maximum: number, seconds: number): Promise<boolean>;
  lock(key: string): Promise<string | null>;
  unlock(key: string, owner: string): Promise<void>;
  withdrawn(key: string): Promise<boolean>;
  withdraw(key: string): Promise<void>;
}

export function createWaitlistStore(): WaitlistStore {
  const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN!, retry: { retries: 0 }, signal: () => AbortSignal.timeout(8000), enableTelemetry: false });
  const namespace = `kr8a:${process.env.VERCEL_ENV === 'production' ? 'production' : 'test'}:`;
  return {
    async limit(key, maximum, seconds) {
      const count = await redis.eval("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n", [namespace + key], [seconds]);
      if (typeof count !== 'number' || !Number.isFinite(count)) throw new Error('Invalid rate-limit response');
      return count <= maximum;
    },
    async lock(key) { const owner = randomUUID(); return await redis.set(namespace + key, owner, { nx: true, ex: 60 }) === 'OK' ? owner : null; },
    async unlock(key, owner) { await redis.eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) end; return 0", [namespace + key], [owner]); },
    async withdrawn(key) { return Boolean(await redis.exists(namespace + 'withdrawn:' + key)); },
    async withdraw(key) { await redis.set(namespace + 'withdrawn:' + key, 1, { ex: 48 * 60 * 60 }); },
  };
}
