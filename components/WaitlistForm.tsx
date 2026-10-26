'use client';

import { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';

export function WaitlistForm({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || busy) return;
    setBusy(true); setStatus('');
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/early-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.get('email'), consent: data.get('consent') === 'on', website: data.get('website'), startedAt, turnstile: data.get('cf-turnstile-response') }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'We could not send the confirmation email. Please try again.');
      setStatus('Check your email for a confirmation link. You are not on the list until you confirm.');
      form.reset();
      if (window.turnstile) window.turnstile.reset();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="waitlist-block">
    <form onSubmit={submit} aria-label="Early access signup">
      <label htmlFor="waitlist-email">Email address</label>
      <div className="waitlist-input-row"><input id="waitlist-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" maxLength={254} required disabled={!enabled || busy} /><button type="submit" disabled={!enabled || busy}>{busy ? 'Sending…' : 'Keep me updated'} <span aria-hidden="true">↗</span></button></div>
      <label className="waitlist-consent"><input type="checkbox" name="consent" required disabled={!enabled || busy} /><span>I agree to receive KR8A launch and product updates by email. I can unsubscribe at any time.</span></label>
      <div className="waitlist-trap" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" /></div>
      {enabled && <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" /><div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-theme="dark" /></>}
    </form>
    <p className="waitlist-note">{enabled ? 'Please confirm your address using the email we send. ' : 'Early-access signup will open after secure storage and email delivery have been tested. '}Read our <Link href="/privacy">privacy notice</Link>.</p>
    {status && <p className="waitlist-status" role="status">{status}</p>}
  </div>;
}

declare global { interface Window { turnstile?: { reset: () => void } } }
