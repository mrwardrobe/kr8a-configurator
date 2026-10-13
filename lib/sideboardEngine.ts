/** Claude's supplied prototype engine is the single source for preview limits,
 * option data, validation, price illustration, and K3 sharing. None of its
 * values are approved production or manufacturing rules. */
import KR8A from './KR8AEngineRuntime.js';

const source = KR8A as any;
export type Front = 'D' | 'R' | 'O';
export type Inside = 'S' | 'I' | 'V';
export type FinishId = 'oak' | 'smk' | 'wal' | 'blk' | 'wht' | 'grn';
export type InteriorId = 'mat' | 'wht' | 'blk' | 'grn';
export type BaseId = 'mtl' | 'leg' | 'plt' | 'flt';
export type HandleId = 'psh' | 'grp' | 'bar';
export type SideboardConfig = {
  version: 2;
  width: number;
  height: number;
  depth: number;
  fronts: Front[];
  inside: Inside[];
  shelves: number[];
  shelfPosition: number;
  finish: FinishId;
  interior: InteriorId;
  base: BaseId;
  handle: HandleId;
  light: boolean;
};
type FinishOption = { id: FinishId; name: string; family: string; color: string; grain: boolean; note: string };
type InteriorOption = { id: InteriorId; name: string };
type BaseOption = { id: BaseId; name: string; note: string; height: number };
type HandleOption = { id: HandleId; name: string; note: string };

export const LIMITS = { width: source.LIMITS.width, height: source.LIMITS.height, depth: source.LIMITS.depth } as {
  width: { min: number; max: number; step: number }; height: { min: number; max: number; step: number }; depth: { min: number; max: number; step: number };
};
export const PANEL_MM = source.LIMITS.panel as number;
export const REVEAL_MM = source.LIMITS.gap as number;
export const FINISHES: FinishOption[] = source.FINISHES.map((f: any) => ({ id: f.id, name: f.name, family: f.family, color: f.base, grain: f.strength > 0, note: f.blurb }));
export const INTERIORS: InteriorOption[] = source.INTERIORS.map((i: any) => ({ id: i.id, name: i.name }));
export const BASES: BaseOption[] = source.BASES.map((b: any) => ({ id: b.id, name: b.name, note: b.note, height: b.h }));
export const HANDLES: HandleOption[] = source.HANDLES.map((h: any) => ({ id: h.id, name: h.name, note: h.note }));
export const PATTERNS = source.PATTERNS as Record<number, string[]>;

const rawDefault = source.DEFAULT;
export const defaultSideboardConfig: SideboardConfig = {
  version: 2, width: rawDefault.w, height: rawDefault.h, depth: rawDefault.d,
  fronts: [...rawDefault.fronts], inside: [...rawDefault.inside], shelves: [...rawDefault.shelves],
  shelfPosition: rawDefault.sp, finish: rawDefault.finish, interior: rawDefault.interior,
  base: rawDefault.base, handle: rawDefault.handle, light: Boolean(rawDefault.light),
};

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const finishMigration: Record<string, FinishId> = { walnut: 'wal', 'brown-oak': 'smk', chalk: 'wht', mushroom: 'wht', green: 'grn' };
const interiorMigration: Record<string, InteriorId> = { match: 'mat', oak: 'mat', walnut: 'blk', 'brown-oak': 'blk', chalk: 'wht', mushroom: 'wht', green: 'grn' };
const baseMigration: Record<string, BaseId> = { plinth: 'plt', timber: 'leg', metal: 'mtl', floating: 'flt' };
const handleMigration: Record<string, HandleId> = { push: 'psh', edge: 'grp' };
const migrate = (value: unknown, table: Record<string, string>) => typeof value === 'string' ? table[value] || value : value;

