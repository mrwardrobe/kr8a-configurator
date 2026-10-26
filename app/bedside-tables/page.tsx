import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs, SiteFooter, SiteHeader } from '../../components/SiteChrome';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata(
  'Made-to-measure bedside tables',
  'Discover the developing KR8A bedside-table collection: considered dimensions, a drawer and open storage, and premium decorative finishes. Coming soon.',
  '/bedside-tables',
);

export default function BedsideTables() {
  return <>
    <SiteHeader />
    <main className="bedside-page">
      <section className="bedside-hero" aria-labelledby="bedside-title">
        <Breadcrumbs items={[{ name: 'Bedside tables', path: '/bedside-tables' }]} />
        <div className="bedside-hero-grid">
          <div>
            <p className="eyebrow light">The bedside collection</p>
            <h1 id="bedside-title">Beautiful bedside tables. <em>Made to fit your space.</em></h1>
          </div>
          <div className="bedside-hero-support">
            <p>A bedside table should feel like it belongs in your room, not simply fit beside your bed.</p>
            <p>KR8A brings considered design, made-to-measure dimensions and premium finishes together, creating bedside furniture tailored to the way you live.</p>
            <p>From narrow spaces to perfectly proportioned bedside storage, every millimetre matters.</p>
            <div className="bedside-hero-actions"><Link className="button button-paper" href="/#early-access">Join early access <span aria-hidden="true">↗</span></Link><a href="#collection">Discover the collection <span aria-hidden="true">↓</span></a></div>
            <small>Coming soon · Ordering is not yet available</small>
          </div>
        </div>
      </section>

      <figure className="bedside-concept-image">
        <Image src="/images/kr8a-bedside-concept.png" width={1536} height={1024} priority quality={88} sizes="100vw" alt="Design concept visualization of two oak-effect bedside cabinets beside a bed, each with an upper drawer, brass-coloured handle and open compartment, against dark green panelled walls" />
        <figcaption>Design concept visualization · Final product details and finishes to be confirmed</figcaption>
      </figure>

      <section className="bedside-intro" id="collection">
        <p className="eyebrow">01 / A collection in the making</p>
        <h2>Small in scale.<br /><em>Considered in every detail.</em></h2>
        <div><p>The bedside is one of the most personal parts of a room. It needs to sit comfortably beside the bed, leave space to move and hold the things you reach for without demanding attention.</p><p>Our first concept pairs an upper drawer with an open compartment beneath. It is a calm, useful starting point for furniture shaped around your room.</p></div>
      </section>

      <section className="bedside-feature-grid" aria-label="Collection approach">
        <article><span className="eyebrow">02 / Proportions</span><h2>Designed around your space.</h2><p>Not every bedroom has room for standard-sized furniture. A narrow bedside table can make more sense beside a larger bed or in a compact room, while a little extra width can provide more useful storage where space allows.</p><p>We are developing supported dimensions that consider the bed, available floor space and storage needs together. Exact sizes will be confirmed before orders open.</p></article>
        <article><span className="eyebrow">03 / Storage</span><h2>Storage, beautifully considered.</h2><p>A clean upper drawer keeps everyday essentials close. The open compartment beneath gives books or other items a place to live without making the cabinet feel visually heavy.</p><p>The concept has side panels that extend to the floor and a low, recessed plinth. Drawer travel, internal clearances and hardware will be validated as the design is developed.</p></article>
      </section>

      <section className="bedside-materials">
        <div><span className="eyebrow light">04 / Surface & substance</span><h2>Premium materials.<br />Clearly described.</h2></div>
        <div><p>We intend to offer selected EGGER decorative board finishes, including Feelwood options with textured woodgrain appearances. These engineered furniture boards can provide consistent surfaces for precisely made panels; they are not solid oak or walnut.</p><p>The image above is an oak-effect design visualization, not an exact production finish. Final manufacturer references, matching edges, sample availability and care guidance will be confirmed before ordering.</p><Link className="text-link" href="/materials">Read about our materials <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section className="bedside-details">
        <div><span className="eyebrow">05 / The considered detail</span><h2>Quietly precise.</h2></div>
        <div className="bedside-detail-list">
          <div><span>01</span><h3>Panel-led form</h3><p>The concept is drawn around 18 mm panel construction, with side panels running to the floor and a low, recessed plinth. Final engineering remains subject to prototype review.</p></div>
          <div><span>02</span><h3>Edges & surfaces</h3><p>Panel edges deserve the same attention as the broad surfaces. We are refining the finish and edging combinations before naming production specifications.</p></div>
          <div><span>03</span><h3>Drawer & handle</h3><p>The visualization shows one upper drawer with a brass-coloured handle. Handle materials, drawer hardware and performance will be specified only after testing and supplier confirmation.</p></div>
        </div>
      </section>

      <section className="bedside-close"><span className="eyebrow light">A better bedside is coming</span><h2>Made for the<br />room it lives in.</h2><p>Be first to see confirmed dimensions, finishes and the finished KR8A bedside collection.</p><Link className="button button-paper" href="/#early-access">Join early access <span aria-hidden="true">↗</span></Link><small>Collection in development · No orders or payments are being taken</small></section>
    </main>
    <SiteFooter />
  </>;
}
