import { Redis } from '@upstash/redis';
import { createHash } from 'node:crypto';
import type { ConfirmedOrderStore, OrderWorkItem, OrderWriteResult } from './confirmedOrders.ts';

export const INSERT_ORDER_SCRIPT = `
local eventOrder = redis.call('GET', KEYS[2])
if eventOrder and eventOrder ~= KEYS[1] then return 'conflict' end
local existing = redis.call('GET', KEYS[1])
if existing then
  local previous = cjson.decode(existing)
  if previous.fingerprint ~= ARGV[1] then return 'conflict' end
  redis.call('SET', KEYS[2], KEYS[1])
  return 'duplicate'
end
redis.call('SET', KEYS[1], ARGV[2])
redis.call('SET', KEYS[2], KEYS[1])
redis.call('ZADD', KEYS[3], ARGV[3], KEYS[1])
return 'created'`;

export function createConfirmedOrderStore(mode: 'test' | 'live'): ConfirmedOrderStore {
  // Separate credentials from disposable rate-limit storage; no expiry on order snapshots.
  const redis = new Redis({ url: process.env.ORDER_REDIS_REST_URL!, token: process.env.ORDER_REDIS_REST_TOKEN!, retry: { retries: 0 }, signal: () => AbortSignal.timeout(8000), enableTelemetry: false });
  const prefix = `kr8a:confirmed-orders:${mode}:`;
  const hash = (value: string) => createHash('sha256').update(value).digest('hex');
  return {
    async insert(item) {
      if (item.order.mode !== mode) throw new Error('Order environment mismatch.');
      const result = await redis.eval(INSERT_ORDER_SCRIPT,
        [prefix + 'order:' + hash(item.order.orderId), prefix + 'event:' + hash(item.order.eventId), prefix + 'index'],
        [item.fingerprint, JSON.stringify(item), Date.parse(item.receivedAt)]);
      if (!['created', 'duplicate', 'conflict'].includes(String(result))) throw new Error('Invalid storage response.');
      return result as OrderWriteResult;
    },
    async list(limit) {
      const count = Math.min(100, Math.max(1, Math.floor(limit)));
      const keys = await redis.zrange<string[]>(prefix + 'index', 0, count - 1, { rev: true });
      if (!keys.length) return [];
      const rows = await redis.mget<(OrderWorkItem | null)[]>(...keys);
      // A missing queue record is a reconciliation error, not an empty/successful order.
      if (rows.some(row => !row || row.version !== 1 || row.order.mode !== mode)) throw new Error('Order queue needs reconciliation.');
      return rows as OrderWorkItem[];
    },
  };
}
export function orderRuntimeEnvironment() {
  return { environment: process.env.VERCEL_ENV, nodeEnvironment: process.env.NODE_ENV, enabled: process.env.ORDER_INTAKE_ENABLED,
    launchApproved: process.env.ORDER_LAUNCH_APPROVED, signingSecret: process.env.ORDER_WEBHOOK_SECRET,
    storageUrl: process.env.ORDER_REDIS_REST_URL, storageToken: process.env.ORDER_REDIS_REST_TOKEN };
}
