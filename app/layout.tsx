import type { Metadata } from 'next';
import { publicSiteUrl } from '../lib/site';
import './globals.css';

const siteUrl = publicSiteUrl();
export const metadata: Metadata = {
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
  return <html lang="en-GB"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Libre+Caslon+Display&display=swap" rel="stylesheet" />
  </head><body>{children}</body></html>;
}
