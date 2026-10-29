import { componentsPreview, decodeConfig, encodeConfig, normalizeConfig, type SideboardConfig } from './sideboardEngine.ts';

export type Grain = 'unconfirmed' | 'length' | 'width' | 'none';
export type Edges = { length1: string; length2: string; width1: string; width2: string };
export type PanelPart = {
  id: string; label: string; quantity: number; length: number; width: number; thickness: number;
  material: string; grain: Grain; edges: Edges; machining: string; verified: boolean;
};
export type HardwarePart = { id: string; label: string; code: string; quantity: number; notes: string; verified: boolean };
export const REVIEW_ITEMS = [
  { id: 'complete', label: 'The parts and hardware list is complete, including fronts, base and drawer components.' },
  { id: 'dimensions', label: 'Finished sizes, construction, tolerances and hardware clearances have been checked.' },
  { id: 'materials', label: 'Material codes, thicknesses, grain direction and edging specifications are correct.' },
  { id: 'supplier', label: 'The supplier has confirmed finished-size conventions, machining and any edging allowances.' },
] as const;
export type ReviewKey = typeof REVIEW_ITEMS[number]['id'];
export type CustomerOrderLink = { orderId: string; paymentReference: string; pricingRulesVersion: string; confirmedAt: string; designCode: string; mode: 'test' | 'live'; engineeringHold: true };
export type OrderJob = {
  version: 1; id: string; title: string; reference: string; supplier: string; units: number; revision: number;
  notes: string; reviewer: string; panels: PanelPart[]; hardware: HardwarePart[];
  source: { kind: 'manual' | 'prototype'; code: string; note: string };
  checks: Record<ReviewKey, boolean>; approval: null | { revision: number; reviewer: string; at: string };
  customerOrder?: CustomerOrderLink;
};
export const ORDER_STORAGE_KEY = 'kr8a-owner-component-orders-v1';
export const MAX_PANELS = 250;
export const MAX_HARDWARE = 100;
export const blankChecks = (): OrderJob['checks'] => ({ complete: false, dimensions: false, materials: false, supplier: false });
export const newPanel = (id: string): PanelPart => ({ id, label: '', quantity: 1, length: 0, width: 0, thickness: 18, material: '', grain: 'unconfirmed', edges: { length1: '', length2: '', width1: '', width2: '' }, machining: '', verified: false });
export const newHardware = (id: string): HardwarePart => ({ id, label: '', code: '', quantity: 1, notes: '', verified: false });
export const newOrderJob = (id: string): OrderJob => ({ version: 1, id, title: 'Untitled component order', reference: '', supplier: '', units: 1, revision: 1, notes: '', reviewer: '', panels: [], hardware: [], source: { kind: 'manual', code: '', note: 'Manually specified components.' }, checks: blankChecks(), approval: null });
export function reviseJob(job: OrderJob, patch: Partial<OrderJob>): OrderJob {
  return { ...job, ...patch, id: job.id, version: 1, revision: job.revision + 1, checks: blankChecks(), approval: null };
}
const isRecord = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const textValue = (v: unknown, max = 180) => typeof v === 'string' ? v.slice(0, max).trim() : '';
const numberValue = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : 0;
const whole = (v: number, max = 1000) => Number.isSafeInteger(v) && v >= 1 && v <= max;
const size = (v: number, max: number) => Number.isFinite(v) && v > 0 && v <= max && Math.abs(v * 10 - Math.round(v * 10)) < 0.00001;
const round = (v: number) => Math.round(v * 10000) / 10000;
export function panelIssues(part: PanelPart): string[] {
  return [!part.label.trim() && 'Part name missing', !whole(part.quantity) && 'Quantity must be a whole number from 1 to 1000',
    !size(part.length, 6000) && 'Finished length must be 0.1–6000 mm (one decimal place)', !size(part.width, 6000) && 'Finished width must be 0.1–6000 mm (one decimal place)',
    !size(part.thickness, 100) && 'Thickness must be 0.1–100 mm (one decimal place)', !part.material.trim() && 'Material / decor / texture code missing',
    part.grain === 'unconfirmed' && 'Grain direction unconfirmed', Object.values(part.edges).some(v => !v.trim()) && 'Specify all four edges (use “none” for an unedged edge)',
    !part.machining.trim() && 'Specify machining / drilling, or “none”', !part.verified && 'Part has not been checked'].filter(Boolean) as string[];
}
export function hardwareIssues(part: HardwarePart): string[] {
  return [!part.label.trim() && 'Item name missing', !part.code.trim() && 'Supplier item code missing', !whole(part.quantity) && 'Quantity must be a whole number from 1 to 1000', !part.verified && 'Item has not been checked'].filter(Boolean) as string[];
}
export function orderIssues(job: OrderJob): string[] {
  const issues: string[] = [];
  if (job.customerOrder) issues.push('Engineering hold: this confirmed order needs approved manufacturing rules before any supplier release.');
  if (!job.title.trim()) issues.push('Add a project name.');
  if (!job.reference.trim()) issues.push('Add an order reference.');
  if (!job.supplier.trim()) issues.push('Add the supplier name.');
  if (!whole(job.units)) issues.push('Furniture quantity must be a whole number from 1 to 1000.');
  if (!job.panels.length && !job.hardware.length) issues.push('Add at least one component.');
  if (job.panels.length > MAX_PANELS || job.hardware.length > MAX_HARDWARE) issues.push('This order exceeds the workspace line limit.');
  const ids = [...job.panels, ...job.hardware].map(p => p.id);
  if (new Set(ids).size !== ids.length) issues.push('Component identifiers must be unique.');
  job.panels.forEach((p, i) => { const errors = panelIssues(p); if (errors.length) issues.push(`Panel ${i + 1}: ${errors.join('; ')}.`); });
  job.hardware.forEach((p, i) => { const errors = hardwareIssues(p); if (errors.length) issues.push(`Hardware ${i + 1}: ${errors.join('; ')}.`); });
  if (!job.reviewer.trim()) issues.push('Add the name of the person reviewing this order.');
  for (const item of REVIEW_ITEMS) if (!job.checks[item.id]) issues.push(`Review: ${item.label}`);
  return issues;
}
export function approveOrder(job: OrderJob, at: string): OrderJob {
  if (orderIssues(job).length || !Number.isFinite(Date.parse(at))) throw new Error('Complete the component checks before approving this revision.');
  return { ...job, approval: { revision: job.revision, reviewer: job.reviewer.trim(), at } };
}
export const isReviewed = (job: OrderJob) => Boolean(job.approval && job.approval.revision === job.revision && job.approval.reviewer === job.reviewer.trim() && Number.isFinite(Date.parse(job.approval.at)) && !orderIssues(job).length);