export function normalizeConfig(input: unknown): SideboardConfig {
  const raw = asRecord(input);
  const fronts = Array.isArray(raw.fronts) ? raw.fronts.map(value => ['D', 'R', 'O'].includes(value) ? value : 'D') : rawDefault.fronts;
  const inside = Array.isArray(raw.inside) ? raw.inside.map(value => ['S', 'I', 'V'].includes(value) ? value : 'S') : rawDefault.inside;
  const shelves = Array.isArray(raw.shelves) ? raw.shelves.map(value => Math.max(0, Math.min(3, Math.round(Number(value) || 0)))) : rawDefault.shelves;
  const result = source.validate({
    w: raw.width ?? raw.w ?? rawDefault.w,
    h: raw.height ?? raw.h ?? rawDefault.h,
    d: raw.depth ?? raw.d ?? rawDefault.d,
    fronts, inside, shelves,
    sp: raw.shelfPosition ?? raw.sp ?? 0,
    finish: migrate(raw.finish, finishMigration),
    interior: migrate(raw.interior, interiorMigration),
    base: migrate(raw.base, baseMigration),
    handle: migrate(raw.handle, handleMigration),
    light: raw.light,
  }).config;
  // Inner drawers are hidden behind doors; an open bay cannot house this option.
  result.inside = result.inside.map((value: Inside, index: number) => value === 'I' && result.fronts[index] !== 'D' ? 'S' : value);
  result.shelves = result.shelves.map((value: number, index: number) => result.inside[index] === 'V' || result.fronts[index] === 'R' ? 0 : value);
  return {
    version: 2, width: result.w, height: result.h, depth: result.d,
    fronts: result.fronts, inside: result.inside, shelves: result.shelves,
    shelfPosition: result.sp, finish: result.finish, interior: result.interior,
    base: result.base, handle: result.handle, light: Boolean(result.light),
  };
}

export function toPrototypeConfig(config: SideboardConfig) {
  const c = normalizeConfig(config);
  return { w: c.width, h: c.height, d: c.depth, fronts: c.fronts, inside: c.inside,
    shelves: c.shelves, sp: c.shelfPosition, finish: c.finish, interior: c.interior,
    base: c.base, handle: c.handle, light: c.light ? 1 : 0 };
}
export const baseHeight = (base: BaseId) => BASES.find(item => item.id === base)?.height ?? 70;
export const carcassHeight = (config: SideboardConfig) => config.height - baseHeight(config.base);
export const bayWidth = (width: number, count: number) => (width - 2 * PANEL_MM - REVEAL_MM * (count + 1)) / count;
export const bayOptions = (width: number): number[] => source.bayOptions(width);
export const frontAllowed = (config: SideboardConfig, front: Front) => front !== 'R' || (bayWidth(config.width, config.fronts.length) <= source.LIMITS.drawerBayMax && carcassHeight(config) >= source.LIMITS.drawerMinCarcass);
export const innerDrawersAllowed = (config: SideboardConfig, index: number) => config.fronts[index] === 'D' && carcassHeight(config) >= 420;

export function encodeConfig(config: SideboardConfig): string { return source.encode(toPrototypeConfig(config)); }
export function decodeConfig(code: string | null): SideboardConfig | null {
  if (!code || code.length > 3000) return null;
  if (code.startsWith('K3-')) {
    if (!/^K3-[A-Za-z0-9-]+$/.test(code)) return null;
    try { const decoded = source.decode(code); return decoded ? normalizeConfig(decoded) : null; } catch { return null; }
  }
  // Keep links created by the previous KR8A preview usable.
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return null;
  try { return normalizeConfig(JSON.parse(atob(code.replace(/-/g, '+').replace(/_/g, '/')))); }
  catch { return null; }
}
export const finishName = (id: FinishId) => FINISHES.find(item => item.id === id)?.name ?? id;
export const frontName = (front: Front) => ({ D: 'Door', R: 'Three drawers', O: 'Open' })[front];
export const insideName = (inside: Inside) => ({ S: 'Adjustable shelves', I: 'Inner drawers', V: 'Record dividers' })[inside];
export const illustrativePrice = (config: SideboardConfig): number => source.price(toPrototypeConfig(config)).amount;
/** Customer-facing preview only. Neither this nor componentsPreview is a production specification. */
export const designSummary = (config: SideboardConfig): [string, string][] => source.summary(toPrototypeConfig(config));
export const componentsPreview = (config: SideboardConfig) => source.components(toPrototypeConfig(config)) as { part: string; qty: number; l: number; w: number; t: number }[];
