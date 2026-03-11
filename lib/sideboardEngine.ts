export const WOODS = [
  'H1367 ST40 Light Natural Casella Oak',
  'H1385 ST40 Natural Casella Oak',
  'H1386 ST40 Brown Casella Oak',
];

export const MATTES = ['Chalk', 'Mushroom', 'Charcoal'];

export const FINISH_MAP: Record<string, { color: string; roughness: number; metalness: number }> = {
  'H1367 ST40 Light Natural Casella Oak': { color: '#756959', roughness: 0.85, metalness: 0.05 }, // Warm light oak tone
  'H1385 ST40 Natural Casella Oak': { color: '#594936', roughness: 0.85, metalness: 0.05 }, // Natural mid oak tone
  'H1386 ST40 Brown Casella Oak': { color: '#211813', roughness: 0.85, metalness: 0.05 }, // Deep brown oak tone
  'Chalk': { color: '#8c8985', roughness: 0.95, metalness: 0.0 }, // Soft white
  'Mushroom': { color: '#5a5753', roughness: 0.95, metalness: 0.0 }, // Architectural greige
  'Charcoal': { color: '#161616', roughness: 0.95, metalness: 0.0 }, // Deep matte black
};

export type SideboardConfig = {
  width: number;
  height: number;
  depth: number;
  dividerCount: number;
  style: 'Pure' | 'Contrast';
  shellFinish: string;
  frontFinish: string;
};

export const defaultSideboardConfig: SideboardConfig = {
  width: 180,
  height: 60,
  depth: 40,
  dividerCount: 1,
  style: 'Contrast',
  shellFinish: 'H1385 ST40 Natural Casella Oak',
  frontFinish: 'Mushroom',
};

export function calculateVolume(config: SideboardConfig): number {
  return config.width * config.height * config.depth;
}

export function isValidConfig(config: SideboardConfig): boolean {
  return config.width > 0 && config.height > 0 && config.depth > 0;
}
