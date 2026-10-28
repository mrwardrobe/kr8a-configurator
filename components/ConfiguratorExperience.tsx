'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Sideboard, { type SideboardView } from './Sideboard';
import ConfiguratorPanel, { Chapter } from './ConfiguratorPanel';
import { SideboardConfig, defaultSideboardConfig, designSummary, encodeConfig, illustrativePrice, normalizeConfig } from '../lib/sideboardEngine';
import { priceDesign } from '../lib/pricing';
import { readConfiguratorSession, writeDraft, SAVED_KEY, type SavedDesign } from '../lib/configuratorStorage';

const chapters: { id: Chapter; title: string }[] = [
  { id: 'size', title: 'Size' }, { id: 'fronts', title: 'Fronts' }, { id: 'inside', title: 'Inside' },
  { id: 'finish', title: 'Finish' }, { id: 'base', title: 'Base' }, { id: 'handles', title: 'Handles' },
];
const viewFor: Record<Chapter, SideboardView> = {
  size: 'three-quarter', fronts: 'front', inside: 'bay:0', finish: 'grain', base: 'base', handles: 'detail',
};
function deviceStorage() { try { return window.localStorage; } catch { return null; } }

export default function ConfiguratorExperience() {
  const [config, setConfig] = useState<SideboardConfig>(defaultSideboardConfig);
  const [chapter, setChapter] = useState<Chapter>('size');
  const [selectedBay, setSelectedBay] = useState(0);
  const [review, setReview] = useState(false);
  const [name, setName] = useState('');
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<SideboardView>('three-quarter');
  const [openAll, setOpenAll] = useState(false);
  const [dimensions, setDimensions] = useState(false);
  const [stagePad, setStagePad] = useState(0);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);
  const [draftSaved, setDraftSaved] = useState(true);
  const [panelVersion, setPanelVersion] = useState(0);
  const reviewDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const update = () => setStagePad(window.innerWidth > 900 ? Math.min(430, window.innerHeight * .48) : 0);
    update(); window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('c');
    const session = readConfiguratorSession(deviceStorage(), code);
    setConfig(session.config); setName(session.name); setSavedDesigns(session.savedDesigns); setDraftSaved(session.storageAvailable);
    if (session.invalidLink) setToast('That design link could not be opened. We started a new design.');
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    setDraftSaved(writeDraft(deviceStorage(), config, name));
    // Editing a shared design must not reload the original, stale URL on refresh.
    const url = new URL(window.location.href);
    if (url.searchParams.has('c') && url.searchParams.get('c') !== encodeConfig(config)) {
      url.searchParams.set('c', encodeConfig(config));
      window.history.replaceState(window.history.state, '', url);
    }
  }, [config, name, ready]);
  useEffect(() => {
    const dialog = reviewDialog.current;
    if (!review || !dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('.review-back')?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; };
  }, [review]);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 4200); return () => window.clearTimeout(timeout); }, [toast]);
  const set = (next: SideboardConfig) => {
    const validated = normalizeConfig(next);
    if (validated.width !== config.width && validated.fronts.length !== config.fronts.length) setToast(`Layout adjusted to ${validated.fronts.length} bays to suit this width. Review the fronts and inside.`);
    else if (config.fronts.some((front, index) => front === 'R' && validated.fronts[index] === 'D') && validated.width !== config.width) setToast('Drawer bays are too wide at this size, so they have changed to doors.');
    setConfig(validated);
    setSelectedBay(index => Math.min(index, validated.fronts.length - 1));
  };
  const chooseChapter = (next: Chapter) => { setChapter(next); setView(next === 'inside' ? `bay:${selectedBay}` : viewFor[next]); setReview(false); };
  const chooseBay = (index: number) => { setSelectedBay(index); setView(`bay:${index}`); };
  const pricing = priceDesign(config);
  const priceText = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(illustrativePrice(config));
  const link = () => `${window.location.origin}/configurator?c=${encodeConfig(config)}`;
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link()); setToast('Design link copied.'); }
    catch { setToast('Copy from the address bar to share your design.'); window.history.replaceState(window.history.state, '', `/configurator?c=${encodeConfig(config)}`); }
  };
  const save = () => {
    try {
      const list = [{ name: name.trim() || `Sideboard ${config.width}`, config, savedAt: new Date().toISOString() }, ...savedDesigns].slice(0, 20);
      const storage = deviceStorage();
      if (!storage) throw new Error('Storage unavailable');
      storage.setItem(SAVED_KEY, JSON.stringify(list));
      setSavedDesigns(list);
      setToast('Saved on this device. Copy the link to keep it elsewhere.');
    } catch { setToast('Could not save on this device. Copy the link instead.'); }
  };
  const download = () => {
    const data = { document: 'KR8A design brief', status: 'Design preview — not an approved manufacturing specification or quote', name: name.trim() || 'My KR8A', createdAt: new Date().toISOString(), config, summary: Object.fromEntries(designSummary(config)) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `kr8a-design-${config.width}mm.json`; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('Design brief downloaded.');
  };
  const reset = () => { setConfig(defaultSideboardConfig); setName(''); setSelectedBay(0); setOpenAll(false); setDimensions(false); setPanelVersion(value => value + 1); chooseChapter('size'); setToast('Started a new design.'); };
  const loadSaved = (entry: SavedDesign) => { setConfig(normalizeConfig(entry.config)); setName(entry.name); setSelectedBay(0); setOpenAll(false); setDimensions(false); setPanelVersion(value => value + 1); chooseChapter('size'); setToast('Saved design loaded.'); };
  return <main className="configurator-shell">
    <div className="config-stage"><Sideboard config={config} view={view} openAll={openAll} openBay={chapter === 'inside' && !review ? selectedBay : undefined} dimensions={dimensions} pad={stagePad} top={stagePad ? 80 : 0} onFrontClick={index => { if (chapter === 'inside') chooseBay(index); }} />
      <header className="config-topbar"><div className="config-identity"><Link href="/" className="brand">KR8A</Link><span className="identity-rule" /><div className="name-field"><span>Sideboard /</span><input aria-label="Name your sideboard" placeholder="Name your piece" value={name} maxLength={42} onChange={event => setName(event.target.value)} /></div></div><div className="config-top-actions"><span className="illustrative-top"><strong>{priceText}</strong><small>Illustrative · not a quote</small></span><button type="button" onClick={() => setReview(true)} className="button button-ink">Review design ↗</button></div></header>
      <div className="view-options" role="group" aria-label="Camera view">{([['three-quarter', '3D'], ['front', 'Front'], ['side', 'Side'], ['detail', 'Detail']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}<button type="button" aria-pressed={dimensions} onClick={() => setDimensions(value => !value)}>Dimensions</button><button type="button" aria-pressed={openAll} onClick={() => setOpenAll(value => !value)}>Open all</button></div>
      <div className="stage-hint">Drag to rotate <span>·</span> Scroll to zoom <span>·</span> Click a front to open</div>
    </div>
    <div className="config-dock"><div className="dock-head"><div><span className="eyebrow">Create your sideboard</span><h1>Every detail, yours.</h1></div><div className="dock-head-right"><span>{priceText} illustrative · final price confirmed after review</span><button className="button button-ink" type="button" onClick={() => setReview(true)}>Review design <span aria-hidden="true">↗</span></button></div></div>
      <nav className="chapter-nav" aria-label="Configuration chapters">{chapters.map((item, index) => <button type="button" key={item.id} aria-current={chapter === item.id ? 'step' : undefined} onClick={() => chooseChapter(item.id)}><small>0{index + 1}</small><span>{item.title}</span></button>)}</nav>
      <ConfiguratorPanel key={panelVersion} config={config} onChange={set} chapter={chapter} selectedBay={selectedBay} onSelectedBay={chooseBay} />
      <div className="draft-status" role="status">{ready ? draftSaved ? 'Draft saved on this device' : 'Device saving unavailable. Copy a design link to keep your design.' : 'Opening your design…'}</div>
      <div className="dock-bottom"><span>Design preview · specifications to be confirmed</span><div><button type="button" onClick={reset}>Reset</button><button type="button" onClick={copyLink}>Copy link ↗</button></div></div>
    </div>
    <dialog ref={reviewDialog} className="review-shade" aria-labelledby="review-title" onCancel={() => setReview(false)} onClick={event => { if (event.target === event.currentTarget) setReview(false); }}><aside className="review-panel"><button className="review-back" type="button" onClick={() => setReview(false)}>← Keep designing</button><div className="eyebrow">Your design / {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div><h2 id="review-title">Your KR8A.</h2><p className="review-name">{name.trim() || 'A sideboard made for your space'}</p><div className="review-drawing"><div className="review-drawing-inner">{config.fronts.map((front, index) => <div key={index} className={`review-bay review-bay-${front}`}>{front === 'R' && <><i /><i /></>}{front === 'O' && config.shelves[index] > 0 && Array.from({ length: config.shelves[index] }, (_, shelf) => <i key={shelf} className="review-shelf" style={{ top: `${(shelf + 1) / (config.shelves[index] + 1) * 100}%` }} />)}</div>)}</div><span>{config.width} mm</span></div><dl className="review-spec">{designSummary(config).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><div className="review-price"><div>{pricing.status === 'unavailable' ? priceText : new Intl.NumberFormat('en-GB', { style: 'currency', currency: pricing.currency }).format(pricing.amountPence / 100)}</div><p>{pricing.status === 'unavailable' ? 'Illustrative prototype estimate only. KR8A will confirm the final specification and price before an order is placed.' : 'Final price based on the approved production rate card.'}</p></div><div className="review-actions"><button type="button" className="button button-ink" onClick={copyLink}>Copy design link ↗</button><button type="button" onClick={save}>Save on this device</button><button type="button" onClick={download}>Download design brief</button></div><details className="saved-designs"><summary>Saved designs on this device ({savedDesigns.length})</summary>{savedDesigns.length ? savedDesigns.map((entry, index) => <button type="button" key={`${entry.savedAt}-${index}`} onClick={() => loadSaved(entry)}><strong>{entry.name}</strong><span>{entry.config.width} × {entry.config.height} × {entry.config.depth} mm</span></button>) : <p>No saved designs yet.</p>}</details><p className="review-disclaimer">The dimensions and options shown here are a design preview. Production finishes, tolerances, structural details, pricing and delivery are subject to KR8A review.</p></aside>{toast && <div className="toast" role="status">{toast}</div>}</dialog>
    {toast && !review && <div className="toast" role="status">{toast}</div>}
  </main>;
}
