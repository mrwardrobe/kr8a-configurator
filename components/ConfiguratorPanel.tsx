'use client';

import { SideboardConfig, WOODS, MATTES, FINISH_MAP } from '../lib/sideboardEngine';

type Props = {
  config: SideboardConfig;
  onChange: (config: SideboardConfig) => void;
};

function DimensionSlider({
  label,
  value,
  min,
  max,
  unit,
  onValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onValue: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 group">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">{label}</span>
        <span className="text-sm tabular-nums font-medium text-neutral-900">
          {value}{unit}
        </span>
      </div>
      <div className="relative flex items-center h-4">
        <div className="absolute w-full h-[2px] bg-neutral-200 rounded-full" />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onValue(Number(e.target.value))}
          className="relative w-full h-4 bg-transparent appearance-none cursor-pointer accent-neutral-900 z-10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neutral-900 [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md"
        />
      </div>
    </div>
  );
}

function FinishSwatchPicker({
  label,
  value,
  options,
  onValue,
}: {
  label: string;
  value: string;
  options: string[];
  onValue: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">{label}</span>
      <div className="grid grid-cols-3 gap-x-3 gap-y-4">
        {options.map((opt) => {
          const isSelected = value === opt;
          const bg = FINISH_MAP[opt]?.color || '#ffffff';
          const isWood = WOODS.includes(opt);

          const woodGrainPattern = `
            linear-gradient(90deg, 
              rgba(0,0,0,0.02) 0%, 
              rgba(0,0,0,0) 15%, 
              rgba(0,0,0,0.08) 30%, 
              rgba(0,0,0,0) 50%, 
              rgba(0,0,0,0.04) 75%, 
              rgba(0,0,0,0) 90%, 
              rgba(0,0,0,0.1) 100%
            ),
            repeating-linear-gradient(
              to right,
              transparent,
              transparent 1px,
              rgba(0,0,0,0.04) 1px,
              rgba(0,0,0,0.04) 3px
            )
          `;

          const inlineStyle = isWood
            ? { backgroundColor: bg, backgroundImage: woodGrainPattern }
            : { backgroundColor: bg };

          return (
            <button
              key={opt}
              type="button"
              onClick={() => onValue(opt)}
              className="flex flex-col items-center gap-2 group outline-none"
            >
              <div
                className={`w-full aspect-square rounded-md shadow-sm border transition-all duration-300 cursor-pointer ${
                  isSelected ? 'border-neutral-900 ring-2 ring-neutral-900/10 scale-[1.05]' : 'border-neutral-200 group-hover:border-neutral-400'
                }`}
                style={inlineStyle}
              />
              <span className={`text-[9px] leading-tight text-center tracking-tight transition-colors duration-200 ${
                isSelected ? 'text-neutral-900 font-semibold' : 'text-neutral-500'
              }`}>
                {opt.split(' ').slice(0, 2).join(' ')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ConfiguratorPanel({ config, onChange }: Props) {
  const update = <K extends keyof SideboardConfig>(key: K, value: SideboardConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <aside className="w-[340px] h-full bg-[#fcfaf7] border-r border-neutral-200/60 p-10 flex flex-col gap-10 shadow-[20px_0_40px_rgba(0,0,0,0.01)] z-10 selection:bg-neutral-900 selection:text-white">
      <header className="space-y-1">
        <h1 className="text-2xl font-light text-neutral-900 tracking-[-0.02em] font-serif">
          KR8A <span className="text-neutral-300 font-sans text-lg ml-1">Series</span>
        </h1>
        <p className="text-[13px] text-neutral-400 leading-relaxed font-medium">
          Modular Sideboard System v1.0
        </p>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 flex flex-col gap-12 scrollbar-hide">
        {/* Dimensions Section */}
        <section className="space-y-8">
          <DimensionSlider
            label="Width"
            value={config.width}
            min={60}
            max={240}
            unit="cm"
            onValue={(v) => update('width', v)}
          />
          <DimensionSlider
            label="Height"
            value={config.height}
            min={30}
            max={120}
            unit="cm"
            onValue={(v) => update('height', v)}
          />
          <DimensionSlider
            label="Depth"
            value={config.depth}
            min={20}
            max={60}
            unit="cm"
            onValue={(v) => update('depth', v)}
          />
        </section>

        {/* Layout Section */}
        <section className="space-y-6">
          <DimensionSlider
            label="Internal Bays"
            value={config.dividerCount}
            min={1}
            max={4}
            unit=""
            onValue={(v) => update('dividerCount', v)}
          />

          <div className="flex flex-col gap-4 pt-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">Finish Logic</span>
            <div className="flex p-1 bg-neutral-200/50 rounded-lg">
              {(['Pure', 'Contrast'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => update('style', s)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                    config.style === s 
                      ? 'bg-white text-neutral-900 shadow-sm' 
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Material Section */}
        <section className="space-y-8 pb-4">
          {config.style === 'Pure' ? (
            <FinishSwatchPicker
              label="Overall Material"
              value={config.shellFinish}
              options={[...WOODS, ...MATTES]}
              onValue={(v) => onChange({ ...config, shellFinish: v, frontFinish: v })}
            />
          ) : (
            <>
              <FinishSwatchPicker
                label="Exterior Shell"
                value={config.shellFinish}
                options={WOODS}
                onValue={(v) => update('shellFinish', v)}
              />
              <FinishSwatchPicker
                label="Interior & Doors"
                value={config.frontFinish}
                options={MATTES}
                onValue={(v) => update('frontFinish', v)}
              />
            </>
          )}
        </section>
      </div>

      <footer className="pt-6 border-t border-neutral-200/60">
        <button className="w-full py-5 px-6 bg-neutral-900 text-white text-[13px] font-bold rounded-2xl hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-neutral-900/10">
          Request Quote
        </button>
      </footer>
    </aside>
  );
}
