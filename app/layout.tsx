import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kr8a.com'),
  title: 'KR8A | Sideboards made for your space',
  description: 'Design a made-to-measure sideboard around your room. Set its dimensions, fronts, interior and finish in the KR8A configurator.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website', title: 'KR8A | Sideboards made for your space',
    description: 'Design a sideboard around your room.',
    url: 'https://www.kr8a.com/', images: [{ url: '/images/kr8a-hero-provisional.jpg', width: 1024, height: 1536, alt: 'KR8A sideboard design in an interior' }],
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Libre+Caslon+Display&display=swap" rel="stylesheet" />
  </head><body>{children}</body></html>;
}
