'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sideboard from './Sideboard';
import ConfiguratorPanel, { Chapter } from './ConfiguratorPanel';
import { SideboardConfig, decodeConfig, defaultSideboardConfig, designSummary, encodeConfig, normalizeConfig } from '../lib/sideboardEngine';
import { priceDesign } from '../lib/pricing';

const chapters: { id: Chapter; title: string }[] = [
  { id: 'size', title: 'Size' }, { id: 'fronts', title: 'Fronts' }, { id: 'inside', title: 'Inside' },
  { id: 'finish', title: 'Finish' }, { id: 'base', title: 'Base' }, { id: 'handles', title: 'Handles' },
];
const viewFor: Record<Chapter, 'three-quarter' | 'front' | 'side'> = {
  size: 'three-quarter', fronts: 'front', inside: 'three-quarter', finish: 'three-quarter', base: 'side', handles: 'front',
};
type SavedDesign = { name: string; config: SideboardConfig; savedAt: string };

export default function ConfiguratorExperience() {
  const [config, setConfig] = useState<SideboardConfig>(defaultSideboardConfig);
  const [chapter, setChapter] = useState<Chapter>('size');
  const [selectedBay, setSelectedBay] = useState(0);
  const [review, setReview] = useState(false);
  const [name, setName] = useState('');
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<'three-quarter' | 'front' | 'side'>('three-quarter');
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([]);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('c');
    const shared = decodeConfig(code);
    try {
      const stored = localStorage.getItem('kr8a-current-v1');
      if (shared) setConfig(shared);
      else if (stored) setConfig(normalizeConfig(JSON.parse(stored)));
      const saved = JSON.parse(localStorage.getItem('kr8a-saved-v1') || '[]') as unknown;
      if (Array.isArray(saved)) setSavedDesigns(saved.slice(0, 20).filter(item => item && typeof item === 'object').map(item => {
        const entry = item as Record<string, unknown>;
        return { name: typeof entry.name === 'string' ? entry.name.slice(0, 42) : 'Saved sideboard', config: normalizeConfig(entry.config), savedAt: typeof entry.savedAt === 'string' ? entry.savedAt : '' };
      }));
    } catch { /* A corrupt local draft never prevents a new design. */ }
    if (code && !shared) setToast('That design link could not be opened. We started a new design.');
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem('kr8a-current-v1', JSON.stringify(config)); }, [config, ready]);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 4200); return () => window.clearTimeout(timeout); }, [toast]);
  const set = (next: SideboardConfig) => {
    setConfig(next);
    setSelectedBay(index => Math.min(index, next.fronts.length - 1));
  };
  const chooseChapter = (next: Chapter) => { setChapter(next); setView(viewFor[next]); setReview(false); };
  const pricing = priceDesign(config);
  const link = () => `${window.location.origin}/configurator?c=${encodeConfig(config)}`;
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link()); setToast('Design link copied.'); }
    catch { setToast('Copy from the address bar to share your design.'); window.history.replaceState(null, '', `/configurator?c=${encodeConfig(config)}`); }
  };
  const save = () => {
    try {
      const list = [{ name: name.trim() || `Sideboard ${config.width}`, config, savedAt: new Date().toISOString() }, ...savedDesigns].slice(0, 20);
      localStorage.setItem('kr8a-saved-v1', JSON.stringify(list));
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
  const reset = () => { setConfig(defaultSideboardConfig); setName(''); setSelectedBay(0); setReview(false); chooseChapter('size'); setToast('Started a new design.'); };
  const loadSaved = (entry: SavedDesign) => { setConfig(normalizeConfig(entry.config)); setName(entry.name); setSelectedBay(0); chooseChapter('size'); setToast('Saved design loaded.'); };
  return <main className="configurator-shell">
    <div className="config-stage"><Sideboard config={config} view={view} onFrontClick={index => { if (chapter === 'inside') setSelectedBay(index); }} />
      <header className="config-topbar"><div className="config-identity"><Link href="/" className="brand">KR8A</Link><span className="identity-rule" /><div className="name-field"><span>Sideboard /</span><input aria-label="Name your sideboard" placeholder="Name your piece" value={name} maxLength={42} onChange={event => setName(event.target.value)} /></div></div><div className="config-top-actions"><span>Designed to your dimensions</span><button type="button" onClick={() => setReview(true)} className="button button-ink">Review design ↗</button></div></header>
      <div className="stage-dimensions"><span>{config.width} <small>W</small></span><i /><span>{config.height} <small>H</small></span><i /><span>{config.depth} <small>D</small></span><em>mm</em></div>
      <div className="view-options" role="group" aria-label="Camera view">{([['three-quarter', 'Perspective'], ['front', 'Front'], ['side', 'Side']] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div>
      <div className="stage-hint">Drag to rotate <span>·</span> Scroll to zoom <span>·</span> Click a front to open</div>
    </div>
    <div className="config-dock"><div className="dock-head"><div><span className="eyebrow">Create your sideboard</span><h1>Every detail, yours.</h1></div><div className="dock-head-right"><span>Price confirmed after design review</span><button className="button button-ink" type="button" onClick={() => setReview(true)}>Review design <span aria-hidden="true">↗</span></button></div></div>
      <nav className="chapter-nav" aria-label="Configuration chapters">{chapters.map((item, index) => <button type="button" key={item.id} aria-current={chapter === item.id ? 'step' : undefined} onClick={() => chooseChapter(item.id)}><small>0{index + 1}</small><span>{item.title}</span></button>)}</nav>
      <ConfiguratorPanel config={config} onChange={set} chapter={chapter} selectedBay={selectedBay} onSelectedBay={setSelectedBay} />
      <div className="dock-bottom"><span>Design preview · specifications to be confirmed</span><div><button type="button" onClick={reset}>Reset</button><button type="button" onClick={copyLink}>Copy link ↗</button></div></div>
    </div>
    {review && <div className="review-shade" onMouseDown={event => { if (event.target === event.currentTarget) setReview(false); }}><aside className="review-panel" aria-label="Your KR8A design" role="dialog" aria-modal="true"><button className="review-back" type="button" onClick={() => setReview(false)}>← Keep designing</button><div className="eyebrow">Your design / {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div><h2>Your KR8A.</h2><p className="review-name">{name.trim() || 'A sideboard made for your space'}</p><div className="review-drawing"><div className="review-drawing-inner">{config.fronts.map((front, index) => <div key={index} className={`review-bay review-bay-${front}`}>{front === 'R' && <><i /><i /></>}{front === 'O' && <i className="review-shelf" />}</div>)}</div><span>{config.width} mm</span></div><dl className="review-spec">{designSummary(config).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><div className="review-price"><div>{pricing.status === 'unavailable' ? 'Price on enquiry' : new Intl.NumberFormat('en-GB', { style: 'currency', currency: pricing.currency }).format(pricing.amountPence / 100)}</div><p>We will confirm the final specification and price before an order is placed.</p></div><div className="review-actions"><button type="button" className="button button-ink" onClick={copyLink}>Copy design link ↗</button><button type="button" onClick={save}>Save on this device</button><button type="button" onClick={download}>Download design brief</button></div><details className="saved-designs"><summary>Saved designs on this device ({savedDesigns.length})</summary>{savedDesigns.length ? savedDesigns.map((entry, index) => <button type="button" key={`${entry.savedAt}-${index}`} onClick={() => loadSaved(entry)}><strong>{entry.name}</strong><span>{entry.config.width} × {entry.config.height} × {entry.config.depth} mm</span></button>) : <p>No saved designs yet.</p>}</details><p className="review-disclaimer">The dimensions and options shown here are a design preview. Production finishes, tolerances, structural details, pricing and delivery are subject to KR8A review.</p></aside></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