export function seedFromDesign(config: SideboardConfig, id: string): OrderJob {
  const c = normalizeConfig(config), job = newOrderJob(id);
  return { ...job, title: `Sideboard ${c.width} · component draft`, source: { kind: 'prototype', code: encodeConfig(c), note: 'Incomplete prototype carcass preview. Fronts, plinth/base parts, drawer boxes, record dividers, hardware, edging, joinery and machining must be specified separately. Sizes require manufacturer review.' },
    panels: componentsPreview(c).map((p, i) => ({ ...newPanel(`${id}-panel-${i + 1}`), label: p.part, quantity: p.qty, length: p.l, width: p.w, thickness: p.t })) };
}
export function designFromInput(input: string): SideboardConfig | null {
  const trimmed = input.trim();
  if (trimmed.startsWith('{')) {
    try { const data: unknown = JSON.parse(trimmed); if (!isRecord(data) || data.document !== 'KR8A design brief' || !isRecord(data.config)) return null;
      const c = data.config;
      if (![c.width, c.height, c.depth].every(v => typeof v === 'number' && Number.isFinite(v)) || !Array.isArray(c.fronts)) return null;
      const normalized = normalizeConfig(c);
      if (normalized.width !== c.width || normalized.height !== c.height || normalized.depth !== c.depth) return null;
      return normalized;
    } catch { return null; }
  }
  try { const url = new URL(trimmed); return /^https?:$/.test(url.protocol) ? decodeConfig(url.searchParams.get('c')) : null; } catch { return decodeConfig(trimmed); }
}

