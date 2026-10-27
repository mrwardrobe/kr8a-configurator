import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';

import { CONSENT_VERSION } from './marketingConsent.ts';
export { CONSENT_VERSION, CONSENT_TEXT } from './marketingConsent.ts';
export const TOKEN_LIFETIME_MS = 48 * 60 * 60 * 1000;
export type TokenPurpose = 'confirm' | 'unsubscribe' | 'result';

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function waitlistOrigin(): string | null {
  if (process.env.VERCEL_ENV === 'production') return 'https://kr8a.com';
  try {
    const url = new URL(process.env.WAITLIST_TEST_ORIGIN || '');
    return url.protocol === 'https:' && url.hostname.endsWith('.vercel.app') && url.origin === process.env.WAITLIST_TEST_ORIGIN ? url.origin : null;
  } catch { return null; }
}

export function waitlistReady(): boolean {
  return process.env.WAITLIST_ENABLED === 'true' && Boolean(
    process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && process.env.RESEND_SEGMENT_ID &&
    (process.env.WAITLIST_TOKEN_SECRET?.length ?? 0) >= 32 && (process.env.WAITLIST_RATE_SECRET?.length ?? 0) >= 32 &&
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN &&
    normalizeEmail(process.env.NEXT_PUBLIC_CONTACT_EMAIL) && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY &&
    waitlistOrigin() && (process.env.VERCEL_ENV === 'production' ? process.env.WAITLIST_LAUNCH_APPROVED === 'true' : process.env.WAITLIST_TEST_EMAILS),
  );
}

// Withdrawal remains available if new signups have been switched off.
export function waitlistManagementReady(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.WAITLIST_TOKEN_SECRET && process.env.WAITLIST_RATE_SECRET && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN && waitlistOrigin());
}

// Authenticated encryption keeps email addresses out of readable URL tokens.
export function sealToken(data: object, secret: string, purpose: TokenPurpose): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
  cipher.setAAD(Buffer.from(`kr8a:${purpose}:v2`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  return ['v2', iv.toString('base64url'), encrypted.toString('base64url'), cipher.getAuthTag().toString('base64url')].join('.');
}

export function openToken(token: string, secret: string, purpose: TokenPurpose): Record<string, unknown> | null {
  if (!token || token.length > 2048 || !/^v2\.[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return null;
  try {
    const [, iv, encrypted, tag] = token.split('.').map(part => Buffer.from(part, 'base64url'));
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret).digest(), iv);
    decipher.setAAD(Buffer.from(`kr8a:${purpose}:v2`)); decipher.setAuthTag(tag);
    const result = JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
    return result && typeof result === 'object' && !Array.isArray(result) ? result : null;
  } catch { return null; }
}

export function signConfirmation(email: string, timestamp: number, secret: string, purpose: 'confirm' | 'unsubscribe' = 'confirm'): string {
  return sealToken({ email, timestamp, version: CONSENT_VERSION }, secret, purpose);
}

export function verifyConfirmation(token: string, secret: string, now = Date.now(), purpose: 'confirm' | 'unsubscribe' = 'confirm'): { email: string; timestamp: number } | null {
  const data = openToken(token, secret, purpose);
  const email = normalizeEmail(data?.email);
  const timestamp = data?.timestamp;
  const lifetime = purpose === 'confirm' ? TOKEN_LIFETIME_MS : 180 * 24 * 60 * 60 * 1000;
  if (!email || data?.version !== CONSENT_VERSION || typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp > now || now - timestamp > lifetime) return null;
  return { email, timestamp };
}

export function privateDigest(value: string, secret: string): string { return createHmac('sha256', secret).update(value).digest('hex'); }

export async function resendRequest(path: string, body?: object, method: 'GET' | 'POST' | 'PATCH' = 'POST'): Promise<Response> {
  return fetch(`https://api.resend.com${path}`, {
    method, headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', signal: AbortSignal.timeout(8000),
  });
}
