import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePrivacyChoice, cleanMeasurementUrl, safeReferrer, productionMeasurementAllowed, filterMeasurementEvent, CHOICE_LIFETIME_MS } from '../lib/measurement.ts';
import { readSmallBody, verifiedOrigin } from '../lib/waitlistHttp.ts';
import { signConfirmation, verifyConfirmation, openToken } from '../lib/waitlist.ts';

test('measurement requires current explicit boolean choices; malformed, old and future choices deny', () => {
  const now = 100000000000;
  const choice = { version: 1, analytics: false, performance: false, updatedAt: now };
  assert.deepEqual(parsePrivacyChoice(JSON.stringify(choice), now), choice);
  for (const value of [null, '', '{', '{}', JSON.stringify({ ...choice, version: 0 }), JSON.stringify({ ...choice, analytics: 'true' }), JSON.stringify({ ...choice, updatedAt: now + 1 })]) assert.equal(parsePrivacyChoice(value, now), null);
  assert.equal(parsePrivacyChoice(JSON.stringify(choice), now + CHOICE_LIFETIME_MS), null);
});

test('only canonical production can measure; previews, local development and alternate hosts cannot', () => {
  assert.equal(productionMeasurementAllowed(true, 'production', 'https://kr8a.com', 'https://kr8a.com'), true);
  for (const environment of ['preview', 'development', undefined]) assert.equal(productionMeasurementAllowed(true, environment, 'https://kr8a.com', 'https://kr8a.com'), false);
  for (const origin of ['https://test.vercel.app', 'http://localhost:3000', 'https://www.kr8a.com']) assert.equal(productionMeasurementAllowed(true, 'production', origin, 'https://kr8a.com'), false);
  assert.equal(productionMeasurementAllowed(false, 'production', 'https://kr8a.com', 'https://kr8a.com'), false);
});

test('measurement strips all parameters and fragments and rejects private or unknown paths', () => {
  const allowed = ['/', '/sideboards', '/journal/test'];
  assert.equal(cleanMeasurementUrl('https://kr8a.com/sideboards?email=person@example.com&width=1234#token', 'https://kr8a.com', allowed), 'https://kr8a.com/sideboards');
  for (const url of ['https://kr8a.com/configurator?c=private', 'https://kr8a.com/early-access/confirm?token=secret', 'https://kr8a.com/unknown/person@example.com', 'https://other.test/', 'https://person@kr8a.com/', 'invalid']) assert.equal(cleanMeasurementUrl(url, 'https://kr8a.com', allowed), null);
  assert.equal(safeReferrer('https://google.com/', 'https://kr8a.com', allowed), true);
  assert.equal(safeReferrer('https://other.test/user/private', 'https://kr8a.com', allowed), false);
  assert.equal(safeReferrer('https://kr8a.com/early-access/confirm?token=private', 'https://kr8a.com', allowed), false);
});

test('encrypted tokens hide addresses, reject wrong purpose and do not accept old readable tokens', () => {
  const now = Date.now(); const secret = 'a'.repeat(32);
  const token = signConfirmation('person@example.com', now, secret);
  for (const part of token.split('.')) assert.equal(Buffer.from(part, 'base64url').toString().includes('person@example.com'), false);
  assert.equal(openToken(token, secret, 'result'), null);
  assert.equal(verifyConfirmation(token, secret, now, 'unsubscribe'), null);
  assert.equal(verifyConfirmation(Buffer.from(JSON.stringify({ email: 'person@example.com', timestamp: now })).toString('base64url') + '.oldsignature', secret, now), null);
});

test('send-time filter applies refusal, withdrawal, expiry and independent performance consent', () => {
  const event = { type: 'pageview', url: 'https://kr8a.com/sideboards?email=private@example.com' };
  const state = { eligible: true, choice: { version: 1, analytics: true, performance: false, updatedAt: Date.now() }, kind: 'analytics', currentPath: '/sideboards', origin: 'https://kr8a.com', paths: ['/sideboards'], confirmedEvent: false };
  assert.deepEqual(filterMeasurementEvent(event, state), { type: 'pageview', url: 'https://kr8a.com/sideboards' });
  assert.equal(filterMeasurementEvent(event, { ...state, choice: null }), null);
  assert.equal(filterMeasurementEvent(event, { ...state, choice: { ...state.choice, analytics: false } }), null);
  assert.equal(filterMeasurementEvent(event, { ...state, choice: { ...state.choice, updatedAt: Date.now() - CHOICE_LIFETIME_MS } }), null);
  assert.equal(filterMeasurementEvent(event, { ...state, kind: 'performance' }), null);
  assert.equal(filterMeasurementEvent(event, { ...state, eligible: false }), null);
});

test('private pages and configuration stay unmeasured; only a confirmed event can use a fixed status path', () => {
  const event = { type: 'event', url: 'https://kr8a.com/early-access/confirm?token=private' };
  const state = { eligible: true, choice: { version: 1, analytics: true, performance: true, updatedAt: Date.now() }, kind: 'analytics', currentPath: '/early-access/confirm', origin: 'https://kr8a.com', paths: ['/sideboards'], confirmedEvent: false };
  assert.equal(filterMeasurementEvent(event, state), null);
  assert.deepEqual(filterMeasurementEvent(event, { ...state, confirmedEvent: true }), { type: 'event', url: 'https://kr8a.com/early-access/confirmed' });
  assert.equal(filterMeasurementEvent({ ...event, type: 'pageview' }, { ...state, confirmedEvent: true }), null);
  assert.equal(filterMeasurementEvent({ ...event, type: 'vital' }, { ...state, kind: 'performance', confirmedEvent: true }), null);
  assert.equal(filterMeasurementEvent(event, { ...state, currentPath: '/configurator', confirmedEvent: true }), null);
  assert.equal(filterMeasurementEvent({ ...event, url: 'https://other.test/' }, { ...state, confirmedEvent: true }), null);
});

test('API origin checks reject missing, cross-origin and cross-site submissions', () => {
  const request = headers => new Request('https://kr8a.com/api/early-access', { method: 'POST', headers });
  assert.equal(verifiedOrigin(request({ origin: 'https://kr8a.com', 'sec-fetch-site': 'same-origin' }), 'https://kr8a.com'), true);
  assert.equal(verifiedOrigin(request({}), 'https://kr8a.com'), false);
  assert.equal(verifiedOrigin(request({ origin: 'https://other.test' }), 'https://kr8a.com'), false);
  assert.equal(verifiedOrigin(request({ origin: 'https://kr8a.com', 'sec-fetch-site': 'cross-site' }), 'https://kr8a.com'), false);
});

test('body size is enforced even without a trustworthy Content-Length', async () => {
  const valid = new Request('https://kr8a.com', { method: 'POST', body: 'small' });
  assert.equal(await readSmallBody(valid), 'small');
  await assert.rejects(() => readSmallBody(new Request('https://kr8a.com', { method: 'POST', body: 'x'.repeat(4097) })));
  await assert.rejects(() => readSmallBody(new Request('https://kr8a.com', { method: 'POST', headers: { 'content-length': '5000' }, body: 'small' })));
});
