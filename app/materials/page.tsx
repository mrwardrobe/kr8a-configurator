import Link from 'next/link';
import { EditorialPage, TextSection } from '../../components/SiteChrome';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata('Materials & finishes', 'Learn how KR8A is selecting decorative engineered boards, including EGGER Feelwood, for its developing furniture collections.', '/materials');
export default function Materials() {
  return <EditorialPage eyebrow="Materials / The considered surface" title="Modern materials, carefully chosen." intro="The material matters. So does being clear about exactly what it is." crumbs={[{ name: 'Materials', path: '/materials' }]}>
    <div className="editorial-swatch-band" aria-hidden="true"><span /><span /><span /><span /></div>
    <TextSection title="A foundation for precise furniture"><p>Premium furniture is shaped by proportion, detail and suitability, not by insisting every surface is solid wood. Decorative engineered panels offer consistent surfaces for panel construction and a broad palette of finishes.</p><p>Selected KR8A designs are planned around EGGER decorative boards, including Feelwood finishes with textured woodgrain appearances. These are engineered wood-based panels with decorative surfaces, not solid oak or walnut.</p></TextSection>
    <TextSection title="Specified, not guessed"><p>We will identify each production finish by its exact manufacturer reference and provide accurate imagery and samples where practical. The current website imagery is from supplied design concepts; it is not a verified photograph of a finished KR8A product or a particular board.</p><p>Surface, edging, joints, hardware and care all contribute to the result. We are still confirming the final finish range and care guidance before orders open.</p></TextSection>
    <div className="editorial-link-row"><Link href="/journal/engineered-boards-vs-solid-wood">Read the material comparison ↗</Link><Link href="/sideboards">Explore sideboards ↗</Link><Link href="/bedside-tables">Explore bedside tables ↗</Link></div>
  </EditorialPage>;
}
