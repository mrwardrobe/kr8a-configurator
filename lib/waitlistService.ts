import { CONSENT_TEXT, CONSENT_VERSION, normalizeEmail, privateDigest, signConfirmation, verifyConfirmation } from './waitlist.ts';
import type { WaitlistStore } from './waitlistStore.ts';

export type WaitlistDependencies = {
  store: WaitlistStore; secret: string; rateSecret: string; origin: string; segment: string; from: string;
  testEmails?: string[]; now: () => number;
  verifyBot: (token: string, hostname: string) => Promise<boolean>;
  resend: (path: string, body?: object, method?: 'GET' | 'POST' | 'PATCH') => Promise<Response>;
};
export type SignupResult = { status: number; message: string; requested?: boolean; newlyConfirmed?: boolean; outcome?: 'confirmed' | 'unsubscribed' };
const unavailable = (): SignupResult => ({ status: 503, message: 'The signup service is temporarily unavailable. Please try again later.' });
const invalid = (): SignupResult => ({ status: 400, message: 'This request could not be verified. Please request a fresh link.' });
const limited = (): SignupResult => ({ status: 429, message: 'Please wait before trying again.' });

export async function requestSignup(data: Record<string, unknown>, ip: string, deps: WaitlistDependencies): Promise<SignupResult> {
  const email = normalizeEmail(data.email);
  if (!email || data.consent !== true) return { status: 400, message: 'Enter a valid email and tick the consent box.' };
  if (deps.testEmails && !deps.testEmails.includes(email)) return { status: 403, message: 'This test only accepts approved test addresses.' };
  if (data.website || typeof data.startedAt !== 'number' || !Number.isFinite(data.startedAt) || deps.now() - data.startedAt < 3000 || deps.now() - data.startedAt > 3600000) return invalid();
  if (typeof data.turnstile !== 'string' || !data.turnstile || data.turnstile.length > 2048) return { status: 400, message: 'Complete the verification and try again.' };
  const digest = privateDigest(email, deps.rateSecret);
  try {
    if (!await deps.store.limit('global-send', 30, 60) || !await deps.store.limit('ip:' + privateDigest(ip, deps.rateSecret), 8, 900)) return limited();
    if (!await deps.verifyBot(data.turnstile, new URL(deps.origin).hostname)) return { status: 400, message: 'Verification failed. Please try again.' };
    if (!await deps.store.limit('email:' + digest, 3, 3600)) return limited();
    // Suppression applies to pending confirmation links too, not just stored contacts.
    if (await deps.store.withdrawn(digest)) return { status: 400, message: 'This address has a recent withdrawal. Please contact KR8A if you want to rejoin.' };
    const token = signConfirmation(email, deps.now(), deps.secret);
    const unsubscribe = signConfirmation(email, deps.now(), deps.secret, 'unsubscribe');
    const response = await deps.resend('/emails', {
      from: deps.from, to: [email], subject: 'Confirm your KR8A early-access request',
      text: `Please confirm that you want KR8A launch and product updates:\n${deps.origin}/early-access/confirm?token=${encodeURIComponent(token)}\n\nYour request: ${CONSENT_TEXT}\n\nYou are not subscribed until you confirm. If you did not request this, ignore this email. The confirmation link expires in 48 hours.\n\nCancel this request or unsubscribe:\n${deps.origin}/early-access/unsubscribe?token=${encodeURIComponent(unsubscribe)}\n\nKR8A · ${deps.origin}/privacy`,
    });
    return response.ok ? { status: 200, message: 'Check your email for a confirmation link.', requested: true } : { status: 502, message: 'We could not send the confirmation email. Please try again later.' };
  } catch { return unavailable(); }
}

export async function manageSignup(token: string, action: 'confirm' | 'unsubscribe', deps: WaitlistDependencies): Promise<SignupResult> {
  const verified = verifyConfirmation(token, deps.secret, deps.now(), action);
  if (!verified) return invalid();
  if (deps.testEmails && !deps.testEmails.includes(verified.email)) return invalid();
  const digest = privateDigest(verified.email, deps.rateSecret);
  const lockKey = 'contact:' + digest;
  let lock: string | null = null;
  try {
    if (!await deps.store.limit('manage:' + digest, 12, 900)) return limited();
    lock = await deps.store.lock(lockKey);
    if (!lock) return limited();
    const path = `/contacts/${encodeURIComponent(verified.email)}`;
    const existing = await deps.resend(path, undefined, 'GET');
    if (!existing.ok && existing.status !== 404) return unavailable();
    const contact = existing.ok ? await existing.json() : null;
    if (action === 'unsubscribe') {
      await deps.store.withdraw(digest);
      if (contact && !contact.unsubscribed && !(await deps.resend(path, { unsubscribed: true }, 'PATCH')).ok) return unavailable();
      return { status: 200, message: 'You have been unsubscribed from KR8A launch and product updates.', outcome: 'unsubscribed' };
    }
    if (await deps.store.withdrawn(digest) || contact?.unsubscribed === true) return { status: 400, message: 'This address has been unsubscribed. Contact KR8A if you want to rejoin.' };
    // An existing confirmed contact is a successful repeat, never a new conversion.
    if (contact?.properties?.kr8a_confirmed_at) return { status: 200, message: 'Your address is already confirmed.', outcome: 'confirmed', newlyConfirmed: false };
    const properties = { kr8a_consent_at: new Date(verified.timestamp).toISOString(), kr8a_confirmed_at: new Date(deps.now()).toISOString(), kr8a_consent_version: CONSENT_VERSION };
    if (contact) {
      // Membership must succeed before recording confirmation. A retry can finish a partial update.
      if (!(await deps.resend(`${path}/segments/${encodeURIComponent(deps.segment)}`)).ok) return unavailable();
      if (!(await deps.resend(path, { properties }, 'PATCH')).ok) return unavailable();
    } else if (!(await deps.resend('/contacts', { email: verified.email, unsubscribed: false, segments: [{ id: deps.segment }], properties })).ok) return unavailable();
    return { status: 200, message: 'Thank you for joining KR8A early access.', outcome: 'confirmed', newlyConfirmed: true };
  } catch { return unavailable(); }
  finally { if (lock) { try { await deps.store.unlock(lockKey, lock); } catch { /* The lock expires after 60 seconds. */ } } }
}
