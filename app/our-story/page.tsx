import Link from 'next/link';
import { EditorialPage, TextSection } from '../../components/SiteChrome';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata('Our story', 'Why KR8A is developing sideboards that bring considered furniture design together with made-to-measure dimensions.', '/our-story');
export default function OurStory() {
  return <EditorialPage eyebrow="The idea behind KR8A" title="Furniture should fit the way we live." intro="The right piece in the wrong size never feels quite right." crumbs={[{ name: 'Our story', path: '/our-story' }]}>
    <TextSection title="A simple frustration"><p>A cabinet can be too deep for a hallway, too short for a wall or a few centimetres away from feeling at home. We started KR8A with the ambition to bring the visual discipline of contemporary furniture together with the flexibility of made-to-measure production.</p><p>Instead of reinventing every sideboard, we are developing a considered design that can be adapted within carefully engineered limits. The aim is a clear choice of dimensions, layouts and finishes without a complicated buying process.</p></TextSection>
    <TextSection title="The details behind the surface"><p>We care about the parts you see and the parts you do not: edges, joints, drawer movement, panel fit and assembly. Those details are still being refined in our first collection.</p><p>KR8A is at the beginning of this story. We will share confirmed materials, product photography, specifications and prices when they are ready.</p></TextSection>
    <div className="editorial-link-row"><Link href="/materials">Our materials approach ↗</Link><Link href="/#early-access">Follow the launch ↗</Link></div>
  </EditorialPage>;
}
