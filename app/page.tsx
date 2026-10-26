import Image from 'next/image';
import Link from 'next/link';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';
import { WaitlistForm } from '../components/WaitlistForm';
import { publicSiteUrl } from '../lib/site';
import { waitlistReady } from '../lib/waitlist';

const origin = publicSiteUrl() ?? 'https://kr8a.com';
const siteSchema = {
  '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'KR8A', url: origin },
    { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'KR8A', url: origin, publisher: { '@id': `${origin}/#organization` } },
  ],
};

export default function Home() {
  const signupReady = waitlistReady();
  return <>
    <SiteHeader overlay />
    <main>
      <section className="launch-hero" aria-labelledby="hero-title">
        <div className="launch-hero-copy"><p className="eyebrow light">Furniture, on your terms</p><h1 id="hero-title">Beautiful furniture.<br /><em>Made to fit</em> your space.</h1><p>The perfect sideboard should not be almost the right size. KR8A brings considered design and made-to-measure dimensions together, so the furniture you love fits the room you live in.</p><div className="launch-hero-actions"><a href="#early-access" className="button button-paper">Join early access <span aria-hidden="true">↗</span></a><a href="#the-design">Explore the design <span aria-hidden="true">↓</span></a></div><p className="launch-status">Our first sideboard collection is in development. Orders are not open.</p></div>
        <div className="launch-hero-image"><Image src="/images/kr8a-hero-reference.png" alt="Representative sideboard image from the KR8A design prototype" fill priority sizes="(max-width: 900px) 100vw, 52vw" /><span>Design prototype visual · final product imagery to follow</span></div>
      </section>

      <section className="launch-statement" id="the-design"><p className="eyebrow">01 / The idea</p><h2>Your room is not standard.<br /><em>Why should your furniture be?</em></h2><div><p>A sideboard that is a little too wide can dominate a room. One that is too shallow may not hold what you need. One that is almost right can leave an awkward gap.</p><p>KR8A starts with the space, then lets you shape the furniture around it within a carefully engineered range.</p><Link className="text-link" href="/sideboards">Explore the sideboards <span aria-hidden="true">↗</span></Link></div></section>

      <section className="launch-image-story"><div className="launch-image-story-image"><Image src="/images/kr8a-detail-grain-reference.png" alt="Close-up reference image of a woodgrain appearance from the KR8A design prototype" fill sizes="(max-width: 900px) 100vw, 48vw" /></div><div className="launch-image-story-copy"><p className="eyebrow">02 / Surface & substance</p><h2>Beautiful finishes.<br />Modern materials.</h2><p>We plan to use carefully selected decorative engineered boards, including EGGER Feelwood finishes. Textured surfaces can bring depth and character to contemporary furniture with the consistency of precision-manufactured panels.</p><p>These are not solid oak or walnut boards. We will identify every production finish accurately before orders open.</p><Link className="text-link" href="/materials">Our materials approach <span aria-hidden="true">↗</span></Link></div></section>

      <section className="launch-cards"><div className="launch-section-heading"><p className="eyebrow">03 / A place to begin</p><h2>Space for the way you live.</h2><p>One considered design, shaped around the proportions and storage your room asks for.</p></div><div className="launch-card-grid"><Link href="/sideboards/narrow-and-shallow"><span>01 / Compact spaces</span><h3>Narrow & shallow</h3><p>Storage with room to breathe.</p><i aria-hidden="true">↗</i></Link><Link href="/sideboards/long"><span>02 / Longer lines</span><h3>Long sideboards</h3><p>A calm anchor for a broad wall.</p><i aria-hidden="true">↗</i></Link><Link href="/sideboards/with-drawers"><span>03 / Everyday order</span><h3>With drawers</h3><p>Keep the things you reach for close.</p><i aria-hidden="true">↗</i></Link></div></section>

      <section className="bedside-home-feature" aria-labelledby="bedside-home-title"><div className="bedside-home-image"><Image src="/images/kr8a-bedside-concept.png" width={1536} height={1024} quality={85} sizes="(max-width: 900px) 100vw, 58vw" alt="Design concept visualization of oak-effect bedside cabinets with drawers and open shelves beside a bed" /><span>Design concept visualization</span></div><div className="bedside-home-copy"><p className="eyebrow">New / The bedside collection</p><h2 id="bedside-home-title">A place for the little things.</h2><p>Beautiful bedside furniture should feel made for the room around it. Discover our developing collection of considered proportions, a useful drawer and open storage.</p><p>Coming soon. Orders are not yet available.</p><Link className="text-link" href="/bedside-tables">Discover bedside tables <span aria-hidden="true">↗</span></Link></div></section>

      <section className="launch-method"><div><p className="eyebrow light">04 / Built with intention</p><h2>Clever construction is part of good design.</h2></div><div><p>A great sideboard is not only about the front. It is about how the panels meet, how drawers feel and how the whole piece comes together.</p><p>We are developing precision-cut components, carefully selected hardware and considered connections. Those details are being tested before the range opens for orders.</p><Link className="text-link" href="/how-it-works">How KR8A will work <span aria-hidden="true">↗</span></Link></div></section>

      <section className="launch-image-story launch-image-story-reverse"><div className="launch-image-story-image"><Image src="/images/kr8a-detail-top-reference.png" alt="Detail image from the KR8A sideboard design prototype" fill sizes="(max-width: 900px) 100vw, 48vw" /></div><div className="launch-image-story-copy"><p className="eyebrow">05 / The reason</p><h2>One design.<br />Your proportions.</h2><p>Longer, shallower, more drawers, a different finish: those choices should feel visual and clear. Our configurator is being developed to let you explore them within manufacturing limits that will be confirmed before purchase.</p><Link className="text-link" href="/our-story">Why we started KR8A <span aria-hidden="true">↗</span></Link></div></section>

      <section className="launch-journal"><div><p className="eyebrow">The journal</p><h2>Good design starts with better questions.</h2></div><div><Link href="/journal/why-standard-sideboards-dont-fit">Why the perfect sideboard is so hard to find <span aria-hidden="true">↗</span></Link><Link href="/journal/engineered-boards-vs-solid-wood">Engineered boards and solid wood <span aria-hidden="true">↗</span></Link><Link href="/journal/how-to-measure-for-a-sideboard">How to measure for a sideboard <span aria-hidden="true">↗</span></Link><Link className="launch-all-journal" href="/journal">All journal articles ↗</Link></div></section>

      <section className="launch-signup" id="early-access"><div><p className="eyebrow light">The right fit is coming</p><h2>Be here from<br />the beginning.</h2><p>Be first to see the finished collection, confirmed finishes and the launch of our configurator.</p></div><WaitlistForm enabled={signupReady} /></section>
    </main>
    <SiteFooter />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }} />
  </>;
}
