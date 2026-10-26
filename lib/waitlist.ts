import { createHmac, timingSafeEqual } from 'node:crypto';

export const CONSENT_VERSION = 'kr8a-launch-v1';
const TOKEN_LIFETIME_MS = 48 * 60 * 60 * 1000;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function waitlistReady(): boolean {
  return process.env.WAITLIST_ENABLED === 'true' && Boolean(
    process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL &&
    process.env.RESEND_SEGMENT_ID && process.env.WAITLIST_TOKEN_SECRET &&
    process.env.NEXT_PUBLIC_CONTACT_EMAIL && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
    process.env.TURNSTILE_SECRET_KEY,
  );
}

export function signConfirmation(email: string, timestamp: number, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ email, timestamp, version: CONSENT_VERSION })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyConfirmation(token: string, secret: string, now = Date.now()): { email: string; timestamp: number } | null {
  if (!token || token.length > 1024) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  let actual: Buffer;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const email = normalizeEmail(data.email);
    if (!email || data.version !== CONSENT_VERSION || !Number.isFinite(data.timestamp) || data.timestamp > now || now - data.timestamp > TOKEN_LIFETIME_MS) return null;
    return { email, timestamp: data.timestamp };
  } catch { return null; }
}

export async function resendRequest(path: string, body?: object, method: 'GET' | 'POST' | 'PATCH' = 'POST'): Promise<Response> {
  return fetch(`https://api.resend.com${path}`, {
    method, headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store',
  });
}
