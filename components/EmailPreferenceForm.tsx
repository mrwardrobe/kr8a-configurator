'use client';

import { useRef, useState } from 'react';
import { emitMeasurement } from '../lib/measurement';

export function EmailPreferenceForm({ token, action }: { token: string; action: 'confirm' | 'unsubscribe' }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const inFlight = useRef(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || done) return;
    inFlight.current = true; setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/early-access/${action}`, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token }).toString(),
      });
      const result = await response.json();
      if (!response.ok || !result.outcome) throw new Error(result.message || 'Please try again later.');
      if (action === 'confirm' && result.newlyConfirmed === true) emitMeasurement('early_access_confirmed');
      setDone(true); setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The service is temporarily unavailable. Please try again.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <form className="confirm-form" action={`/api/early-access/${action}`} method="post" onSubmit={submit}>
    <input type="hidden" name="token" value={token} />
    <button className="button button-ink" type="submit" disabled={busy || done}>{done ? 'Done' : busy ? 'Saving…' : action === 'confirm' ? 'Confirm my email ↗' : 'Unsubscribe me ↗'}</button>
    {message && <p className="confirmation-note" role="status">{message}</p>}
  </form>;
}
