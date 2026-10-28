'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { track } from '@vercel/analytics';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { filterMeasurementEvent, parsePrivacyChoice, PRIVACY_KEY, productionMeasurementAllowed, safeReferrer, type PrivacyChoice } from '../lib/measurement';

export function PrivacyControls({ enabled, customEvents, environment, origin, paths }: { enabled: boolean; customEvents: boolean; environment?: string; origin: string; paths: string[] }) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<PrivacyChoice | null>(null);
  const [ready, setReady] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [performance, setPerformance] = useState(false);
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const liveChoice = useRef<PrivacyChoice | null>(null);
  const collectionViews = useRef(new Set<string>());
  const confirmedEvent = useRef(false);
  const currentPath = useRef(pathname);
  currentPath.current = pathname;

  useEffect(() => {
    const read = () => {
      let stored = null;
      try { stored = parsePrivacyChoice(localStorage.getItem(PRIVACY_KEY)); } catch { /* Denied storage defaults to no measurement. */ }
      liveChoice.current = stored; setChoice(stored); setReady(true);
    };
    read();
    setEligible(productionMeasurementAllowed(enabled, environment, window.location.origin, origin) && safeReferrer(document.referrer, origin, paths));
    const sync = (event: StorageEvent) => { if (event.key === PRIVACY_KEY || event.key === null) read(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [enabled, environment, origin, paths]);

  function permitted(kind: 'analytics' | 'performance') {
    const active = liveChoice.current;
    return eligible && Boolean(active && parsePrivacyChoice(JSON.stringify(active))?.[kind]);
  }
  function filtered<T extends { url: string; type: string }>(event: T, kind: 'analytics' | 'performance'): T | null {
    // The only private-route event is emitted after a new, successful confirmation.
    // Never send its token-bearing URL or any private page view / performance metric.
    return filterMeasurementEvent(event, { eligible, choice: liveChoice.current, kind, currentPath: window.location.pathname, origin, paths, confirmedEvent: confirmedEvent.current });
  }
  function record(name: string, properties?: { collection: 'sideboards' | 'bedside-tables' | 'materials'; article?: string }) {
    if (!customEvents || !permitted('analytics')) return;
    if (!paths.includes(window.location.pathname) && !(name === 'early_access_confirmed' && window.location.pathname === '/early-access/confirm')) return;
    try { track(name, properties); } catch { /* Measurement never blocks a user action. */ }
  }

  useEffect(() => {
    if (!choice?.analytics || !eligible || !customEvents) return;
    const collection = pathname === '/sideboards' ? 'sideboards' : pathname === '/bedside-tables' ? 'bedside-tables' : null;
    if (collection && !collectionViews.current.has(collection)) {
      record('collection_viewed', { collection });
      collectionViews.current.add(collection);
    }
    // Page views belong to the official Next integration; no manual page-view call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, choice?.analytics, eligible, customEvents]);

  useEffect(() => {
    const events = new Set(['early_access_started', 'early_access_requested', 'early_access_confirmed']);
    const onEvent = (event: Event) => { const name: unknown = (event as CustomEvent).detail; if (typeof name === 'string' && events.has(name)) { if (name === 'early_access_confirmed') confirmedEvent.current = true; record(name); } };
    const onLink = (event: MouseEvent) => {
      if (event.defaultPrevented || !currentPath.current.startsWith('/journal/') || !paths.includes(currentPath.current)) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.origin !== origin) return;
      const collection = anchor.pathname === '/bedside-tables' ? 'bedside-tables' : anchor.pathname === '/materials' ? 'materials' : anchor.pathname === '/sideboards' || anchor.pathname.startsWith('/sideboards/') ? 'sideboards' : null;
      if (collection && paths.includes(anchor.pathname)) record('journal_to_product', { collection, article: currentPath.current.slice('/journal/'.length) });
    };
    window.addEventListener('kr8a:measurement', onEvent);
    document.addEventListener('click', onLink);
    return () => { window.removeEventListener('kr8a:measurement', onEvent); document.removeEventListener('click', onLink); };
    // Handlers rebind on consent, so withdrawal takes effect immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, eligible, customEvents, origin, paths]);

  function save(allowAnalytics: boolean, allowPerformance: boolean) {
    const next: PrivacyChoice = { version: 1, analytics: allowAnalytics, performance: allowPerformance, updatedAt: Date.now() };
    // beforeSend reads this ref even for provider scripts already loaded before withdrawal.
    liveChoice.current = next; setChoice(next);
    try { localStorage.setItem(PRIVACY_KEY, JSON.stringify(next)); setNotice('Your privacy choices have been saved.'); }
    catch { setNotice('Your choice applies to this page. Browser storage is unavailable, so we will ask again next time.'); }
    dialog.current?.close();
  }
  function manage() { setAnalytics(choice?.analytics ?? false); setPerformance(choice?.performance ?? false); dialog.current?.showModal(); }
  const publicPage = paths.includes(pathname);
  if (pathname === '/configurator' || pathname === '/owner' || pathname.startsWith('/owner/')) return null;
  return <>
    {ready && eligible && (publicPage || pathname === '/early-access/confirm') && !choice && <section className="privacy-banner" aria-labelledby="privacy-banner-title">
      <div><p className="eyebrow">Your privacy</p><h2 id="privacy-banner-title">A considered visit.</h2><p>With your permission, Vercel helps us understand collection interest and page performance. Optional measurement starts only if you accept. You can change your choice at any time.</p><Link href="/cookies">How we use browser storage</Link></div>
      <div className="privacy-actions"><button onClick={() => save(true, true)}>Accept optional</button><button onClick={() => save(false, false)}>Reject optional</button><button onClick={manage}>Manage preferences</button></div>
    </section>}
    <button className="privacy-launcher" onClick={manage} aria-haspopup="dialog">Privacy choices</button>
    <p className="sr-only" role="status">{notice}</p>
    <dialog ref={dialog} className="privacy-dialog" aria-labelledby="privacy-title">
      <div className="privacy-dialog-heading"><p className="eyebrow">KR8A / Your privacy</p><button aria-label="Close privacy preferences" onClick={() => dialog.current?.close()}>Close ×</button></div>
      <h2 id="privacy-title">Your visit. Your choice.</h2>
      <p>Essential storage supports your privacy choice and requested features. Optional measurement is off until you agree. Refusing it does not affect the website or early access.</p>
      {!eligible && <p className="privacy-status">Optional measurement is inactive on this deployment. These settings are available to review.</p>}
      <div className="privacy-option"><div><h3>Essential features</h3><p>Remembering this choice, securing forms and saving requested configurator designs.</p></div><span>Always active</span></div>
      <label className="privacy-option"><div><h3>Audience measurement</h3><p>Vercel Web Analytics: public page visits and collection interest. No advertising or cross-site profiling.</p></div><input type="checkbox" checked={analytics} onChange={event => setAnalytics(event.target.checked)} /></label>
      <label className="privacy-option"><div><h3>Performance measurement</h3><p>Vercel Speed Insights: loading speed, responsiveness and visual stability on public pages.</p></div><input type="checkbox" checked={performance} onChange={event => setPerformance(event.target.checked)} /></label>
      <div className="privacy-actions"><button onClick={() => save(analytics, performance)}>Save preferences</button><button onClick={() => save(false, false)}>Reject optional</button><button onClick={() => save(true, true)}>Accept optional</button></div>
      <p className="privacy-detail">Choices last for up to six months on this browser. <Link href="/privacy">Privacy notice</Link> · <Link href="/cookies">Cookies & storage</Link></p>
    </dialog>
    {ready && eligible && (publicPage || pathname === '/early-access/confirm') && choice?.analytics && <Analytics debug={false} beforeSend={event => filtered(event, 'analytics')} />}
    {ready && eligible && publicPage && choice?.performance && <SpeedInsights debug={false} beforeSend={event => filtered(event, 'performance')} />}
  </>;
}
