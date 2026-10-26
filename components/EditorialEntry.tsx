import Link from 'next/link';
import { EditorialPage, TextSection } from './SiteChrome';
import type { EditorialEntry as Entry } from '../lib/editorialContent';

export function EditorialEntryPage({ entry, parent }: { entry: Entry; parent: 'sideboards' | 'journal' }) {
  const path = `/${parent}/${entry.slug}`;
  return <EditorialPage eyebrow={entry.eyebrow} title={entry.title} intro={entry.intro} crumbs={[{ name: parent === 'journal' ? 'Journal' : 'Sideboards', path: `/${parent}` }, { name: entry.title, path }]}>
    <div className="editorial-reading">
      {entry.sections.map(section => <TextSection key={section.title} title={section.title}>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</TextSection>)}
      <aside className="editorial-next"><p className="eyebrow">Continue exploring</p><div>{entry.related.map(link => <Link key={link.href} href={link.href}>{link.label} <span aria-hidden="true">↗</span></Link>)}</div></aside>
    </div>
    <section className="editorial-cta"><p className="eyebrow light">The collection is in development</p><h2>The right fit is coming.</h2><p>Be first to hear when our sideboards and configurator are ready.</p><Link href="/#early-access" className="button button-paper">Join early access ↗</Link></section>
  </EditorialPage>;
}
