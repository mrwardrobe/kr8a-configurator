'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { SideboardConfig, FINISHES, PANEL_MM, REVEAL_MM, baseHeight, bayWidth, carcassHeight } from '../lib/sideboardEngine';

type View = 'three-quarter' | 'front' | 'side';
type Props = { config: SideboardConfig; view?: View; onFrontClick?: (index: number) => void; className?: string };
const mm = (value: number) => value / 1000;

function Box({ size, position, color, metal = false, grain }: {
  size: [number, number, number]; position: [number, number, number]; color: string; metal?: boolean; grain?: THREE.Texture | null;
}) {
  return <RoundedBox args={size} radius={Math.min(.0015, ...size.map(v => v / 5))} smoothness={2} castShadow receiveShadow position={position}>
    <meshStandardMaterial color={color} roughness={metal ? .42 : .7} metalness={metal ? .58 : 0} map={grain || undefined} />
  </RoundedBox>;
}

function Camera({ config, view }: { config: SideboardConfig; view: View }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const w = mm(config.width), h = mm(config.height), d = mm(config.depth);
    const radius = Math.sqrt(w * w + h * h + d * d) / 2;
    const perspective = camera as THREE.PerspectiveCamera;
    const fov = perspective.fov * Math.PI / 180;
    const aspectFactor = Math.min(1, size.width / Math.max(size.height, 1));
    const distance = radius / Math.sin(fov / 2) * (size.width < 900 ? Math.max(.8, 1.15 / Math.sqrt(size.width / Math.max(size.height, 1))) : aspectFactor < .8 ? 1.8 : 1.4);
    const dir = view === 'front' ? [0, .12, 1] : view === 'side' ? [1, .15, .05] : [1, .55, 1];
    const unit = new THREE.Vector3(...dir).normalize();
    camera.position.copy(unit.multiplyScalar(distance));
    camera.lookAt(0, size.width >= 900 ? -.72 : 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, config.width, config.height, config.depth, size.width, size.height, view]);
  return <OrbitControls makeDefault target={[0, size.width >= 900 ? -.72 : 0, 0]} enablePan={false} minDistance={1.5} maxDistance={10} maxPolarAngle={Math.PI * .53} />;
}

function Door({ x, cy, frontZ, faceW, faceH, thickness, left, open, onClick, shell, grain, handle, handleColor }: {
  x: number; cy: number; frontZ: number; faceW: number; faceH: number; thickness: number;
  left: boolean; open: boolean; onClick: () => void; shell: string; grain: THREE.Texture | null;
  handle: SideboardConfig['handle']; handleColor: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const hingeX = x + (left ? -faceW / 2 : faceW / 2);
  const shift = left ? faceW / 2 : -faceW / 2;
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, open ? (left ? -Math.PI * .48 : Math.PI * .48) : 0, 6, delta);
  });
  return <group ref={ref} position={[hingeX, cy, frontZ]} onClick={event => { event.stopPropagation(); onClick(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
    <Box size={[faceW, faceH, thickness]} position={[shift, 0, 0]} color={shell} grain={grain} />
    {handle !== 'push' && <Box size={[handle === 'bar' ? .011 : .055, handle === 'bar' ? .12 : .008, .018]}
      position={[shift + (left ? faceW * .37 : -faceW * .37), faceH * .24, thickness / 2 + .008]} color={handleColor} metal />}
    {[-1, 1].map((level) => <group key={level} position={[0, level * (faceH / 2 - .105), -thickness / 2 - .012]}>
      <Box size={[.032, .018, .025]} position={[left ? .008 : -.008, 0, 0]} color="#55534e" metal />
      <Box size={[.014, .045, .012]} position={[left ? -.009 : .009, 0, -.01]} color="#77736c" metal />
    </group>)}
  </group>;
}

function Drawer({ x, y, frontZ, faceW, drawerH, depth, thickness, open, delay, shell, inside, grain, handle, handleColor, onClick }: {
  x: number; y: number; frontZ: number; faceW: number; drawerH: number; depth: number; thickness: number;
  open: boolean; delay: number; shell: string; inside: string; grain: THREE.Texture | null;
  handle: SideboardConfig['handle']; handleColor: string; onClick: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, open ? .16 - delay : 0, open ? 4.5 : 3.1, delta);
  });
  const boxDepth = Math.max(.15, depth - .08);
  return <group ref={ref} onClick={event => { event.stopPropagation(); onClick(); }} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
    <Box size={[faceW, drawerH, thickness]} position={[x, y, frontZ]} color={shell} grain={grain} />
    {handle !== 'push' && <Box size={[handle === 'bar' ? .11 : faceW * .36, .007, .014]} position={[x, y + drawerH * .18, frontZ + thickness / 2 + .009]} color={handleColor} metal />}
    <Box size={[faceW - .04, .012, boxDepth]} position={[x, y - drawerH / 2 + .025, frontZ - boxDepth / 2]} color={inside} />
    {[-1, 1].map(side => <Box key={side} size={[.012, drawerH * .7, boxDepth]} position={[x + side * (faceW / 2 - .026), y - .018, frontZ - boxDepth / 2]} color={inside} />)}
    {[-1, 1].map(side => <Box key={`runner-${side}`} size={[.006, .01, boxDepth * .75]} position={[x + side * (faceW / 2 - .015), y - drawerH * .25, frontZ - boxDepth / 2]} color="#77736c" metal />)}
  </group>;
}

