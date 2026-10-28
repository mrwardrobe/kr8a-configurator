'use client';

import { useEffect, useId, useState } from 'react';
import { BASES, FINISHES, HANDLES, INTERIORS, LIMITS, PATTERNS, Front, Inside, SideboardConfig, bayOptions, bayWidth, frontAllowed, frontName, innerDrawersAllowed, normalizeConfig } from '../lib/sideboardEngine';

export type Chapter = 'size' | 'fronts' | 'inside' | 'finish' | 'base' | 'handles';
type Props = { config: SideboardConfig; onChange: (config: SideboardConfig) => void; chapter: Chapter; selectedBay: number; onSelectedBay: (index: number) => void };

function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return <div className="panel-section-label"><span>{number}</span>{children}</div>;
}
function Dimension({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const parsed = Number(draft);
    const next = draft.trim() && Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.round(parsed / step) * step)) : value;
    setDraft(String(next)); onChange(next);
  };
  return <div className="dimension-control"><span><label htmlFor={id}><strong>{label}</strong></label><span><input id={id} type="number" inputMode="numeric" min={min} max={max} step={step} value={draft} onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} aria-label={`${label} in millimetres, type a value`} /> <small>mm</small></span></span><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} aria-label={`${label} in millimetres`} /><span className="range-endpoints"><small>{min} mm</small><small>{max} mm</small></span></div>;
}

