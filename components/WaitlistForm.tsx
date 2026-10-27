'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { CONSENT_TEXT } from '../lib/marketingConsent';
import { emitMeasurement } from '../lib/measurement';

export function WaitlistForm({ enabled }: { enabled: boolean }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [botToken, setBotToken] = useState('');
  const widgetNode = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string>();
  const inFlight = useRef(false);
  const started = useRef(false);
  const [startedAt] = useState(() => Date.now());
  useEffect(() => {
    if (!scriptReady || !widgetNode.current || !window.turnstile || submitted) return;
    widgetId.current = window.turnstile.render(widgetNode.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!, theme: 'dark', action: 'early_access',
      callback: setBotToken, 'expired-callback': () => setBotToken(''), 'error-callback': () => { setBotToken(''); setStatus('Verification is unavailable. Please try again later.'); },
    });
    return () => { if (widgetId.current) window.turnstile?.remove(widgetId.current); widgetId.current = undefined; };
  }, [scriptReady, submitted]);
  function begin() {
    if (!enabled || submitted) return;
    setInteracting(true);
    if (!started.current) { started.current = true; emitMeasurement('early_access_started'); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || inFlight.current || submitted) return;
    if (!botToken) { setStatus('Please complete the verification before continuing.'); return; }
    inFlight.current = true; setBusy(true); setStatus('');
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/early-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.get('email'), consent: data.get('consent') === 'on', website: data.get('website'), startedAt, turnstile: botToken }),
      });
      const result = await response.json();
      if (!response.ok || result.requested !== true) throw new Error(result.message || 'We could not send the confirmation email. Please try again.');
      emitMeasurement('early_access_requested'); setSubmitted(true);
      setStatus('Check your email for a confirmation link. You are not on the list until you confirm.');
      form.reset();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Please try again.'); }
    finally { inFlight.current = false; setBusy(false); setBotToken(''); if (widgetId.current) window.turnstile?.reset(widgetId.current); }
  }
  return <div className="waitlist-block">
    <form onSubmit={submit} onFocusCapture={begin} aria-label="Early access signup" aria-describedby="waitlist-privacy">
      <label htmlFor="waitlist-email">Email address</label>
      <div className="waitlist-input-row"><input id="waitlist-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" maxLength={254} required disabled={!enabled || busy || submitted} /><button type="submit" disabled={!enabled || busy || submitted}>{submitted ? 'Email sent' : busy ? 'Sending…' : 'Keep me updated'} <span aria-hidden="true">↗</span></button></div>
      <label className="waitlist-consent"><input type="checkbox" name="consent" required disabled={!enabled || busy || submitted} /><span>{CONSENT_TEXT}</span></label>
      <div className="waitlist-trap" aria-hidden="true"><label htmlFor="website">Leave this field empty</label><input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" /></div>
      {enabled && interacting && !submitted && <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setScriptReady(true)} /><div ref={widgetNode} className="cf-turnstile" /></>}
    </form>
    <p className="waitlist-note" id="waitlist-privacy">{enabled ? 'We use Resend to deliver a confirmation email and store your subscription after you confirm. Cloudflare checks for automated abuse when you start the form. ' : 'Early-access signup will open after secure storage and email delivery have been tested. '}Read our <Link href="/privacy">privacy notice</Link>. Optional website measurement is a separate choice.</p>
    {enabled && <noscript><p className="waitlist-note">JavaScript is needed for the form’s security check. Please use the contact page for another way to reach us.</p></noscript>}
    {status && <p className="waitlist-status" role="status">{status}</p>}
  </div>;
}

declare global { interface Window { turnstile?: { render: (node: HTMLElement, options: { sitekey: string; theme: string; action: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }) => string; reset: (id?: string) => void; remove: (id: string) => void } } }
