import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createOrderWorkItem, orderIntakeMode, parseConfirmedOrder, receiveConfirmedOrder, verifyOrderSignature } from '../lib/confirmedOrders.ts';
import { defaultSideboardConfig, encodeConfig, normalizeConfig } from '../lib/sideboardEngine.ts';
import { approveOrder, orderCsv, orderIssues, parseOrderBackup, workspaceBackup } from '../lib/componentOrders.ts';

const now = Date.parse('2026-10-29T12:00:00Z');
const secret = 'test-only-signing-secret-do-not-use-live';
const timestamp = String(now / 1000);
const event = (patch = {}) => ({ version: 1, eventId: 'test-event-1', orderId: 'KR8A-TEST-001', mode: 'test', confirmedAt: '2026-10-29T11:59:00.000Z', paymentStatus: 'paid', paymentReference: 'test-payment-1', designCode: encodeConfig(normalizeConfig({ ...defaultSideboardConfig, width: 1800, shelfPosition: -40 })), quantity: 2, amountPence: 299000, currency: 'GBP', pricingRulesVersion: 'test-rate-card-v1', ...patch });
const signature = (body, ts = timestamp) => 'sha256=' + createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
function memoryStore() {
  const orders = new Map(), events = new Map();
  return { orders, async insert(item) {
    const key = item.order.orderId;
    if (events.has(item.order.eventId) && events.get(item.order.eventId) !== key) return 'conflict';
    const existing = orders.get(key);
    if (existing && existing.fingerprint !== item.fingerprint) return 'conflict';
    events.set(item.order.eventId, key);
    if (existing) return 'duplicate';
    orders.set(key, item); return 'created';
  }, async list(limit) { return [...orders.values()].slice(0, limit); } };
}
const receive = (data, store) => { const body = JSON.stringify(data); return receiveConfirmedOrder(body, timestamp, signature(body), { mode: 'test', secret, now, store }); };

test('authenticated confirmed order automatically creates one linked component draft with the exact snapshot and quantity', async () => {
  const store = memoryStore();
  const result = await receive(event(), store);
  assert.equal(result.status, 202);
  assert.equal(result.supplierRelease, 'blocked');
  const [item] = await store.list(20);
  assert.equal(item.order.orderId, 'KR8A-TEST-001');
  assert.equal(item.configuration.width, 1800);
  assert.equal(item.configuration.shelfPosition, -40);
  assert.equal(item.componentJob.units, 2);
  assert.equal(item.componentJob.reference, item.order.orderId);
  assert.equal(item.componentJob.customerOrder.designCode, item.order.designCode);
  assert.equal(item.componentJob.customerOrder.engineeringHold, true);
  assert.ok(item.componentJob.panels.length > 0);
  assert.equal(item.status, 'engineering_hold');
  assert.equal(item.order.amountPence, 299000);
});

test('duplicate, concurrent and new-event retries do not duplicate components; conflicting order snapshots do not overwrite', async () => {
  const store = memoryStore();
  const results = await Promise.all(Array.from({ length: 8 }, () => receive(event(), store)));
  assert.equal(results.filter(r => r.status === 202).length, 1);
  assert.equal(results.filter(r => r.status === 200).length, 7);
  assert.equal(store.orders.size, 1);
  assert.equal((await receive(event({ eventId: 'retry-event-2' }), store)).status, 200);
  for (const patch of [{ quantity: 3 }, { amountPence: 200000 }, { designCode: encodeConfig(defaultSideboardConfig) }, { paymentReference: 'changed' }]) assert.equal((await receive(event(patch), store)).status, 409);
  assert.equal((await receive(event({ orderId: 'DIFFERENT-ORDER' }), store)).status, 409);
  assert.equal(store.orders.size, 1);
  assert.equal([...store.orders.values()][0].componentJob.units, 2);
});

