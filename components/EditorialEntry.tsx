import Link from 'next/link';
import { EditorialPage, TextSection } from './SiteChrome';
import type { EditorialEntry as Entry } from '../lib/editorialContent';
import { publicSiteUrl } from '../lib/site';

function renderEditorialLinks(paragraph: string) {
  return paragraph.split(/(\[[^\]]+\]\(\/[^)]+\))/g).map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\((\/[^)]+)\)$/);
    return match ? <Link key={index} href={match[2]}>{match[1]}</Link> : part;
  });
}

export function EditorialEntryPage({ entry, parent }: { entry: Entry; parent: 'sideboards' | 'journal' }) {
  const path = `/${parent}/${entry.slug}`;
  const origin = publicSiteUrl() ?? 'https://kr8a.com';
  const articleJson = parent === 'journal' ? {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: entry.title, description: entry.description, inLanguage: 'en-GB',
    mainEntityOfPage: new URL(path, origin).toString(),
    author: { '@type': 'Organization', name: 'KR8A', url: origin },
    publisher: { '@type': 'Organization', name: 'KR8A', url: origin },
    isAccessibleForFree: true,
    ...(entry.sources ? { citation: entry.sources.map(source => source.href) } : {}),
  } : null;
  return <EditorialPage eyebrow={entry.eyebrow} title={entry.title} intro={entry.intro} crumbs={[{ name: parent === 'journal' ? 'Journal' : 'Sideboards', path: `/${parent}` }, { name: entry.title, path }]}>
    {articleJson && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJson) }} />}
    <div className="editorial-reading">
      {entry.sections.map(section => <TextSection key={section.title} title={section.title}>{section.paragraphs.map(paragraph => <p key={paragraph}>{renderEditorialLinks(paragraph)}</p>)}</TextSection>)}
      {entry.sources && <section className="editorial-sources" aria-labelledby="editorial-sources-heading"><p className="eyebrow">References</p><h2 id="editorial-sources-heading">Sources & further reading</h2><ol>{entry.sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label} <span aria-hidden="true">↗</span></a></li>)}</ol><p>Sources explain the materials and methods discussed; they do not indicate a supplier endorsement of KR8A or certify a KR8A product.</p></section>}
      <aside className="editorial-next"><p className="eyebrow">Continue exploring</p><div>{entry.related.map(link => <Link key={link.href} href={link.href}>{link.label} <span aria-hidden="true">↗</span></Link>)}</div></aside>
    </div>
    <section className="editorial-cta"><p className="eyebrow light">The collections are in development</p><h2>The right fit is coming.</h2><p>Be first to hear when KR8A confirms its sideboard and bedside collections.</p><Link href="/#early-access" className="button button-paper">Join early access ↗</Link></section>
  </EditorialPage>;
}
