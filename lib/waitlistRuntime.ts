import { createWaitlistStore } from './waitlistStore';
import { resendRequest, waitlistOrigin } from './waitlist';
import type { WaitlistDependencies } from './waitlistService';

export function waitlistDependencies(): WaitlistDependencies {
  return {
    store: createWaitlistStore(), secret: process.env.WAITLIST_TOKEN_SECRET!, rateSecret: process.env.WAITLIST_RATE_SECRET!,
    origin: waitlistOrigin()!, segment: process.env.RESEND_SEGMENT_ID!, from: process.env.RESEND_FROM_EMAIL!,
    ...(process.env.VERCEL_ENV !== 'production' ? { testEmails: (process.env.WAITLIST_TEST_EMAILS || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean) } : {}),
    now: Date.now, resend: resendRequest,
    async verifyBot(token, hostname) {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
      });
      const data = await response.json();
      return response.ok && data.success === true && data.hostname === hostname && data.action === 'early_access';
    },
  };
}
