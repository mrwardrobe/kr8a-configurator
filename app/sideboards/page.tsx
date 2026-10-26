import Link from 'next/link';
import { EditorialPage, TextSection } from '../../components/SiteChrome';
import { sideboardPages } from '../../lib/editorialContent';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata('Made-to-measure sideboards', 'Explore the developing KR8A sideboard collection: thoughtful dimensions, flexible storage and decorative engineered-board finishes. Coming soon.', '/sideboards');
export default function Sideboards() {
  return <EditorialPage eyebrow="The first collection" title="A sideboard for the space you have." intro="Considered furniture with room for your proportions, storage and finish choices. Our first collection is being refined now." crumbs={[{ name: 'Sideboards', path: '/sideboards' }]}>
    <div className="editorial-feature-grid">{sideboardPages.map((page, index) => <Link className="editorial-feature-card" href={`/sideboards/${page.slug}`} key={page.slug}><span className="eyebrow">0{index + 1} / Explore</span><h2>{page.title}</h2><p>{page.intro}</p><span className="feature-arrow" aria-hidden="true">↗</span></Link>)}</div>
    <TextSection eyebrow="Made for the room" title="Designed within considered limits"><p>Made-to-measure should mean a better fit, not an untested promise of every possible size. We are developing a furniture system where dimensions, front layouts, interiors and finishes work together within confirmed manufacturing rules.</p><p>Exact supported sizes, material references, production prices and delivery details will be published before orders open. The current configurator remains a development prototype.</p></TextSection>
    <div className="editorial-link-row"><Link href="/materials">Discover the materials <span aria-hidden="true">↗</span></Link><Link href="/how-it-works">See how it will work <span aria-hidden="true">↗</span></Link></div>
  </EditorialPage>;
}