/** Backups are data, not trusted approval records. Every import requires a fresh review. */
export function parseOrderBackup(input: string): OrderJob[] {
  if (input.length > 2_000_000) throw new Error('Backup is too large (maximum 2 MB).');
  const data: unknown = JSON.parse(input);
  if (!isRecord(data) || data.document !== 'KR8A component workspace' || data.version !== 1 || !Array.isArray(data.jobs) || data.jobs.length > 30) throw new Error('Choose a KR8A component workspace backup.');
  const seen = new Set<string>();
  return data.jobs.map((raw: unknown) => {
    if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.panels) || !Array.isArray(raw.hardware) || raw.panels.length > MAX_PANELS || raw.hardware.length > MAX_HARDWARE) throw new Error('The backup contains an invalid project.');
    const id = textValue(raw.id);
    if (!id || seen.has(id)) throw new Error('Project identifiers must be unique.');
    seen.add(id);
    const job = newOrderJob(id), rowIds = new Set<string>();
    const rowId = (v: unknown) => { const result = textValue(v); if (!result || rowIds.has(result)) throw new Error('Component identifiers must be unique.'); rowIds.add(result); return result; };
    const panels = raw.panels.map((value: unknown) => {
      if (!isRecord(value)) throw new Error('Invalid panel.');
      const edges = isRecord(value.edges) ? value.edges : {};
      return { ...newPanel(rowId(value.id)), label: textValue(value.label), quantity: numberValue(value.quantity), length: numberValue(value.length), width: numberValue(value.width), thickness: numberValue(value.thickness), material: textValue(value.material), grain: (['length', 'width', 'none'].includes(String(value.grain)) ? value.grain : 'unconfirmed') as Grain,
        edges: { length1: textValue(edges.length1), length2: textValue(edges.length2), width1: textValue(edges.width1), width2: textValue(edges.width2) }, machining: textValue(value.machining, 2000), verified: false };
    });
    const hardware = raw.hardware.map((value: unknown) => { if (!isRecord(value)) throw new Error('Invalid hardware.'); return { ...newHardware(rowId(value.id)), label: textValue(value.label), code: textValue(value.code), quantity: numberValue(value.quantity), notes: textValue(value.notes, 2000), verified: false }; });
    const source = isRecord(raw.source) && raw.source.kind === 'prototype' ? { kind: 'prototype' as const, code: textValue(raw.source.code, 3000), note: textValue(raw.source.note, 2000) } : job.source;
    let customerOrder: CustomerOrderLink | undefined;
    if (raw.customerOrder !== undefined) {
      const origin = raw.customerOrder;
      if (!isRecord(origin) || !textValue(origin.orderId) || !textValue(origin.paymentReference) || !textValue(origin.pricingRulesVersion) || !Number.isFinite(Date.parse(String(origin.confirmedAt))) || !decodeConfig(textValue(origin.designCode, 3000)) || !['test', 'live'].includes(String(origin.mode))) throw new Error('Invalid customer order reference.');
      customerOrder = { orderId: textValue(origin.orderId), paymentReference: textValue(origin.paymentReference), pricingRulesVersion: textValue(origin.pricingRulesVersion), confirmedAt: textValue(origin.confirmedAt), designCode: textValue(origin.designCode, 3000), mode: origin.mode as 'test' | 'live', engineeringHold: true };
    }
    return { ...job, title: textValue(raw.title), reference: textValue(raw.reference), supplier: textValue(raw.supplier), reviewer: textValue(raw.reviewer), units: numberValue(raw.units), notes: textValue(raw.notes, 4000), revision: whole(numberValue(raw.revision), 1_000_000) ? Number(raw.revision) + 1 : 1, panels, hardware, source, ...(customerOrder ? { customerOrder } : {}) };
  });
}
export const workspaceBackup = (jobs: OrderJob[]) => JSON.stringify({ document: 'KR8A component workspace', version: 1, jobs }, null, 2);