export default function ConfiguratorPanel({ config, onChange, chapter, selectedBay, onSelectedBay }: Props) {
  const [wall, setWall] = useState('');
  const [fitMessage, setFitMessage] = useState('');
  const [clearance, setClearance] = useState(50);
  const set = (patch: Partial<SideboardConfig>) => onChange(normalizeConfig({ ...config, ...patch }));
  const setArray = <K extends 'fronts' | 'inside' | 'shelves'>(key: K, index: number, value: SideboardConfig[K][number]) => {
    const next = [...config[key]]; (next[index] as SideboardConfig[K][number]) = value; set({ [key]: next });
  };
  const fitWall = () => {
    const width = Number(wall);
    if (!Number.isFinite(width) || width < LIMITS.width.min + clearance * 2) { setFitMessage('This wall is below the current prototype width. Please review the size with KR8A.'); return; }
    const proposed = Math.floor((width - 2 * clearance) / 10) * 10;
    const fitted = Math.min(LIMITS.width.max, proposed);
    set({ width: fitted });
    setFitMessage(`${fitted} mm design · ${(width - fitted) / 2} mm free on each side.`);
  };
  const available = bayOptions(config.width);
  const selected = Math.min(selectedBay, config.fronts.length - 1);
  return <div className="config-panel-content">
    {chapter === 'size' && <div className="panel-layout size-layout">
      <div><SectionLabel number="01 /">Set your dimensions</SectionLabel><h2>Made to fit.</h2><p>Type a measurement or use the sliders. Values round to the nearest 10 mm within the ranges shown. Height includes the base.</p></div>
      <div className="dimension-stack"><Dimension label="Width" value={config.width} {...LIMITS.width} onChange={width => set({ width })} /><Dimension label="Height" value={config.height} {...LIMITS.height} onChange={height => set({ height })} /><Dimension label="Depth" value={config.depth} {...LIMITS.depth} onChange={depth => set({ depth })} /></div>
      <div className="wall-fit-mini"><SectionLabel number="/">Fit to your wall</SectionLabel><label className="mini-input"><span>Wall or alcove width</span><span><input value={wall} inputMode="numeric" onChange={event => { setWall(event.target.value.replace(/[^0-9]/g, '').slice(0, 5)); setFitMessage(''); }} aria-label="Wall width in millimetres" placeholder="e.g. 2380" /> mm</span></label><div className="mini-choices">{[20, 50, 100].map(value => <button key={value} type="button" aria-pressed={clearance === value} onClick={() => { setClearance(value); setFitMessage(''); }}>{value} mm</button>)}</div><button className="text-link" type="button" onClick={fitWall}>Draw to fit →</button><p className="fit-status" role="status">{fitMessage || 'Choose breathing room on each side.'}</p></div>
    </div>}

    {chapter === 'fronts' && <div className="panel-layout"><div><SectionLabel number="02 /">Arrange the fronts</SectionLabel><h2>Find your rhythm.</h2><p>Bay widths respond to the overall width. Choose doors, drawer stacks or open spaces.</p></div><div className="panel-main"><div className="option-title">Number of bays <small>{Math.round(bayWidth(config.width, config.fronts.length))} mm per bay</small></div><div className="choice-row">{[2, 3, 4].map(count => <button key={count} className="option-card" aria-pressed={config.fronts.length === count} disabled={!available.includes(count)} title={!available.includes(count) ? 'Outside the current bay width range at this size' : undefined} onClick={() => set({ fronts: Array(count).fill('D'), inside: Array(count).fill('S'), shelves: Array(count).fill(1) })}><span className="bay-symbol">{Array.from({ length: count }, (_, index) => <i key={index} />)}</span><strong>{count} bays</strong></button>)}</div><div className="option-title front-title">Starting arrangements</div><div className="preset-row">{PATTERNS[config.fronts.length].map(pattern => <button key={pattern} type="button" aria-pressed={config.fronts.join('') === pattern} disabled={pattern.includes('R') && !frontAllowed(config, 'R')} onClick={() => set({ fronts: pattern.split('') as Front[] })}>{(pattern.split('') as Front[]).map(frontName).join(' · ')}</button>)}</div><div className="option-title front-title">Front for each bay</div><div className="front-bay-grid">{config.fronts.map((front, index) => <div key={index} className="front-bay-control"><span>Bay {index + 1}</span><select value={front} aria-label={`Front for bay ${index + 1}`} onChange={event => setArray('fronts', index, event.target.value as Front)}><option value="D">Door</option><option value="R" disabled={!frontAllowed(config, 'R')}>Three drawers</option><option value="O">Open</option></select></div>)}</div><small className="panel-note">Drawers need a bay no wider than 620 mm and at least 400 mm of carcass height in this design preview.</small></div></div>}

    {chapter === 'inside' && <div className="panel-layout"><div><SectionLabel number="03 /">Consider the inside</SectionLabel><h2>Room for more.</h2><p>Choose a bay, then shape the storage behind its front.</p></div><div className="panel-main"><div className="option-title">Choose a bay</div><div className="bay-tabs">{config.fronts.map((front, index) => <button key={index} type="button" aria-pressed={selected === index} onClick={() => onSelectedBay(index)}><span>0{index + 1}</span><strong>{frontName(front)}</strong></button>)}</div>{config.fronts[selected] === 'R' ? <p className="panel-note">This bay has three drawers. Change its front to select another internal layout.</p> : <><div className="option-title front-title">Fit out bay {selected + 1}</div><div className="inside-options">{([['S', 'Adjustable shelves', 'Move with your collection'], ['I', 'Inner drawers', 'Extra organisation behind a door'], ['V', 'Record dividers', 'Keep records upright']] as const).map(([id, title, note]) => <button type="button" key={id} aria-pressed={config.inside[selected] === id} disabled={id === 'I' && !innerDrawersAllowed(config, selected)} onClick={() => setArray('inside', selected, id as Inside)}><span className="radio-dot" /><span><strong>{title}</strong><small>{note}</small></span></button>)}</div>{config.inside[selected] !== 'V' && <div className="shelf-stepper"><span>{config.inside[selected] === 'I' ? 'Additional shelf' : 'Number of shelves'}</span><div><button type="button" aria-label="Fewer shelves" disabled={config.shelves[selected] === 0} onClick={() => setArray('shelves', selected, Math.max(0, config.shelves[selected] - 1))}>−</button><strong>{config.shelves[selected]}</strong><button type="button" aria-label="More shelves" disabled={config.shelves[selected] >= (config.inside[selected] === 'I' ? 1 : 3)} onClick={() => setArray('shelves', selected, Math.min(config.inside[selected] === 'I' ? 1 : 3, config.shelves[selected] + 1))}>+</button></div></div>}</>}<div className="shelf-position"><label htmlFor="shelf-position">Shelf position <strong>{config.shelfPosition > 0 ? '+' : ''}{config.shelfPosition}%</strong></label><input id="shelf-position" type="range" min="-50" max="50" step="10" value={config.shelfPosition} onChange={event => set({ shelfPosition: Number(event.target.value) })} /></div><label className="light-toggle"><input type="checkbox" checked={config.light} onChange={event => set({ light: event.target.checked })} /> Interior light <small>Design exploration</small></label></div></div>}

    {chapter === 'finish' && <div className="panel-layout"><div><SectionLabel number="04 /">Choose a finish</SectionLabel><h2>Material matters.</h2><p>Explore wood effects and solid colours on decorative furniture board. EGGER finish codes and physical samples are still being confirmed.</p></div><div className="panel-main"><div className="option-title">Exterior</div><div className="finish-choices">{FINISHES.map(item => <button key={item.id} type="button" aria-pressed={config.finish === item.id} onClick={() => set({ finish: item.id })}><span className={`finish-chip ${item.grain ? 'grain-surface' : ''}`} style={{ backgroundColor: item.color }} /><strong>{item.name}</strong><small>{item.family}</small></button>)}</div><div className="option-title front-title">Interior</div><div className="interior-choices">{INTERIORS.map(item => <button key={item.id} type="button" aria-pressed={config.interior === item.id} onClick={() => set({ interior: item.id })}>{item.name}</button>)}</div></div></div>}

    {chapter === 'base' && <div className="panel-layout"><div><SectionLabel number="05 /">Set the stance</SectionLabel><h2>How it meets the room.</h2><p>A subtle change of base gives the whole piece a different posture.</p></div><div className="panel-main"><div className="choice-row base-choices">{BASES.map(item => <button key={item.id} type="button" className="option-card" aria-pressed={config.base === item.id} onClick={() => set({ base: item.id })}><span className={`base-symbol base-symbol-${item.id}`} /><strong>{item.name}</strong><small>{item.note}</small></button>)}</div><p className="panel-note">Floating installation needs a wall and fixing review before manufacture.</p></div></div>}

    {chapter === 'handles' && <div className="panel-layout"><div><SectionLabel number="06 /">The finishing touch</SectionLabel><h2>Open beautifully.</h2><p>Choose the gesture you want to use every day.</p></div><div className="panel-main"><div className="choice-row handle-choices">{HANDLES.map(item => <button key={item.id} type="button" className="option-card" aria-pressed={config.handle === item.id} onClick={() => set({ handle: item.id })}><span className={`handle-symbol handle-symbol-${item.id}`} /><strong>{item.name}</strong><small>{item.note}</small></button>)}</div><p className="panel-note">Hardware specification is subject to final construction review.</p></div></div>}
  </div>;
}
