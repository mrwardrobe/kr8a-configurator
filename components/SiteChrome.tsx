import Link from 'next/link';
import { breadcrumbJson } from '../lib/seo';

export const primaryLinks = [
  { href: '/sideboards', label: 'Sideboards' },
  { href: '/materials', label: 'Materials' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/journal', label: 'Journal' },
];

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return <header className={`editorial-header ${overlay ? 'editorial-header-overlay' : ''}`}>
    <Link className="brand" href="/" aria-label="KR8A home">KR8A</Link>
    <nav aria-label="Primary navigation">{primaryLinks.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
    <Link href="/#early-access" className="header-access">Early access <span aria-hidden="true">↗</span></Link>
  </header>;
}

export function SiteFooter() {
  return <footer className="editorial-footer">
    <div><Link href="/" className="brand">KR8A</Link><p>Beautiful furniture. Made to fit your space.</p><small>Our first sideboard collection is in development. Orders are not open.</small></div>
    <nav aria-label="Footer navigation">
      <div><Link href="/sideboards">Sideboards</Link><Link href="/materials">Materials</Link><Link href="/how-it-works">How it works</Link><Link href="/our-story">Our story</Link><Link href="/journal">Journal</Link></div>
      <div><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link></div>
    </nav>
    <small>© {new Date().getFullYear()} KR8A</small>
  </footer>;
}

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  const all = [{ name: 'Home', path: '/' }, ...items];
  return <><nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{all.map((item, index) => <li key={item.path}>{index > 0 && <span aria-hidden="true">/</span>}{index === all.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}</li>)}</ol></nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson(all)) }} />
  </>;
}

export function EditorialPage({ eyebrow, title, intro, children, crumbs }: { eyebrow: string; title: string; intro: string; children: React.ReactNode; crumbs: { name: string; path: string }[] }) {
  return <><SiteHeader /><main className="editorial-main"><Breadcrumbs items={crumbs} /><header className="editorial-lead"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{intro}</p></header>{children}</main><SiteFooter /></>;
}

export function TextSection({ eyebrow, title, children }: { eyebrow?: string; title: string; children: React.ReactNode }) {
  return <section className="editorial-text-section">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2><div className="editorial-prose">{children}</div></section>;
}
