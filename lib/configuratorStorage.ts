import { decodeConfig, defaultSideboardConfig, encodeConfig, normalizeConfig, type SideboardConfig } from './sideboardEngine.ts';

export type SavedDesign = { name: string; config: SideboardConfig; savedAt: string };
type DesignStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const DRAFT_KEY = 'kr8a-current-v1';
export const SAVED_KEY = 'kr8a-saved-v1';
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const designName = (value: unknown) => typeof value === 'string' ? value.slice(0, 42) : '';

/** Storage is optional. A shared design must still open in a private/restricted browser. */
export function readConfiguratorSession(storage: DesignStorage | null, code: string | null) {
  const shared = decodeConfig(code);
  let config = shared ?? defaultSideboardConfig;
  let name = '';
  let savedDesigns: SavedDesign[] = [];
  let storageAvailable = Boolean(storage);
  try {
    const raw = JSON.parse(storage?.getItem(DRAFT_KEY) || 'null');
    if (record(raw)) {
      // Existing drafts stored the config directly; new drafts also retain their name.
      const draft = normalizeConfig(record(raw.config) ? raw.config : raw);
      if (!code) { config = draft; name = designName(raw.name); }
      else if (shared && encodeConfig(shared) === encodeConfig(draft)) name = designName(raw.name);
    }
  } catch { storageAvailable = false; }
  try {
    const raw = JSON.parse(storage?.getItem(SAVED_KEY) || '[]');
    if (Array.isArray(raw)) savedDesigns = raw.filter(entry => record(entry) && record(entry.config)).slice(0, 20).map(entry => ({
      name: designName(entry.name) || 'Saved sideboard', config: normalizeConfig(entry.config), savedAt: typeof entry.savedAt === 'string' ? entry.savedAt : '',
    }));
  } catch { storageAvailable = false; }
  return { config, name, savedDesigns, storageAvailable, invalidLink: Boolean(code && !shared) };
}

export function writeDraft(storage: DesignStorage | null, config: SideboardConfig, name: string): boolean {
  try {
    if (!storage) return false;
    storage.setItem(DRAFT_KEY, JSON.stringify({ config: normalizeConfig(config), name: designName(name) }));
    return true;
  } catch { return false; }
}
