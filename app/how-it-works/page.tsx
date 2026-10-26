import Link from 'next/link';
import { EditorialPage, TextSection } from '../../components/SiteChrome';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata('How it works', 'From measuring your room to a reviewed furniture specification: how the KR8A made-to-measure sideboard journey is being developed.', '/how-it-works');
const steps = [
  ['01', 'Start with your space', 'Measure the available width, depth and height. Note doors, radiators, sockets and the space needed to move around the furniture.'],
  ['02', 'Shape the design', 'When the configurator is ready, choose from supported dimensions, front layouts, interior options and confirmed finishes.'],
  ['03', 'Review every detail', 'See a clear specification and final price before deciding to order. Prototype estimates are not an offer or a checkout price.'],
  ['04', 'Prepare for making', 'An approved order will need a checked manufacturing specification before cutting, edging and assembly preparation.'],
  ['05', 'Bring it home', 'Delivery scope, assembly instructions and any fitting requirements will be set out before checkout opens.'],
];
export default function HowItWorks() {
  return <EditorialPage eyebrow="The journey" title="From your space to your sideboard." intro="A considered piece should be straightforward to understand and order. This is the journey we are building." crumbs={[{ name: 'How it works', path: '/how-it-works' }]}>
    <ol className="process-list">{steps.map(([number, title, detail]) => <li key={number}><span className="eyebrow">{number}</span><h2>{title}</h2><p>{detail}</p></li>)}</ol>
    <TextSection title="Where we are now"><p>KR8A is in development. Orders, payment and checkout are not open. Product dimensions, materials, prices and delivery arrangements will be confirmed before a commercial launch.</p><p>Our current configurator is a prototype used to develop the experience. It is not yet an approved production specification or a way to place an order.</p></TextSection>
    <div className="editorial-link-row"><Link href="/journal/how-to-measure-for-a-sideboard">Read the measuring guide ↗</Link><Link href="/#early-access">Join early access ↗</Link></div>
  </EditorialPage>;
}
