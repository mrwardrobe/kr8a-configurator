'use client';

import { useEffect, useRef, useState } from 'react';
import { SideboardConfig, toPrototypeConfig } from '../lib/sideboardEngine';

type View = 'three-quarter' | 'front' | 'side' | 'detail';
type ViewerElement = HTMLElement & {
  config: object; view: string; opened: string; dims: boolean; styled: boolean;
  wall: number; idle: boolean; spin: boolean; pad: number; top: number;
};
type Props = {
  config: SideboardConfig; view?: View; onFrontClick?: (index: number) => void;
  className?: string; openAll?: boolean; dimensions?: boolean; styled?: boolean;
  wall?: number; idle?: boolean; spin?: boolean; pad?: number; top?: number;
};
const viewId = { 'three-quarter': '34', front: 'front', side: 'side', detail: 'detail' } as const;

/** Adapter around the supplied Claude Design viewer. Its Three.js modules are
 * bundled from this project instead of fetched from esm.sh at runtime. */
export default function Sideboard({ config, view = 'three-quarter', onFrontClick, className = '', openAll = false,
  dimensions = false, styled = true, wall = 0, idle = true, spin = false, pad = 0, top = 0 }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const element = useRef<ViewerElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([import('../lib/KR8AEngineRuntime.js'), import('./KR8AViewerRuntime.js')]).then(() => {
      if (!active || !root.current) return;
      const viewer = document.createElement('kr8a-viewer') as ViewerElement;
      root.current.appendChild(viewer);
      element.current = viewer;
      setReady(true);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; element.current?.remove(); element.current = null; };
  }, []);

  useEffect(() => {
    const viewer = element.current;
    if (!viewer || !ready) return;
    viewer.config = toPrototypeConfig(config);
    viewer.view = viewId[view];
    viewer.opened = openAll ? 'all' : 'none';
    viewer.dims = dimensions;
    viewer.styled = styled;
    viewer.wall = wall;
    viewer.idle = idle;
    viewer.spin = spin;
    viewer.pad = pad;
    viewer.top = top;
  }, [config, view, openAll, dimensions, styled, wall, idle, spin, pad, top, ready]);

  useEffect(() => {
    if (!onFrontClick) return;
    const handler = (event: Event) => onFrontClick((event as CustomEvent<{ bay: number }>).detail.bay);
    window.addEventListener('kr8a-bay', handler);
    return () => window.removeEventListener('kr8a-bay', handler);
  }, [onFrontClick]);

  return <div ref={root} className={`viewer ${className}`} aria-label="Interactive 3D sideboard. Drag to rotate; click doors or drawers to open them.">{error && <p role="alert">The 3D view could not load. Your design choices are still saved.</p>}</div>;
}
