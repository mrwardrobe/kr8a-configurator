'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import LazySideboard from '../components/LazySideboard';
import Image from 'next/image';
import { BASES, FINISHES, LIMITS, SideboardConfig, defaultSideboardConfig, encodeConfig, finishName, normalizeConfig } from '../lib/sideboardEngine';

const starters: { name: string; config: SideboardConfig; note: string }[] = [
  { name: 'Two metre oak', config: normalizeConfig({ ...defaultSideboardConfig, fronts: ['D', 'D', 'D', 'D'] }), note: 'Warm and quietly versatile' },
  { name: 'Walnut, drawers at the centre', config: normalizeConfig({ ...defaultSideboardConfig, width: 1800, height: 720, fronts: ['D', 'R', 'D'], finish: 'walnut', base: 'timber' }), note: 'A richer, lighter silhouette' },
  { name: 'Deep green, low and long', config: normalizeConfig({ ...defaultSideboardConfig, width: 2200, height: 650, depth: 400, fronts: ['D', 'R', 'R', 'D'], finish: 'green', base: 'metal', handle: 'bar' }), note: 'A considered statement' },
];
const facts = [
  ['Fronts', 'Doors, drawer stacks or open bays, arranged around the proportions of your piece.'],
  ['Inside', 'Adjustable shelves, inner drawers or dividers for records.'],
  ['Hardware', 'Choose how the fronts open; final hardware specification is reviewed with you.'],
  ['Base', BASES.map(item => item.name.toLowerCase()).join(', ') + '.'],
];
const faqs = [
  ['Can I choose the exact size?', 'You can design in 10 mm increments within the current prototype range. Every final dimension is reviewed before production.'],
  ['Is the price final?', 'Pricing is being finalised. Your design can be saved and shared now; we will confirm the complete specification and price before an order is placed.'],
  ['Can I see a sample?', 'Sample availability and the production finish range are still being confirmed.'],
  ['How long does delivery take?', 'Lead times and delivery areas will be confirmed before ordering.'],
];

function ProductDrawing({ config }: { config: SideboardConfig }) {
  const finish = FINISHES.find(item => item.id === config.finish)!;
  return <div className="product-drawing" style={{ '--product-color': finish.color } as React.CSSProperties} aria-hidden="true">
    <div className="product-drawing-top" />
    <div className="product-drawing-front">
      {config.fronts.map((front, index) => <div className={`drawing-bay drawing-${front}`} key={index}>
        {front === 'R' && <><span /><span /></>}
        {front === 'O' && <span className="drawing-shelf" />}
      </div>)}
    </div>
    <div className={`drawing-base drawing-base-${config.base}`} />
  </div>;
}