test('signatures bind the exact body and timestamp and reject old or future replay attempts', async () => {
  const body = JSON.stringify(event());
  assert.equal(verifyOrderSignature(body, timestamp, signature(body), secret, now), true);
  for (const [b, ts, sig, key, time] of [[body + ' ', timestamp, signature(body), secret, now], [body, timestamp, null, secret, now], [body, timestamp, signature(body), 'wrong-secret', now], [body, timestamp, signature(body), secret, now + 301000], [body, timestamp, signature(body), secret, now - 301000]]) assert.equal(verifyOrderSignature(b, ts, sig, key, time), false);
  const store = memoryStore();
  assert.equal((await receiveConfirmedOrder(body, timestamp, 'sha256=' + '0'.repeat(64), { mode: 'test', secret, now, store })).status, 401);
  assert.equal(store.orders.size, 0);
});

test('unpaid, malformed, wrong-mode or silently normalised orders are rejected', () => {
  for (const patch of [{ paymentStatus: 'pending' }, { mode: 'live' }, { currency: 'EUR' }, { quantity: 0 }, { quantity: 1.5 }, { amountPence: -1 }, { amountPence: 0 }, { amountPence: 1.5 }, { pricingRulesVersion: '' }, { confirmedAt: 'invalid' }, { confirmedAt: '2026-10-30T00:00:00Z' }, { designCode: event().designCode.replace('1800', '1801') }, { orderId: 'unsafe/order' }]) assert.equal(parseConfirmedOrder(event(patch), 'test', now), null, JSON.stringify(patch));
});

test('storage failures are retryable and never acknowledge a lost order', async () => {
  const broken = { async insert() { throw new Error('Offline'); }, async list() { return []; } };
  const result = await receive(event(), broken);
  assert.equal(result.status, 503);
  assert.ok(!('outcome' in result));
  const recovered = memoryStore();
  assert.equal((await receive(event(), recovered)).status, 202);
});

test('order origin and engineering hold survive backups and cannot be released by ticking prototype review boxes', () => {
  const item = createOrderWorkItem(event(), new Date(now).toISOString());
  const job = item.componentJob;
  job.supplier = 'Test supplier'; job.reviewer = 'Test reviewer';
  job.panels = job.panels.map(p => ({ ...p, material: 'TEST', grain: 'none', edges: { length1: 'none', length2: 'none', width1: 'none', width2: 'none' }, machining: 'none', verified: true }));
  job.checks = { complete: true, dimensions: true, materials: true, supplier: true };
  assert.equal(orderIssues(job).length, 1);
  assert.match(orderIssues(job)[0], /Engineering hold/);
  assert.throws(() => approveOrder(job, new Date(now).toISOString()));
  assert.throws(() => orderCsv(job, true));
  assert.match(orderCsv(job), /ENGINEERING HOLD — DO NOT MANUFACTURE/);
  const [restored] = parseOrderBackup(workspaceBackup([job]));
  assert.equal(restored.customerOrder.orderId, item.order.orderId);
  assert.equal(restored.customerOrder.engineeringHold, true);
  const [tampered] = parseOrderBackup(workspaceBackup([{ ...job, customerOrder: { ...job.customerOrder, engineeringHold: false } }]));
  assert.equal(tampered.customerOrder.engineeringHold, true);
});

test('order intake stays off unless configured; production additionally needs explicit launch approval', () => {
  const env = { enabled: 'true', signingSecret: secret, storageUrl: 'https://example.upstash.io', storageToken: 'test-only', nodeEnvironment: 'production' };
  assert.equal(orderIntakeMode({ ...env, environment: 'preview' }), 'test');
  assert.equal(orderIntakeMode({ ...env, environment: 'production' }), null);
  assert.equal(orderIntakeMode({ ...env, environment: 'production', launchApproved: 'true' }), 'live');
  for (const patch of [{ enabled: 'false' }, { signingSecret: '' }, { storageUrl: '' }, { storageToken: '' }, { environment: 'untrusted' }]) assert.equal(orderIntakeMode({ ...env, environment: 'preview', ...patch }), null);
  assert.equal(orderIntakeMode({}), null);
});
