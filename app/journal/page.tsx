import Link from 'next/link';
import { EditorialPage } from '../../components/SiteChrome';
import { journalArticles } from '../../lib/editorialContent';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata('Journal', 'Notes on furniture design, construction, materials and measuring your space from KR8A.', '/journal');
export default function Journal() {
  return <EditorialPage eyebrow="Ideas & details" title="The journal." intro="A closer look at the choices behind furniture that fits beautifully and works hard." crumbs={[{ name: 'Journal', path: '/journal' }]}>
    <Link className="journal-collection-link" href="/bedside-tables"><span className="eyebrow">New collection / Bedside tables</span><strong>Small in scale. Considered in every detail.</strong><span aria-hidden="true">↗</span></Link>
    <div className="journal-index">{journalArticles.map((article, index) => <Link href={`/journal/${article.slug}`} key={article.slug}><span className="eyebrow">0{index + 1} / {article.eyebrow.split(' / ')[1]}</span><h2>{article.title}</h2><p>{article.intro}</p><span aria-hidden="true">↗</span></Link>)}</div>
  </EditorialPage>;
}
