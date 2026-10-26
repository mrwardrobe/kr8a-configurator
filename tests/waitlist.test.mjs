import test from 'node:test';
import assert from 'node:assert/strict';
import { CONSENT_VERSION, normalizeEmail, signConfirmation, verifyConfirmation } from '../lib/waitlist.ts';

test('email normalization accepts ordinary addresses and rejects invalid input', () => {
  assert.equal(normalizeEmail('  PERSON@Example.com '), 'person@example.com');
  assert.equal(normalizeEmail('not-an-email'), null);
  assert.equal(normalizeEmail('a'.repeat(255) + '@example.com'), null);
});

test('confirmation token preserves the address and consent version', () => {
  const now = Date.now();
  const token = signConfirmation('person@example.com', now, 'test-secret');
  assert.deepEqual(verifyConfirmation(token, 'test-secret', now + 1000), { email: 'person@example.com', timestamp: now });
  assert.equal(CONSENT_VERSION, 'kr8a-launch-v1');
});

test('confirmation fails after tampering or expiry', () => {
  const now = Date.now();
  const token = signConfirmation('person@example.com', now, 'test-secret');
  assert.equal(verifyConfirmation(token + 'x', 'test-secret', now), null);
  assert.equal(verifyConfirmation(token, 'other-secret', now), null);
  assert.equal(verifyConfirmation(token, 'test-secret', now + 49 * 60 * 60 * 1000), null);
  assert.equal(verifyConfirmation(token, 'test-secret', now - 1), null);
});
