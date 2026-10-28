'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { approveOrder, designFromInput, hardwareIssues, isReviewed, materialTotals, MAX_HARDWARE, MAX_PANELS, newHardware, newOrderJob, newPanel, ORDER_STORAGE_KEY, orderCsv, orderIssues, panelIssues, parseOrderBackup, REVIEW_ITEMS, reviseJob, seedFromDesign, workspaceBackup, type HardwarePart, type OrderJob, type PanelPart } from '../../lib/componentOrders';
import PartSketch from './PartSketch';

const uid = () => crypto.randomUUID();
const numeric = (value: string) => Number.isFinite(Number(value)) ? Number(value) : 0;
function download(name: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="owner-field"><span>{label}</span>{children}</label>; }

export default function ComponentOrderWorkspace() {
  const [jobs, setJobs] = useState<OrderJob[]>([]);
  const [active, setActive] = useState('');
  const [selected, setSelected] = useState('');
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(true);
  const [notice, setNotice] = useState('');
  const [designInput, setDesignInput] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<OrderJob[] | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const backupUpload = useRef<HTMLInputElement>(null);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const skipPersist = useRef(false);
  const job = jobs.find(j => j.id === active) ?? jobs[0];
  const part = job?.panels.find(p => p.id === selected);
  const hardware = job?.hardware.find(p => p.id === selected);

  useEffect(() => {
    let initial: OrderJob[] = [];
    try {
      const data = localStorage.getItem(ORDER_STORAGE_KEY);
      if (data) initial = parseOrderBackup(data);
    } catch { skipPersist.current = true; setSaved(false); setNotice('Stored data could not be opened. It has not been overwritten. Download backups regularly.'); }
    if (!initial.length) initial = [newOrderJob(crypto.randomUUID())];
    setJobs(initial); setActive(initial[0].id); setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || skipPersist.current) return;
    try { localStorage.setItem(ORDER_STORAGE_KEY, workspaceBackup(jobs)); setSaved(true); }
    catch { setSaved(false); }
  }, [jobs, ready]);

  const replace = (next: OrderJob) => { skipPersist.current = false; setJobs(current => current.map(j => j.id === next.id ? next : j)); };
  const change = (patch: Partial<OrderJob>) => { if (job) replace(reviseJob(job, patch)); };
  const selectPart = (id: string) => { setSelected(id); requestAnimationFrame(() => editorHeading.current?.focus()); };
  const addJob = (next: OrderJob) => {
    if (jobs.length >= 30) { setNotice('The workspace holds up to 30 projects. Export a backup before starting a separate workspace.'); return; }
    skipPersist.current = false; setJobs(current => [next, ...current]); setActive(next.id); setSelected(next.panels[0]?.id ?? ''); setNotice('New project created.');
  };
  const patchPanel = (patch: Partial<PanelPart>) => { if (job && part) change({ panels: job.panels.map(p => p.id === part.id ? { ...p, ...patch, verified: 'verified' in patch ? Boolean(patch.verified) : false } : p) }); };
  const patchHardware = (patch: Partial<HardwarePart>) => { if (job && hardware) change({ hardware: job.hardware.map(p => p.id === hardware.id ? { ...p, ...patch, verified: 'verified' in patch ? Boolean(patch.verified) : false } : p) }); };
  const importDesign = (value = designInput) => {
    const config = designFromInput(value);
    if (!config) { setImportError('Paste a valid KR8A design link / K3 code, or choose a downloaded KR8A design brief JSON file.'); return; }
    addJob(seedFromDesign(config, uid())); setDesignInput(''); setImportError(''); setImporting(false);
  };
  const fileInput = async (file: File | undefined, backup: boolean) => {
    if (!file) return;
    if (file.size > 2_000_000) { setImportError('Choose a file smaller than 2 MB.'); return; }
    try {
      const data = await file.text();
      if (backup) { setPendingBackup(parseOrderBackup(data)); setImportError(''); }
      else importDesign(data);
    } catch { setImportError('The file could not be read. Choose a valid KR8A JSON export.'); }
  };
  const restoreBackup = () => {
    if (!pendingBackup) return;
    // Restoring a backup makes a new local workspace; nothing is sent to a server.
    skipPersist.current = false; setJobs(pendingBackup.length ? pendingBackup : [newOrderJob(uid())]);
    setActive(pendingBackup[0]?.id ?? ''); setSelected(''); setPendingBackup(null); setNotice('Backup restored. Every imported component and project needs a fresh review.');
  };
  if (!ready || !job) return <main className="owner-workspace"><p role="status">Opening your component workspace…</p></main>;
  const totals = materialTotals(job);
  const issues = orderIssues(job);
  const reviewed = isReviewed(job);
  const totalPanels = totals.reduce((sum, g) => sum + g.pieces, 0);
  const incomplete = job.panels.filter(p => panelIssues(p).length).length + job.hardware.filter(p => hardwareIssues(p).length).length;
  const fileReference = (job.reference || 'draft').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 70);
  const exportCsv = (approved: boolean) => {
    try { download(`kr8a-${fileReference}-r${job.revision}-${approved ? 'owner-reviewed' : 'DRAFT'}.csv`, orderCsv(job, approved), 'text/csv;charset=utf-8'); setNotice(approved ? 'Owner-reviewed order sheet downloaded. Send it to your supplier yourself for confirmation.' : 'Draft CSV downloaded — do not order from an unchecked draft.'); }
    catch { setNotice('Complete the review before exporting an order sheet.'); }
  };
  const addPanel = () => { if (job.panels.length >= MAX_PANELS) return; const next = newPanel(uid()); change({ panels: [...job.panels, next] }); selectPart(next.id); };
  const addHardware = () => { if (job.hardware.length >= MAX_HARDWARE) return; const next = newHardware(uid()); change({ hardware: [...job.hardware, next] }); selectPart(next.id); };

  return <main className="owner-workspace">
    <header className="owner-header"><Link className="brand" href="/">KR8A</Link><span className="owner-badge">Owner workspace / Preview</span><div><button type="button" onClick={() => download('kr8a-component-workspace.json', workspaceBackup(jobs), 'application/json')}>Download backup</button><button type="button" onClick={() => backupUpload.current?.click()}>Restore backup</button></div></header>
    <div className="owner-intro"><div><p className="eyebrow">From design to workshop</p><h1>Every component, considered.</h1><p>Prepare, check and export the parts you need to order.</p></div><p className="owner-storage" role="status">{saved ? 'Saved in this browser only' : 'Device saving unavailable — download a backup'}<small>No supplier orders are sent. This preview is not enabled on the live website.</small></p></div>
    <div className="owner-notice" role="status">{notice || 'Work in finished panel sizes, in millimetres. Confirm edging allowances and machining with your supplier. Imported designs are incomplete prototype starting points.'}</div>
    {importError && <p className="owner-error" role="alert">{importError}</p>}
    <input ref={upload} type="file" accept=".json,application/json" className="owner-file-input" aria-label="Import design brief file" onChange={e => { void fileInput(e.target.files?.[0], false); e.target.value = ''; }} />
    <input ref={backupUpload} type="file" accept=".json,application/json" className="owner-file-input" aria-label="Restore workspace backup file" onChange={e => { void fileInput(e.target.files?.[0], true); e.target.value = ''; }} />
    {pendingBackup && <section className="owner-restore" aria-label="Confirm backup restore"><h2>Replace this browser’s workspace?</h2><p>The backup contains {pendingBackup.length} projects. Download your current backup first if you want to keep it. Imported approvals will be cleared.</p><button type="button" className="button button-ink" onClick={restoreBackup}>Restore these projects</button><button type="button" onClick={() => setPendingBackup(null)}>Cancel</button></section>}
    <div className="owner-layout"><aside className="owner-projects" aria-label="Component projects"><div className="owner-section-heading"><h2>Projects</h2><span>{jobs.length} / 30</span></div><button type="button" className="owner-new" onClick={() => addJob(newOrderJob(uid()))}>+ New component order</button><button type="button" className="owner-import" onClick={() => setImporting(v => !v)} aria-expanded={importing}>Import a design ↗</button>{importing && <div className="owner-import-form"><label htmlFor="owner-design-code">KR8A link or design code</label><textarea id="owner-design-code" value={designInput} maxLength={4000} onChange={e => setDesignInput(e.target.value)} rows={4} placeholder="Paste a design link or K3 code" /><button type="button" onClick={() => importDesign()}>Create component draft</button><button type="button" onClick={() => upload.current?.click()}>Choose design brief JSON</button><p>Only prototype carcass panels are seeded. All dimensions and remaining parts need checking.</p></div>}<nav aria-label="Choose a project">{jobs.map(j => <button type="button" key={j.id} aria-current={j.id === job.id ? 'page' : undefined} onClick={() => { setActive(j.id); setSelected(''); }}><strong>{j.title || 'Untitled order'}</strong><small>{j.reference || 'No reference'} · Revision {j.revision}</small><span>{isReviewed(j) ? 'Owner reviewed' : 'Draft'}</span></button>)}</nav><p className="owner-local-note">Keep a JSON backup. Local storage is specific to this browser and website address. Restoring a backup requires a fresh component review.</p></aside>
    <div className="owner-project"><section className="owner-job-card" aria-labelledby="owner-project-title"><div className="owner-section-heading"><h2 id="owner-project-title">Your component order</h2><span className={reviewed ? 'owner-status checked' : 'owner-status'}>{reviewed ? 'Owner reviewed' : 'Draft / needs review'}</span></div><div className="owner-job-fields"><Field label="Project name"><input value={job.title} maxLength={180} onChange={e => change({ title: e.target.value })} /></Field><Field label="Order reference"><input value={job.reference} maxLength={180} onChange={e => change({ reference: e.target.value })} placeholder="e.g. KR8A-001" /></Field><Field label="Supplier"><input value={job.supplier} maxLength={180} onChange={e => change({ supplier: e.target.value })} placeholder="Company / workshop" /></Field><Field label="Furniture quantity"><input type="number" min="1" max="1000" step="1" value={job.units || ''} onChange={e => change({ units: numeric(e.target.value) })} /></Field></div><Field label="Order notes"><textarea value={job.notes} maxLength={4000} onChange={e => change({ notes: e.target.value })} rows={2} placeholder="Delivery reference, packaging or supplier instructions. No customer personal details are needed here." /></Field>{job.source.kind === 'prototype' && <details className="owner-source" open><summary>Imported prototype · incomplete parts list</summary><p>{job.source.note}</p><code>{job.source.code}</code></details>}</section>
    <div className="owner-metrics"><div><strong>{totalPanels}</strong><span>Panel pieces</span></div><div><strong>{totals.reduce((n, g) => n + g.area, 0).toFixed(2)} <small>m²</small></strong><span>Net panel area</span></div><div><strong>{totals.length}</strong><span>Material / thickness groups</span></div><div><strong>{incomplete}</strong><span>Lines needing checks</span></div></div>
    <section className="owner-parts" aria-labelledby="panel-list-title"><div className="owner-section-heading"><div><p className="eyebrow">01 / Panels</p><h2 id="panel-list-title">The cutting list.</h2></div><button type="button" onClick={addPanel} disabled={job.panels.length >= MAX_PANELS}>+ Add panel</button></div><p className="owner-help">Finished sizes. Length is the horizontal axis in the edge guide. Quantities below are per furniture unit; exports multiply by {job.units || '—'}.</p>
    {!job.panels.length ? <div className="owner-empty"><span>Start with a panel.</span><p>Add components manually, or import a KR8A design as an unchecked starting point.</p><button type="button" className="button button-ink" onClick={addPanel}>Add your first panel</button></div> : <div className="owner-table-wrap" role="region" aria-label="Panel cutting list" tabIndex={0}><table className="owner-table"><thead><tr><th>Part</th><th>Qty / unit</th><th>Finished L × W</th><th>Thickness</th><th>Material</th><th>Check</th><th><span className="owner-sr">Actions</span></th></tr></thead><tbody>{job.panels.map((p, i) => <tr key={p.id} className={selected === p.id ? 'selected' : ''}><th scope="row"><button type="button" onClick={() => selectPart(p.id)}><small>P{String(i + 1).padStart(3, '0')}</small>{p.label || 'Unnamed panel'}</button></th><td>{p.quantity}</td><td>{p.length || '—'} × {p.width || '—'} mm</td><td>{p.thickness} mm</td><td>{p.material || 'To specify'}</td><td><span className={`owner-status ${panelIssues(p).length ? '' : 'checked'}`}>{panelIssues(p).length ? 'To check' : 'Checked'}</span></td><td><button type="button" onClick={() => selectPart(p.id)} aria-label={`Edit panel ${i + 1}`}>Edit ↗</button></td></tr>)}</tbody></table></div>}</section>
    <section className="owner-parts" aria-labelledby="hardware-title"><div className="owner-section-heading"><div><p className="eyebrow">02 / Fittings</p><h2 id="hardware-title">Hardware & details.</h2></div><button type="button" onClick={addHardware} disabled={job.hardware.length >= MAX_HARDWARE}>+ Add hardware</button></div><p className="owner-help">Specify supplier item codes and quantities for hinges, runners, connectors, handles and other fittings. Nothing is calculated from unconfirmed hardware assumptions.</p>{!job.hardware.length ? <p className="owner-no-hardware">No hardware specified. Confirm what is required before reviewing the order.</p> : <ul className="owner-hardware-list">{job.hardware.map((h, i) => <li key={h.id}><button type="button" onClick={() => selectPart(h.id)} aria-label={`Edit hardware ${i + 1}`}><strong>{h.label || 'Unnamed fitting'}</strong><span>{h.code || 'Code to confirm'} · {h.quantity} per unit</span><small>{hardwareIssues(h).length ? 'To check ↗' : 'Checked ↗'}</small></button></li>)}</ul>}</section>
    {totals.length > 0 && <section className="owner-materials" aria-labelledby="material-total-title"><div className="owner-section-heading"><h2 id="material-total-title">Material summary</h2><span>Net quantities</span></div>{totals.map(g => <div key={`${g.material}-${g.thickness}`}><strong>{g.material} · {g.thickness} mm</strong><span>{g.pieces} pieces / {g.area.toFixed(3)} m² / {g.edgedLength.toFixed(2)} m specified edges</span></div>)}<p className="owner-help">Net panel area and specified edge length only. These figures exclude cutting waste, saw kerf, sheet layout, grain matching and machining allowances; they are not sheet purchase quantities.</p></section>}
    <section className="owner-review" aria-labelledby="order-review-title"><p className="eyebrow">03 / Owner review</p><div className="owner-section-heading"><h2 id="order-review-title">Ready for your supplier?</h2><span>Revision {job.revision}</span></div><p>Check every component against the approved construction. Any edit clears the project approval; panel edits also clear that panel’s check.</p><Field label="Reviewed by"><input value={job.reviewer} maxLength={180} onChange={e => change({ reviewer: e.target.value })} placeholder="Your name" /></Field><div className="owner-checklist">{REVIEW_ITEMS.map(item => <label key={item.id}><input type="checkbox" checked={job.checks[item.id]} onChange={e => replace({ ...job, checks: { ...job.checks, [item.id]: e.target.checked }, approval: null })} /><span>{item.label}</span></label>)}</div>{issues.length > 0 && <details className="owner-issues"><summary>{issues.length} checks to resolve</summary><ul>{issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul></details>}<div className="owner-export-actions"><button type="button" className="button button-ink" disabled={issues.length > 0 || reviewed} onClick={() => { replace(approveOrder(job, new Date().toISOString())); setNotice('This revision is owner reviewed. You can now export its order sheet.'); }}>{reviewed ? 'Revision reviewed ✓' : 'Mark revision reviewed'}</button><button type="button" disabled={!reviewed} onClick={() => exportCsv(true)}>Export reviewed order CSV ↗</button><button type="button" onClick={() => exportCsv(false)}>Export draft CSV</button></div>{reviewed && <p className="owner-approval">Reviewed by {job.approval?.reviewer} on {new Date(job.approval!.at).toLocaleString('en-GB')} · Revision {job.revision}</p>}<p className="owner-help">The generic CSV is a component order sheet for supplier confirmation. It is not CNC machine code. This browser’s review record is not a secure server audit trail. Nothing is emailed, ordered or charged.</p></section>
    </div>
    <aside className="owner-editor" aria-label="Component editor">{part ? <><div className="owner-section-heading"><h2 ref={editorHeading} tabIndex={-1}>Panel details</h2><span>{job.panels.indexOf(part) + 1} / {job.panels.length}</span></div><PartSketch part={part} /><Field label="Part name"><input value={part.label} maxLength={180} onChange={e => patchPanel({ label: e.target.value })} placeholder="e.g. Left side" /></Field><div className="owner-size-fields"><Field label="Finished length (mm)"><input type="number" min="0.1" max="6000" step="0.1" value={part.length || ''} onChange={e => patchPanel({ length: numeric(e.target.value) })} /></Field><Field label="Finished width (mm)"><input type="number" min="0.1" max="6000" step="0.1" value={part.width || ''} onChange={e => patchPanel({ width: numeric(e.target.value) })} /></Field><Field label="Thickness (mm)"><input type="number" min="0.1" max="100" step="0.1" value={part.thickness || ''} onChange={e => patchPanel({ thickness: numeric(e.target.value) })} /></Field><Field label="Quantity per unit"><input type="number" min="1" max="1000" step="1" value={part.quantity || ''} onChange={e => patchPanel({ quantity: numeric(e.target.value) })} /></Field></div><Field label="Material / decor / texture code"><input value={part.material} maxLength={180} onChange={e => patchPanel({ material: e.target.value })} placeholder="Supplier board code and finish" /></Field><Field label="Grain direction"><select value={part.grain} onChange={e => patchPanel({ grain: e.target.value as PanelPart['grain'] })}><option value="unconfirmed">To confirm</option><option value="length">Along finished length</option><option value="width">Along finished width</option><option value="none">No directional grain</option></select></Field><fieldset className="owner-edges"><legend>Edging specification</legend><p>Use the edging code, thickness and treatment, or “none”. L1/L2 run along length; W1/W2 run along width.</p><div>{([['length1', 'L1 · top'], ['length2', 'L2 · bottom'], ['width1', 'W1 · left'], ['width2', 'W2 · right']] as const).map(([key, label]) => <Field key={key} label={label}><input value={part.edges[key]} maxLength={180} onChange={e => patchPanel({ edges: { ...part.edges, [key]: e.target.value } })} placeholder="Code + thickness, or none" /></Field>)}</div></fieldset><Field label="Machining / drilling instructions"><textarea value={part.machining} maxLength={2000} rows={3} onChange={e => patchPanel({ machining: e.target.value })} placeholder="Drawing reference and operations, or none" /></Field><label className="owner-row-check"><input type="checkbox" checked={part.verified} onChange={e => patchPanel({ verified: e.target.checked })} /> I have checked this panel against the construction.</label>{panelIssues(part).length > 0 && <ul className="owner-row-issues">{panelIssues(part).map(issue => <li key={issue}>{issue}</li>)}</ul>}<div className="owner-row-actions"><button type="button" disabled={job.panels.length >= MAX_PANELS} onClick={() => { const copy = { ...part, id: uid(), label: `${part.label} copy`.slice(0, 180), edges: { ...part.edges }, verified: false }; change({ panels: [...job.panels, copy] }); selectPart(copy.id); }}>Duplicate panel</button><button type="button" onClick={() => { change({ panels: job.panels.filter(p => p.id !== part.id) }); setSelected(''); setNotice('Panel removed. The project needs review again.'); }}>Remove panel</button></div></> : hardware ? <><h2 ref={editorHeading} tabIndex={-1}>Hardware details</h2><Field label="Item name"><input value={hardware.label} maxLength={180} onChange={e => patchHardware({ label: e.target.value })} /></Field><Field label="Supplier item code"><input value={hardware.code} maxLength={180} onChange={e => patchHardware({ code: e.target.value })} /></Field><Field label="Hardware quantity per unit"><input type="number" min="1" max="1000" step="1" value={hardware.quantity || ''} onChange={e => patchHardware({ quantity: numeric(e.target.value) })} /></Field><Field label="Hardware notes"><textarea rows={3} value={hardware.notes} maxLength={2000} onChange={e => patchHardware({ notes: e.target.value })} /></Field><label className="owner-row-check"><input type="checkbox" checked={hardware.verified} onChange={e => patchHardware({ verified: e.target.checked })} /> I have checked this item and quantity.</label><button type="button" className="owner-remove" onClick={() => { change({ hardware: job.hardware.filter(p => p.id !== hardware.id) }); setSelected(''); }}>Remove hardware</button></> : <div className="owner-editor-empty"><span className="eyebrow">Component detail</span><h2>A place for every detail.</h2><p>Select a panel or fitting to specify its dimensions, material, grain, edging and machining.</p><div className="owner-empty-diagram" aria-hidden="true"><i /><span>L × W × T</span></div><p>Use the diagram to keep edge orientation consistent with your supplier.</p></div>}</aside></div>
    <footer className="owner-footer"><span>KR8A / Component workspace</span><span>Preview · local drafts · owner review before export</span></footer>
  </main>;
}