export function materialTotals(job: OrderJob) {
  const groups = new Map<string, { material: string; thickness: number; pieces: number; area: number; edgedLength: number }>();
  for (const p of job.panels) {
    const key = JSON.stringify([p.material.trim(), p.thickness]);
    const group = groups.get(key) ?? { material: p.material.trim() || 'Unspecified material', thickness: p.thickness, pieces: 0, area: 0, edgedLength: 0 };
    if (!whole(p.quantity) || !whole(job.units) || !size(p.length, 6000) || !size(p.width, 6000)) continue;
    const qty = p.quantity * job.units;
    group.pieces += qty; group.area += p.length * p.width * qty / 1_000_000;
    group.edgedLength += (['length1', 'length2'] as const).filter(e => p.edges[e].trim() && p.edges[e].trim().toLowerCase() !== 'none').length * p.length * qty / 1000;
    group.edgedLength += (['width1', 'width2'] as const).filter(e => p.edges[e].trim() && p.edges[e].trim().toLowerCase() !== 'none').length * p.width * qty / 1000;
    groups.set(key, group);
  }
  return [...groups.values()].map(g => ({ ...g, area: round(g.area), edgedLength: round(g.edgedLength) }));
}
/** Defuse spreadsheet formulas, including cells beginning with whitespace/control characters. */
const csvCell = (value: unknown) => {
  let v = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(v) || /^[\t\r\n]/.test(v)) v = `'${v}`;
  return `"${v.replace(/"/g, '""')}"`;
};
export function orderCsv(job: OrderJob, reviewed = false): string {
  if (reviewed && !isReviewed(job)) throw new Error('Review this revision before exporting an order sheet.');
  const status = reviewed ? 'OWNER REVIEWED — supplier confirmation required' : 'DRAFT — DO NOT ORDER';
  const header = ['Status', 'Reference', 'Revision', 'Supplier', 'Project', 'Furniture quantity', 'Line', 'Type', 'Part', 'Qty per unit', 'Total qty', 'Finished length mm', 'Finished width mm', 'Thickness mm', 'Material / supplier code', 'Grain direction', 'Edge L1', 'Edge L2', 'Edge W1', 'Edge W2', 'Machining / notes', 'Reviewed by', 'Reviewed at', 'Source design', 'Order notes', 'Dimension basis', 'Customer order', 'Pricing rules', 'Manufacturing state'];
  const prefix = [status, job.reference, job.revision, job.supplier, job.title, job.units];
  const suffix = [reviewed ? job.approval?.reviewer : '', reviewed ? job.approval?.at : '', job.source.code, job.notes, 'FINISHED PANEL SIZES — supplier to confirm edging allowances; no CNC data', job.customerOrder?.orderId || '', job.customerOrder?.pricingRulesVersion || '', job.customerOrder ? 'ENGINEERING HOLD — DO NOT MANUFACTURE' : 'Owner-specified components'];
  const rows: unknown[][] = [header,
    ...job.panels.map((p, i) => [...prefix, `P${String(i + 1).padStart(3, '0')}`, 'Panel', p.label, p.quantity, p.quantity * job.units, p.length, p.width, p.thickness, p.material, p.grain, p.edges.length1, p.edges.length2, p.edges.width1, p.edges.width2, p.machining, ...suffix]),
    ...job.hardware.map((p, i) => [...prefix, `H${String(i + 1).padStart(3, '0')}`, 'Hardware', p.label, p.quantity, p.quantity * job.units, '', '', '', p.code, '', '', '', '', '', p.notes, ...suffix])];
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
