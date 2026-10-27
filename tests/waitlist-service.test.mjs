import test from 'node:test';
import assert from 'node:assert/strict';
import { requestSignup, manageSignup } from '../lib/waitlistService.ts';
import { signConfirmation, CONSENT_VERSION, waitlistReady } from '../lib/waitlist.ts';

// Deliberate in-memory doubles: these tests never send email or contact a live store.
function fixture() {
  const state = { contact: null, sent: [], keys: [], limits: new Map(), locked: false, withdrawn: false, fail: '', bot: true };
  const now = Date.now();
  const deps = {
    now: () => now, secret: 'test-token-secret'.repeat(4), rateSecret: 'test-rate-secret'.repeat(4), origin: 'https://kr8a.com', segment: 'test-segment', from: 'test@example.invalid',
    store: {
      async limit(key, max) { state.keys.push(key); if (state.fail === 'store') throw new Error('down'); const count = (state.limits.get(key) || 0) + 1; state.limits.set(key, count); return count <= max; },
      async lock() { if (state.locked) return null; state.locked = true; return 'owner'; },
      async unlock() { state.locked = false; }, async withdrawn() { return state.withdrawn; }, async withdraw() { state.withdrawn = true; },
    },
    async verifyBot() { return state.bot; },
    async resend(path, body, method = 'POST') {
      if (state.fail === path || state.fail === method) return new Response('{}', { status: 502 });
      if (path === '/emails') { state.sent.push(body); return Response.json({ id: 'test-email' }); }
      if (method === 'GET') return state.contact ? Response.json(state.contact) : new Response('{}', { status: 404 });
      if (path === '/contacts') { state.contact = structuredClone(body); return Response.json({ id: 'test-contact' }); }
      if (method === 'PATCH') { Object.assign(state.contact, structuredClone(body)); return Response.json({ id: 'test-contact' }); }
      return Response.json({ id: 'test-segment' });
    },
  };
  const input = { email: 'PERSON@example.com', consent: true, website: '', startedAt: now - 5000, turnstile: 'test-token' };
  const token = signConfirmation('person@example.com', now - 5000, deps.secret);
  return { state, deps, input, token };
}

test('request success only means verification sent; no contact exists before confirmation', async () => {
  const { state, deps, input } = fixture();
  const result = await requestSignup(input, '192.0.2.1', deps);
  assert.equal(result.requested, true); assert.equal(result.newlyConfirmed, undefined);
  assert.equal(state.contact, null); assert.equal(state.sent.length, 1);
  assert.ok(state.sent[0].text.includes('/early-access/unsubscribe?token=v2.'));
  assert.ok(state.keys.every(key => !key.includes('person@') && !key.includes('192.0.2.1')));
});

test('missing consent, honeypots, invalid timers and bots never send email', async () => {
  for (const override of [{ consent: false }, { website: 'bot' }, { startedAt: NaN }, { startedAt: Date.now() + 10000 }, { email: 'bad' }, { turnstile: '' }]) {
    const { state, deps, input } = fixture();
    assert.notEqual((await requestSignup({ ...input, ...override }, '192.0.2.1', deps)).status, 200); assert.equal(state.sent.length, 0);
  }
  const { state, deps, input } = fixture(); state.bot = false;
  assert.equal((await requestSignup(input, '192.0.2.1', deps)).status, 400); assert.equal(state.sent.length, 0);
});

test('shared limits and a failed store fail closed; failed delivery is not a conversion', async () => {
  const { state, deps, input } = fixture();
  for (let i = 0; i < 3; i++) assert.equal((await requestSignup(input, '192.0.2.1', deps)).status, 200);
  assert.equal((await requestSignup(input, '192.0.2.1', deps)).status, 429);
  state.fail = 'store'; assert.equal((await requestSignup(input, '192.0.2.2', deps)).status, 503);
  const other = fixture(); other.state.fail = '/emails';
  const failed = await requestSignup(other.input, '192.0.2.1', other.deps);
  assert.equal(failed.status, 502); assert.equal(failed.requested, undefined);
});

test('new confirmation records both consent times; repeats keep original evidence and are not new conversions', async () => {
  const { state, deps, token } = fixture();
  const first = await manageSignup(token, 'confirm', deps);
  assert.equal(first.newlyConfirmed, true); assert.equal(first.outcome, 'confirmed');
  assert.equal(state.contact.properties.kr8a_consent_version, CONSENT_VERSION);
  assert.equal(state.contact.properties.kr8a_consent_at, new Date(deps.now() - 5000).toISOString());
  const evidence = structuredClone(state.contact.properties);
  const repeat = await manageSignup(token, 'confirm', deps);
  assert.equal(repeat.newlyConfirmed, false); assert.deepEqual(state.contact.properties, evidence);
});

test('locked concurrent confirmations do not create contacts or report success', async () => {
  const { state, deps, token } = fixture(); state.locked = true;
  const result = await manageSignup(token, 'confirm', deps);
  assert.equal(result.status, 429); assert.equal(result.newlyConfirmed, undefined); assert.equal(state.contact, null);
});

test('segment failure does not record a confirmed consent or report a conversion', async () => {
  const { state, deps, token } = fixture(); state.contact = { unsubscribed: false, properties: {} };
  state.fail = '/contacts/person%40example.com/segments/test-segment';
  const result = await manageSignup(token, 'confirm', deps);
  assert.equal(result.status, 503); assert.equal(result.newlyConfirmed, undefined); assert.deepEqual(state.contact.properties, {});
});

test('unsubscribed contacts cannot be silently reactivated; cancellations block pending links', async () => {
  const { state, deps, token } = fixture(); state.contact = { unsubscribed: true, properties: {} };
  assert.equal((await manageSignup(token, 'confirm', deps)).status, 400); assert.equal(state.contact.unsubscribed, true);
  state.contact = null;
  const optOut = signConfirmation('person@example.com', deps.now(), deps.secret, 'unsubscribe');
  assert.equal((await manageSignup(optOut, 'unsubscribe', deps)).outcome, 'unsubscribed');
  assert.equal((await manageSignup(token, 'confirm', deps)).status, 400); assert.equal(state.contact, null);
});

test('unsubscribe updates suppression; a failed provider update is not reported as successful', async () => {
  const { state, deps } = fixture(); state.contact = { unsubscribed: false, properties: {} };
  const token = signConfirmation('person@example.com', deps.now(), deps.secret, 'unsubscribe');
  state.fail = 'PATCH'; assert.equal((await manageSignup(token, 'unsubscribe', deps)).status, 503);
  state.fail = ''; assert.equal((await manageSignup(token, 'unsubscribe', deps)).outcome, 'unsubscribed');
  assert.equal(state.contact.unsubscribed, true);
});

test('preview test allowlist prevents sending to unapproved real addresses', async () => {
  const { state, deps, input, token } = fixture(); deps.testEmails = ['owner@example.invalid'];
  assert.equal((await requestSignup(input, '192.0.2.1', deps)).status, 403);
  assert.equal((await manageSignup(token, 'confirm', deps)).status, 400); assert.equal(state.sent.length, 0);
});

test('signup cannot activate with missing configuration', () => {
  const previous = process.env.WAITLIST_ENABLED;
  process.env.WAITLIST_ENABLED = 'true';
  try { assert.equal(waitlistReady(), false); }
  finally { if (previous === undefined) delete process.env.WAITLIST_ENABLED; else process.env.WAITLIST_ENABLED = previous; }
});