export default function Home() {
  const [wall, setWall] = useState('2380');
  const [gap, setGap] = useState(50);
  const wallNumber = Number(wall);
  const result = useMemo(() => {
    if (!wallNumber || wallNumber < 100) return { width: defaultSideboardConfig.width, message: 'Enter a wall width to begin.', valid: false };
    const target = Math.floor((wallNumber - 2 * gap) / 10) * 10;
    const width = Math.max(LIMITS.width.min, Math.min(LIMITS.width.max, target));
    const clearance = Math.round((wallNumber - width) / 2);
    if (target < LIMITS.width.min) return { width, message: `The narrowest design shown is ${LIMITS.width.min} mm. This wall needs a closer review.`, valid: false };
    if (target > LIMITS.width.max) return { width, message: `${width} mm is the widest prototype design, leaving ${clearance} mm either side.`, valid: true };
    return { width, message: `${width} mm, drawn for your space. ${clearance} mm either side.`, valid: true };
  }, [wallNumber, gap]);
  const wallConfig = normalizeConfig({ ...defaultSideboardConfig, width: result.width, fronts: ['D', 'D', 'D', 'D'] });

  return <div className="site-home">
    <header className="home-header">
      <Link className="brand brand-light" href="/" aria-label="KR8A home">KR8A</Link>
      <nav aria-label="Primary navigation" className="home-nav">
        <a href="#wall">Fit to your wall</a><a href="#range">Sideboards</a><a href="#materials">Materials</a>
        <Link href="/configurator" className="button button-paper">Design yours</Link>
      </nav>
    </header>
    <main id="top">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow light">Furniture shaped by your space</div>
          <h1 id="hero-title">Made for<br />your wall.</h1>
          <p>A sideboard shaped to your wall, considered down to the millimetre and designed by you.</p>
          <div className="hero-actions"><Link href="/configurator" className="button button-paper">Design yours <span aria-hidden="true">↗</span></Link><a href="#wall">Fit one to your wall <span aria-hidden="true">↘</span></a></div>
          <div className="hero-footnote">Designed to your specification <span className="dot" /> Pricing confirmed before order</div>
        </div>
        <div className="hero-image"><Image src="/images/kr8a-hero-provisional.jpg" alt="Concept image of a natural oak sideboard against a deep green wall with a lamp and orchid" fill priority sizes="(max-width: 900px) 100vw, 51vw" className="hero-photo" />
          <div className="hero-image-note">An invitation to make it yours <span>01 / 03</span></div>
        </div>
      </section>

      <section id="wall" className="wall-section" aria-labelledby="wall-title">
        <div className="wall-copy section-copy">
          <div className="eyebrow">01 / Start with your space</div>
          <h2 id="wall-title">How wide is<br />your wall?</h2>
          <p>Enter the width of the wall or alcove. We will draw a sideboard to fit, with the breathing room you choose.</p>
          <label className="wall-input"><input value={wall} inputMode="numeric" pattern="[0-9]*" onChange={event => setWall(event.target.value.replace(/[^0-9]/g, '').slice(0, 5))} aria-label="Wall width in millimetres" /><span>mm</span></label>
          <div className="gap-options" role="group" aria-label="Space either side">
            {([['Tight', 20], ['Balanced', 50], ['Generous', 100]] as const).map(([label, value]) => <button type="button" key={value} aria-pressed={gap === value} onClick={() => setGap(value)}><strong>{label}</strong><span>{value} mm each side</span></button>)}
          </div>
          <p className="wall-result" role="status">{result.message}</p>
          {result.valid && <Link className="button button-ink" href={`/configurator?c=${encodeConfig(wallConfig)}`}>Continue with this width <span aria-hidden="true">↗</span></Link>}
          <small>Available dimensions and construction details are provisional until reviewed.</small>
        </div>
        <div className="wall-view"><LazySideboard config={wallConfig} /><div className="view-caption"><span>Drawn to your wall</span><span>{result.width} × {wallConfig.height} × {wallConfig.depth} mm</span></div></div>
      </section>

      <section id="range" className="range-section" aria-labelledby="range-title">
        <div className="section-head"><div><div className="eyebrow">02 / A place to begin</div><h2 id="range-title">Start from one of these.</h2></div><p>Each design opens in the configurator, ready to make your own. Every dimension remains yours to change.</p></div>
        <div className="starter-grid">{starters.map((item, index) => <Link key={item.name} className="starter-card" href={`/configurator?c=${encodeConfig(item.config)}`}>
          <div className={`starter-art starter-art-${index}`}><ProductDrawing config={item.config} /><span className="starter-number">0{index + 1} / 03</span></div>
          <div className="starter-info"><div><h3>{item.name}</h3><p>{item.note}</p><small>{item.config.width} × {item.config.height} × {item.config.depth} mm · {finishName(item.config.finish)}</small></div><span className="starter-arrow" aria-hidden="true">↗</span></div>
        </Link>)}</div>
      </section>

      <section className="inside-section" aria-labelledby="inside-title">
        <div className="inside-art"><div className="inside-art-frame"><ProductDrawing config={normalizeConfig({ ...defaultSideboardConfig, fronts: ['O', 'D', 'D', 'O'], finish: 'walnut' })} /></div><div className="art-caption">Every bay has a purpose. You decide what it is.</div></div>
        <div className="inside-copy section-copy"><div className="eyebrow">03 / More than the outside</div><h2 id="inside-title">Open the doors.<br />Make room for life.</h2><p>From the arrangement of the fronts to the fit-out behind them, the details follow the way you live.</p><dl>{facts.map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl><Link href="/configurator" className="text-link">Explore the configurator <span aria-hidden="true">↗</span></Link></div>
      </section>

      <section id="materials" className="materials-section" aria-labelledby="materials-title"><div className="section-head"><div><div className="eyebrow">04 / Materials & mood</div><h2 id="materials-title">The finish changes everything.</h2></div><p>Explore the palette in your design. Displayed finishes are visual studies; production materials and samples will be confirmed with you.</p></div>
        <div className="finish-grid">{FINISHES.map(item => <div className="finish-card" key={item.id}><div className={`finish-surface ${item.grain ? 'grain-surface' : ''}`} style={{ backgroundColor: item.color }} /><div><strong>{item.name}</strong><span>{item.family}</span></div></div>)}</div>
      </section>
      <section className="closing-section"><div className="eyebrow light">A piece worth keeping</div><h2>Space made<br />personal.</h2><p>Begin with the room. Shape every detail. Keep the design in a link you can return to.</p><Link href="/configurator" className="button button-paper">Design your sideboard <span aria-hidden="true">↗</span></Link></section>
      <section className="faq-section" aria-labelledby="faq-title"><div><div className="eyebrow">The practical details</div><h2 id="faq-title">Good questions.</h2></div><div>{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="site-footer"><Link href="/" className="brand">KR8A</Link><p>Furniture made for the room it lives in.</p><Link href="/configurator">Design yours ↗</Link><small>© {new Date().getFullYear()} KR8A · Design preview</small></footer>
  </div>;
}
