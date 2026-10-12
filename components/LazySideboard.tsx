'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { SideboardConfig } from '../lib/sideboardEngine';

const Sideboard = dynamic(() => import('./Sideboard'), { ssr: false, loading: () => <div className="viewer-loading" aria-label="Loading interactive sideboard">Preparing your 3D view…</div> });
export default function LazySideboard({ config }: { config: SideboardConfig }) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => { if (entries[0]?.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: '500px' });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={root} className="viewer">{visible ? <Sideboard config={config} /> : <div className="viewer-loading" aria-hidden="true">3D preview</div>}</div>;
}
