import Link from 'next/link';
import { EditorialPage, TextSection } from '../../components/SiteChrome';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata('Meet the North London furniture maker behind KR8A', 'Discover the personal craftsmanship behind KR8A: more than 20 years of bespoke furniture experience, with every early order assembled, inspected and packaged in North London.', '/our-story');

export default function OurStory() {
  return <EditorialPage eyebrow="Meet the maker / North London" title="A furniture brand with a craftsman behind it." intro="KR8A is founded on more than 20 years of hands-on experience designing and building bespoke furniture for real homes." crumbs={[{ name: 'Our story', path: '/our-story' }]}>
    <TextSection title="Why I started KR8A">
      <p>After years of making fitted furniture, one problem kept coming back: a beautiful cabinet is no use if it is the wrong size for the room. Standard widths and depths leave awkward gaps, crowd walkways and force people to compromise.</p>
      <p>KR8A began with a simple idea: combine carefully considered contemporary furniture design with dimensions chosen for your space. We are developing sideboards and bedside tables that feel personal without making the buying process complicated.</p>
    </TextSection>
    <TextSection title="Personally assembled and checked in North London">
      <p>KR8A is a small, UK-based furniture venture, not an anonymous mass-production brand. Our plan for the first orders is personal involvement at every stage: reviewing each specification, assembling the furniture, checking the details and packaging it for delivery.</p>
      <p>Specialist suppliers will precision-cut and edge the engineered panels. Assembly and quality checks will be handled personally in North London. We believe being transparent about who does what is part of good craftsmanship.</p>
    </TextSection>
    <TextSection title="See the work, not just the finished furniture">
      <p>We plan to share real workshop videos showing how panels are joined, how drawers are fitted, how pieces are assembled and how each order is checked. These will feature the actual maker and real KR8A work, rather than stock footage.</p>
      <p>Our first collection is still being developed, so final specifications and production imagery will be published when verified. You can follow the journey as it happens.</p>
    </TextSection>
    <TextSection title="Modern materials. Traditional attention to detail.">
      <p>We are exploring premium EGGER decorative engineered boards, precision-manufactured components and quality fittings. The aim is furniture that looks beautiful, feels carefully made and fits the way people actually live.</p>
      <p>For us, made-to-measure is not just a measurement. It is a more personal way to make furniture.</p>
    </TextSection>
    <div className="editorial-link-row"><Link href="/sideboards">Explore sideboards ↗</Link><Link href="/bedside-tables">Explore bedside tables ↗</Link><Link href="/#early-access">Follow the launch ↗</Link></div>
  </EditorialPage>;
}
