/** One validated design is shared by the controls, 3D scene, links and review sheet.
 * Dimensions are millimetres throughout. Manufacturing tolerances and commercial
 * prices are deliberately absent until KR8A signs off the construction rules. */
export const LIMITS = {
  width: { min: 1200, max: 2400, step: 10 },
  height: { min: 600, max: 900, step: 10 },
  depth: { min: 350, max: 600, step: 10 },
} as const;

export const PANEL_MM = 18;
export const REVEAL_MM = 3;
export type Front = 'D' | 'R' | 'O';
export type Inside = 'S' | 'I' | 'V';
export type FinishId = 'oak' | 'walnut' | 'brown-oak' | 'chalk' | 'mushroom' | 'green';
export type BaseId = 'plinth' | 'timber' | 'metal' | 'floating';
export type HandleId = 'push' | 'edge' | 'bar';

export const FINISHES: { id: FinishId; name: string; family: string; color: string; grain: boolean }[] = [
  { id: 'oak', name: 'Natural oak', family: 'Wood', color: '#a78059', grain: true },
  { id: 'walnut', name: 'Dark walnut', family: 'Wood', color: '#593e2d', grain: true },
  { id: 'brown-oak', name: 'Brown oak', family: 'Wood', color: '#6d5340', grain: true },
  { id: 'chalk', name: 'Chalk', family: 'Matte', color: '#d8d1c6', grain: false },
  { id: 'mushroom', name: 'Mushroom', family: 'Matte', color: '#8d8172', grain: false },
  { id: 'green', name: 'Deep green', family: 'Matte', color: '#344638', grain: false },
];
export const BASES: { id: BaseId; name: string; note: string }[] = [
  { id: 'plinth', name: 'Recessed plinth', note: 'A quiet, grounded profile' },
  { id: 'timber', name: 'Timber legs', note: 'Lifts the silhouette' },
  { id: 'metal', name: 'Slim metal legs', note: 'Light and architectural' },
  { id: 'floating', name: 'Floating', note: 'Wall fixing to be reviewed' },
];
export const HANDLES: { id: HandleId; name: string; note: string }[] = [
  { id: 'push', name: 'Push to open', note: 'An uninterrupted front' },
  { id: 'edge', name: 'Edge pull', note: 'A subtle finger grip' },
  { id: 'bar', name: 'Slim bar', note: 'A precise metal detail' },
];

export type SideboardConfig = {
  version: 1;
  width: number;
  height: number;
  depth: number;
  fronts: Front[];
  inside: Inside[];
  shelves: number[];
  finish: FinishId;
  interior: FinishId | 'match';
  base: BaseId;
  handle: HandleId;
};

export const defaultSideboardConfig: SideboardConfig = {
  version: 1, width: 2000, height: 750, depth: 450,
  fronts: ['D', 'R', 'R', 'D'],
  inside: ['S', 'S', 'S', 'S'],
  shelves: [1, 0, 0, 1],
  finish: 'oak', interior: 'match', base: 'plinth', handle: 'push',
};

const frontSet = new Set<Front>(['D', 'R', 'O']);
const insideSet = new Set<Inside>(['S', 'I', 'V']);
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const choose = <T extends string>(value: unknown, values: readonly T[], fallback: T): T =>
  values.includes(value as T) ? value as T : fallback;
const rounded = (value: unknown, min: number, max: number, step: number, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n / step) * step)) : fallback;
};
export const baseHeight = (base: BaseId) => base === 'floating' ? 150 : base === 'plinth' ? 70 : 130;
export const carcassHeight = (config: SideboardConfig) => config.height - baseHeight(config.base);
export const bayWidth = (width: number, count: number) => (width - (count + 1) * PANEL_MM) / count;
export const bayOptions = (width: number) => [2, 3, 4].filter(n => bayWidth(width, n) >= 350 && bayWidth(width, n) <= 800);

export function normalizeConfig(input: unknown): SideboardConfig {
  const raw = asRecord(input);
  const width = rounded(raw.width, LIMITS.width.min, LIMITS.width.max, LIMITS.width.step, defaultSideboardConfig.width);
  const height = rounded(raw.height, LIMITS.height.min, LIMITS.height.max, LIMITS.height.step, defaultSideboardConfig.height);
  const depth = rounded(raw.depth, LIMITS.depth.min, LIMITS.depth.max, LIMITS.depth.step, defaultSideboardConfig.depth);
  const offered = bayOptions(width);
  const requested = Array.isArray(raw.fronts) ? raw.fronts.length : defaultSideboardConfig.fronts.length;
  const count = offered.includes(requested) ? requested : offered.reduce((best, n) => Math.abs(n - requested) < Math.abs(best - requested) ? n : best, offered[0]);
  const fronts = Array.from({ length: count }, (_, index): Front => {
    const value = Array.isArray(raw.fronts) ? raw.fronts[index] : defaultSideboardConfig.fronts[index];
    if (!frontSet.has(value as Front)) return 'D';
    return value === 'R' && height < 650 ? 'D' : value as Front;
  });
  const inside = Array.from({ length: count }, (_, index): Inside => {
    const value = Array.isArray(raw.inside) ? raw.inside[index] : 'S';
    return fronts[index] === 'R' || !insideSet.has(value as Inside) || (value === 'I' && (fronts[index] !== 'D' || height < 690)) ? 'S' : value as Inside;
  });
  const shelves = Array.from({ length: count }, (_, index) => fronts[index] === 'R' ? 0 : rounded(Array.isArray(raw.shelves) ? raw.shelves[index] : 1, 0, inside[index] === 'I' ? 1 : 3, 1, 1));
  return {
    version: 1, width, height, depth, fronts, inside, shelves,
    finish: choose(raw.finish, FINISHES.map(f => f.id), 'oak'),
    interior: choose(raw.interior, ['match', ...FINISHES.map(f => f.id)] as const, 'match'),
    base: choose(raw.base, BASES.map(b => b.id), 'plinth'),
    handle: choose(raw.handle, HANDLES.map(h => h.id), 'push'),
  };
}

export function encodeConfig(config: SideboardConfig): string {
  return btoa(JSON.stringify(normalizeConfig(config))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeConfig(code: string | null): SideboardConfig | null {
  if (!code || code.length > 3000 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  try { return normalizeConfig(JSON.parse(atob(code.replace(/-/g, '+').replace(/_/g, '/')))); }
  catch { return null; }
}
export const finishName = (id: FinishId) => FINISHES.find(f => f.id === id)?.name ?? id;
export const frontName = (front: Front) => ({ D: 'Door', R: 'Three drawers', O: 'Open' })[front];
export const insideName = (inside: Inside) => ({ S: 'Adjustable shelves', I: 'Inner drawers', V: 'Record dividers' })[inside];

/** This is a design summary, not a CNC cut list or a fabrication approval. */
export function designSummary(config: SideboardConfig) {
  const c = normalizeConfig(config);
  return [
    ['Overall size', `${c.width} × ${c.height} × ${c.depth} mm`],
    ['Bays', c.fronts.map(frontName).join(' · ')],
    ['Exterior', finishName(c.finish)],
    ['Interior', c.interior === 'match' ? 'Match exterior' : finishName(c.interior)],
    ['Inside', c.fronts.map((front, index) => front === 'R' ? 'Drawer bay' : `${insideName(c.inside[index])}${c.inside[index] === 'S' ? ` (${c.shelves[index]})` : ''}`).join(' · ')],
    ['Base', BASES.find(item => item.id === c.base)?.name ?? c.base],
    ['Opening', HANDLES.find(item => item.id === c.handle)?.name ?? c.handle],
  ] as const;
}
