'use client';

import { useState } from 'react';
import Sideboard from '../components/Sideboard';
import ConfiguratorPanel from '../components/ConfiguratorPanel';
import { defaultSideboardConfig, SideboardConfig } from '../lib/sideboardEngine';

export default function Home() {
  const [config, setConfig] = useState<SideboardConfig>(defaultSideboardConfig);

  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#fdfcfb] selection:bg-neutral-900 selection:text-white">
      {/* Sidebar: Premium Configurator Panel */}
      <ConfiguratorPanel config={config} onChange={setConfig} />

      {/* Main Viewport: Architectural 3D Scene */}
      <div className="flex-1 h-full min-w-0 relative bg-white/50 backdrop-blur-sm">
        <Sideboard config={config} />
        
        {/* Subtle UI Overlay elements could go here if needed later */}
      </div>
    </main>
  );
}
