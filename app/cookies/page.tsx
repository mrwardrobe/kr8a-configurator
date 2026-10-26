import Link from 'next/link';
import { EditorialPage, TextSection } from '../../components/SiteChrome';
import { pageMetadata } from '../../lib/seo';

export const metadata = { ...pageMetadata('Cookies', 'Information about cookies and browser storage used by the KR8A website.', '/cookies'), robots: { index: false, follow: true } };
export default function Cookies() {
  return <EditorialPage eyebrow="Cookies & browser storage" title="A light touch online." intro="The current KR8A site does not set marketing or analytics cookies." crumbs={[{ name: 'Cookies', path: '/cookies' }]}>
    <TextSection title="What the site uses"><p>The configurator prototype can store an unfinished design and saved designs in your browser’s local storage so you can return to them on the same device. This is browser storage, not an early-access signup or an order.</p><p>Our hosting provider may use essential technical mechanisms to serve and protect the site. When signup is enabled, Cloudflare Turnstile will check form submissions for automated abuse; we will review its browser-storage behaviour before activation. We will update this page and seek consent where required before adding optional analytics or advertising technologies.</p></TextSection>
    <div className="editorial-link-row"><Link href="/privacy">Read the privacy notice ↗</Link></div>
  </EditorialPage>;
}