function Model({ config, onFrontClick }: Pick<Props, 'config' | 'onFrontClick'>) {
  const [openDoors, setOpenDoors] = useState<Record<number, boolean>>({});
  const [openDrawers, setOpenDrawers] = useState<Record<number, boolean>>({});
  useEffect(() => { setOpenDoors({}); setOpenDrawers({}); }, [config.fronts.join('')]);
  const finish = FINISHES.find(f => f.id === config.finish) ?? FINISHES[0];
  const interior = config.interior === 'match' ? finish : FINISHES.find(f => f.id === config.interior) ?? finish;
  const grain = useMemo(() => {
    if (!finish.grain || typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext('2d'); if (!context) return null;
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 180; i++) {
      const x = (i * 47) % 256;
      context.strokeStyle = `rgba(49,31,15,${.025 + (i % 7) * .006})`;
      context.lineWidth = i % 17 === 0 ? 2 : .5;
      context.beginPath(); context.moveTo(x, 0);
      context.bezierCurveTo(x + (i % 5) * 2, 80, x - (i % 4) * 2, 160, x + (i % 3), 256);
      context.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [finish.grain]);
  useEffect(() => () => { grain?.dispose(); }, [grain]);
  const w = mm(config.width), h = mm(config.height), d = mm(config.depth);
  const bh = mm(baseHeight(config.base));
  const ch = mm(carcassHeight(config));
  const t = mm(PANEL_MM), reveal = mm(REVEAL_MM);
  const cy = -h / 2 + bh + ch / 2;
  const bayCount = config.fronts.length;
  const bw = mm(bayWidth(config.width, bayCount));
  const clearH = ch - 2 * t;
  const frontZ = d / 2 + t / 2 - .006;
  const bayX = (i: number) => -w / 2 + t + bw / 2 + i * (bw + t);
  const shell = finish.color, inside = interior.color;
  const handleColor = '#6a533c';
  return <group>
    {/* Carcass: panel measurements derive from the same normalized configuration as the review sheet. */}
    <Box size={[w, t, d]} position={[0, cy + ch / 2 - t / 2, 0]} color={shell} grain={grain} />
    <Box size={[w - 2 * t, t, d - t]} position={[0, cy - ch / 2 + t / 2, t / 2]} color={inside} />
    {[-1, 1].map(side => <Box key={side} size={[t, ch - 2 * t, d]} position={[side * (w / 2 - t / 2), cy, 0]} color={shell} grain={grain} />)}
    <Box size={[w - 2 * t, clearH, t]} position={[0, cy, -d / 2 + t / 2]} color={inside} />
    {Array.from({ length: bayCount - 1 }, (_, i) => <Box key={`divider-${i}`} size={[t, clearH, d - t]} position={[(bayX(i) + bayX(i + 1)) / 2, cy, t / 2]} color={inside} />)}
    {config.fronts.map((front, i) => {
      const x = bayX(i);
      const levels = front === 'R' ? 0 : config.inside[i] === 'V' ? 0 : config.shelves[i];
      return <group key={`inside-${i}`}>
        {Array.from({ length: levels }, (_, j) => <Box key={j} size={[bw - .008, t, d - 2 * t]} position={[x, cy - clearH / 2 + (j + 1) * clearH / (levels + 1), 0]} color={inside} />)}
        {config.inside[i] === 'V' && front !== 'R' && [-1, 0, 1].map(v => <Box key={v} size={[t * .65, clearH * .65, d - 2 * t]} position={[x + v * bw / 4, cy - clearH * .175, 0]} color={inside} />)}
        {config.inside[i] === 'I' && front === 'D' && [0, 1].map(j => <Box key={j} size={[bw - .025, clearH / 4, t]} position={[x, cy - clearH / 2 + (j + 1) * clearH / 3, d / 2 - .045]} color={inside} />)}
      </group>;
    })}
    {config.fronts.map((front, i) => {
      const x = bayX(i), faceW = bw - reveal, faceH = clearH - reveal;
      if (front === 'O') return null;
      if (front === 'R') {
        const drawerH = (faceH - 2 * reveal) / 3;
        return <group key={`front-${i}`}>
          {[0, 1, 2].map(j => <Drawer key={j} x={x} y={cy + faceH / 2 - drawerH / 2 - j * (drawerH + reveal)} frontZ={frontZ}
            faceW={faceW} drawerH={drawerH} depth={d} thickness={t} open={!!openDrawers[i]} delay={j * .014}
            shell={shell} inside={inside} grain={grain} handle={config.handle} handleColor={handleColor}
            onClick={() => { setOpenDrawers(o => ({ ...o, [i]: !o[i] })); onFrontClick?.(i); }} />)}
        </group>;
      }
      const left = i < bayCount / 2;
      return <Door key={`front-${i}`} x={x} cy={cy} frontZ={frontZ} faceW={faceW} faceH={faceH} thickness={t}
        left={left} open={!!openDoors[i]} shell={shell} grain={grain} handle={config.handle} handleColor={handleColor}
        onClick={() => { setOpenDoors(o => ({ ...o, [i]: !o[i] })); onFrontClick?.(i); }} />;
    })}
    {config.base === 'plinth' && <Box size={[w - .13, bh, d - .11]} position={[0, -h / 2 + bh / 2, -.014]} color={shell} />}
    {(config.base === 'timber' || config.base === 'metal') && [-1, 1].flatMap(x => [-1, 1].map(z => <Box key={`${x}-${z}`} size={[config.base === 'metal' ? .018 : .04, bh, config.base === 'metal' ? .018 : .04]} position={[x * (w / 2 - .09), -h / 2 + bh / 2, z * (d / 2 - .07)]} color={config.base === 'metal' ? '#333734' : shell} metal={config.base === 'metal'} />))}
  </group>;
}

export default function Sideboard({ config, view = 'three-quarter', onFrontClick, className = '' }: Props) {
  return <div className={`viewer ${className}`} aria-label="Interactive 3D sideboard. Drag to rotate; click doors or drawers to open them.">
    <Canvas shadows dpr={[1, 1.8]} camera={{ fov: 35, position: [3, 2, 3] }}>
      <color attach="background" args={['#e8e0d2']} />
      <ambientLight intensity={.9} />
      <directionalLight position={[-3, 6, 5]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-.0002} />
      <directionalLight position={[5, 4, -3]} intensity={.65} />
      <ContactShadows position={[0, -config.height / 2000 - .001, 0]} opacity={.35} scale={4} blur={2.5} far={1.5} color="#3d342a" />
      <mesh receiveShadow position={[0, -config.height / 2000 - .002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} /><meshStandardMaterial color="#e8e0d2" roughness={1} />
      </mesh>
      <Model config={config} onFrontClick={onFrontClick} />
      <Camera config={config} view={view} />
    </Canvas>
  </div>;
}
