export function publicSiteUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || 'https://kr8a.com';
  try {
    const url = new URL(configured);
    return url.origin === 'https://kr8a.com' && url.pathname === '/' && !url.search && !url.hash ? url.origin : null;
  } catch {
    return null;
  }
}
