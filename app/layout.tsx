import type { Metadata } from 'next';
import { publicSiteUrl } from '../lib/site';
import { publicPaths } from '../lib/publicPaths';
import { PrivacyControls } from '../components/PrivacyControls';
import './globals.css';

const siteUrl = publicSiteUrl();
export const metadata: Metadata = {
  ...(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' ? { robots: { index: false, follow: false } } : {}),
  ...(siteUrl ? { metadataBase: new URL(siteUrl), alternates: { canonical: `${siteUrl}/` } } : {}),
  title: 'KR8A | Made-to-measure sideboards, coming soon',
  description: 'Beautiful sideboards and bedside tables designed around your space. Explore considered proportions and premium decorative finishes. Coming soon.',
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  openGraph: {
    type: 'website', title: 'KR8A | Made-to-measure sideboards, coming soon',
    description: 'Beautiful furniture. Made to fit your space. The first KR8A sideboard collection is in development.',
    ...(siteUrl ? { url: `${siteUrl}/` } : {}),
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><body>{children}<PrivacyControls enabled={process.env.ANALYTICS_ENABLED === 'true'} customEvents={process.env.ANALYTICS_CUSTOM_EVENTS_ENABLED === 'true'} environment={process.env.VERCEL_ENV} origin={siteUrl ?? 'https://kr8a.com'} paths={publicPaths} /></body></html>;
}
