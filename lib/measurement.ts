export const PRIVACY_KEY = 'kr8a-privacy-v1';
export const PRIVACY_VERSION = 1;
export const CHOICE_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
export type PrivacyChoice = { version: 1; analytics: boolean; performance: boolean; updatedAt: number };
export type MeasurementEvent = 'early_access_started' | 'early_access_requested' | 'early_access_confirmed';

export function parsePrivacyChoice(value: string | null, now = Date.now()): PrivacyChoice | null {
  try {
    const data = JSON.parse(value || 'null');
    if (!data || data.version !== PRIVACY_VERSION || typeof data.analytics !== 'boolean' || typeof data.performance !== 'boolean' || !Number.isFinite(data.updatedAt) || data.updatedAt > now || now - data.updatedAt >= CHOICE_LIFETIME_MS) return null;
    return { version: 1, analytics: data.analytics, performance: data.performance, updatedAt: data.updatedAt };
  } catch { return null; }
}

export function cleanMeasurementUrl(raw: string, origin: string, allowedPaths: readonly string[]): string | null {
  try {
    const url = new URL(raw);
    if (url.origin !== origin || !allowedPaths.includes(url.pathname) || url.username || url.password) return null;
    return `${origin}${url.pathname}`;
  } catch { return null; }
}

export function safeReferrer(referrer: string, origin: string, allowedPaths: readonly string[]): boolean {
  if (!referrer) return true;
  try {
    const url = new URL(referrer);
    return !url.search && !url.hash && !url.username && !url.password && (url.pathname === '/' || (url.origin === origin && allowedPaths.includes(url.pathname)));
  } catch { return false; }
}

export function productionMeasurementAllowed(enabled: boolean, environment: string | undefined, currentOrigin: string, canonicalOrigin: string): boolean {
  return enabled && environment === 'production' && canonicalOrigin === 'https://kr8a.com' && currentOrigin === canonicalOrigin;
}

export function filterMeasurementEvent<T extends { url: string; type: string }>(event: T, state: { eligible: boolean; choice: PrivacyChoice | null; kind: 'analytics' | 'performance'; currentPath: string; origin: string; paths: readonly string[]; confirmedEvent: boolean }): T | null {
  if (!state.eligible || !parsePrivacyChoice(JSON.stringify(state.choice))?.[state.kind]) return null;
  if (state.paths.includes(state.currentPath)) {
    const url = cleanMeasurementUrl(event.url, state.origin, state.paths);
    return url ? { ...event, url } : null;
  }
  if (state.kind === 'analytics' && event.type === 'event' && state.confirmedEvent && state.currentPath === '/early-access/confirm') {
    try { if (new URL(event.url).origin === state.origin) return { ...event, url: `${state.origin}/early-access/confirmed` }; } catch { /* Invalid URL: deny. */ }
  }
  return null;
}

// No payload parameter: form values and configuration data cannot enter events.
export function emitMeasurement(name: MeasurementEvent) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('kr8a:measurement', { detail: name }));
}
