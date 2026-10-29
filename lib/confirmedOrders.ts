import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { decodeConfig, encodeConfig, type SideboardConfig } from './sideboardEngine.ts';
import { seedFromDesign, type OrderJob } from './componentOrders.ts';

/** Internal contract for a future trusted checkout/payment adapter, not a browser cart API. */
export type ConfirmedOrderEvent = {
  version: 1; eventId: string; orderId: string; mode: 'test' | 'live'; confirmedAt: string;
  paymentStatus: 'paid'; paymentReference: string; designCode: string; quantity: number;
  amountPence: number; currency: 'GBP'; pricingRulesVersion: string;
};
export type OrderWorkItem = {
  version: 1; fingerprint: string; receivedAt: string; status: 'engineering_hold';
  order: ConfirmedOrderEvent; configuration: SideboardConfig; componentJob: OrderJob;
  holdReasons: string[]; supplierRelease: 'blocked';
};
export type OrderWriteResult = 'created' | 'duplicate' | 'conflict';
export interface ConfirmedOrderStore {
  /** Store envelope, draft and idempotency markers atomically, or change nothing. */
  insert(item: OrderWorkItem): Promise<OrderWriteResult>;
  list(limit: number): Promise<OrderWorkItem[]>;
}
export type OrderEnvironment = { environment?: string; nodeEnvironment?: string; enabled?: string; launchApproved?: string; signingSecret?: string; storageUrl?: string; storageToken?: string };
export function orderIntakeMode(env: OrderEnvironment): 'test' | 'live' | null {
  if (env.enabled !== 'true' || !env.signingSecret || env.signingSecret.length < 32 || !env.storageUrl || !env.storageToken) return null;
  if (env.environment === 'preview' || (!env.environment && env.nodeEnvironment === 'development')) return 'test';
  if (env.environment === 'production' && env.launchApproved === 'true') return 'live';
  return null;
}
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(value);
export function parseConfirmedOrder(value: unknown, mode: 'test' | 'live', now: number): ConfirmedOrderEvent | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || raw.mode !== mode || raw.paymentStatus !== 'paid' || raw.currency !== 'GBP' || !identifier(raw.eventId) || !identifier(raw.orderId) || !identifier(raw.paymentReference) || !identifier(raw.pricingRulesVersion)) return null;
  if (typeof raw.quantity !== 'number' || !Number.isInteger(raw.quantity) || raw.quantity < 1 || raw.quantity > 1000 || typeof raw.amountPence !== 'number' || !Number.isSafeInteger(raw.amountPence) || raw.amountPence <= 0) return null;
  if (typeof raw.confirmedAt !== 'string' || raw.confirmedAt.length > 40 || !Number.isFinite(Date.parse(raw.confirmedAt)) || Date.parse(raw.confirmedAt) > now + 60_000) return null;
  if (typeof raw.designCode !== 'string' || !raw.designCode.startsWith('K3-')) return null;
  const config = decodeConfig(raw.designCode);
  // A confirmed order must not silently resize, swap fronts or change finish on receipt.
  if (!config || encodeConfig(config) !== raw.designCode) return null;
  return { version: 1, eventId: raw.eventId, orderId: raw.orderId, mode, confirmedAt: new Date(raw.confirmedAt).toISOString(), paymentStatus: 'paid', paymentReference: raw.paymentReference, designCode: raw.designCode, quantity: raw.quantity, amountPence: raw.amountPence, currency: 'GBP', pricingRulesVersion: raw.pricingRulesVersion };
}
export function verifyOrderSignature(body: string, timestamp: string | null, signature: string | null, secret: string, now: number): boolean {
  if (secret.length < 32 || !timestamp || !/^\d{10,13}$/.test(timestamp) || !signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  const time = Number(timestamp) * 1000;
  if (!Number.isSafeInteger(time) || Math.abs(now - time) > 300_000) return false;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature.slice(7), 'hex'));
}
export function createOrderWorkItem(order: ConfirmedOrderEvent, receivedAt: string): OrderWorkItem {
  const configuration = decodeConfig(order.designCode);
  if (!configuration) throw new Error('Invalid confirmed configuration.');
  const id = `order-${createHash('sha256').update(`${order.mode}:${order.orderId}`).digest('hex')}`;
  const componentJob = seedFromDesign(configuration, id);
  componentJob.reference = order.orderId;
  componentJob.title = `Order ${order.orderId} · sideboard ${configuration.width}`;
  componentJob.units = order.quantity;
  componentJob.customerOrder = { orderId: order.orderId, paymentReference: order.paymentReference, pricingRulesVersion: order.pricingRulesVersion, confirmedAt: order.confirmedAt, designCode: order.designCode, mode: order.mode, engineeringHold: true };
  componentJob.notes = 'Automatically created from a confirmed order. Engineering hold: incomplete prototype components; do not manufacture or send to a supplier.';
  const { eventId: _eventId, ...snapshot } = order;
  return { version: 1, fingerprint: createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'), receivedAt, status: 'engineering_hold', order, configuration, componentJob,
    holdReasons: ['No approved, versioned manufacturing compiler is installed.', 'Fronts, plinth/base, drawer boxes, exact material/edging and hardware specifications are not fully defined.'], supplierRelease: 'blocked' };
}
export async function receiveConfirmedOrder(body: string, timestamp: string | null, signature: string | null, dependencies: { mode: 'test' | 'live'; secret: string; now: number; store: ConfirmedOrderStore }) {
  if (!verifyOrderSignature(body, timestamp, signature, dependencies.secret, dependencies.now)) return { status: 401, message: 'Invalid order signature.' };
  let raw: unknown;
  try { raw = JSON.parse(body); } catch { return { status: 400, message: 'Invalid order event.' }; }
  const order = parseConfirmedOrder(raw, dependencies.mode, dependencies.now);
  if (!order) return { status: 400, message: 'Invalid confirmed order. No components created.' };
  try {
    const result = await dependencies.store.insert(createOrderWorkItem(order, new Date(dependencies.now).toISOString()));
    if (result === 'conflict') return { status: 409, message: 'Order identity conflicts with an existing snapshot. No components changed.' };
    return { status: result === 'created' ? 202 : 200, orderId: order.orderId, outcome: result, manufacturingStatus: 'engineering_hold', supplierRelease: 'blocked' };
  } catch { return { status: 503, message: 'Order storage is unavailable. Retry the same event; it has not been acknowledged.' }; }
}
