'use client';

import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SideboardConfig, FINISH_MAP } from '../lib/sideboardEngine';

/** Panel thickness in meters (18 mm) */
const T = 0.018;

/** Reveal gap in meters (3 mm) */
const R = 0.003;

/** Plinth height in meters (60 mm) */
const PH = 0.060;

/** Plinth recess from front/back face in meters (50 mm) */
const PRE = 0.050;

/** Fixed viewing direction (normalised 3/4 view) */
const VIEW_DIR = new THREE.Vector3(1, 0.65, 1).normalize();

/** Framing margin multiplier */
const FRAME_MARGIN = 1.35;

/** Deterministic camera framing from model bounds */
function Framing({ w, h, d }: { w: number; h: number; d: number }) {
  const { camera, controls } = useThree();
  const totalH = h + PH;

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const radius = Math.sqrt(w * w + totalH * totalH + d * d) / 2;
    const fovRad = (cam.fov * Math.PI) / 180;
    const dist = (radius / Math.sin(fovRad / 2)) * FRAME_MARGIN;

    cam.position.copy(VIEW_DIR.clone().multiplyScalar(dist));
    cam.updateProjectionMatrix();

    if (controls) {
      (controls as any).target.set(0, 0, 0);
      (controls as any).update();
    }
  }, [w, totalH, d, camera, controls]);

  return null;
}

type Props = {
  config: SideboardConfig;
};

export default function Sideboard({ config }: Props) {
  const w = config.width / 100;
  const h = config.height / 100;
  const d = config.depth / 100;

  const sideH = h + PH;              // Sides run from top cap to floor
  const innerW = w - 2 * T;          // Width between sides
  const innerD = d - 0.020;          // Internal bottom depth (stepped back 20mm)
  const dividerH = h - 2 * T;        // Divider: bottom panel top to cap underside

  // Materials
  // Procedural wood grain generator (memory-only, no image textures)
  const { grainH, grainV } = useMemo(() => {
    if (typeof document === 'undefined') return { grainH: null, grainV: null };
    const createGrain = (vertical: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff'; // White base multiplies cleanly with the hex colors
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#000000'; // Dark streaks
      for (let i = 0; i < 500; i++) {
        ctx.globalAlpha = Math.random() * 0.08 + 0.02;
        if (vertical) {
          ctx.fillRect(Math.random() * 512, 0, Math.random() * 2 + 0.5, 512);
        } else {
          ctx.fillRect(0, Math.random() * 512, 512, Math.random() * 2 + 0.5);
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = (THREE as any).SRGBColorSpace || (THREE as any).sRGBEncoding;
      return tex;
    };
    return { grainH: createGrain(false), grainV: createGrain(true) };
  }, []);

  const shellOpt = FINISH_MAP[config.shellFinish] || FINISH_MAP['H1385 ST40 Natural Casella Oak'];
  const innerOpt = FINISH_MAP[config.frontFinish] || FINISH_MAP['Mushroom'];

  // Materials
  const topCapMap = useMemo(() => {
    if (!grainH) return undefined;
    const tex = grainH.clone();
    tex.repeat.set(w * 2, d * 2);
    tex.needsUpdate = true;
    return tex;
  }, [grainH, w, d]);

  const sideMap = useMemo(() => {
    if (!grainV) return undefined;
    const tex = grainV.clone();
    tex.repeat.set(d * 2, sideH * 2);
    tex.needsUpdate = true;
    return tex;
  }, [grainV, d, sideH]);

  const outerMaterialH = (
    <meshStandardMaterial 
      color={shellOpt.color} 
      roughness={shellOpt.roughness} 
      metalness={shellOpt.metalness} 
      map={topCapMap} 
      bumpMap={topCapMap} 
      bumpScale={0.001} 
    />
  );
  const outerMaterialV = (
    <meshStandardMaterial 
      color={shellOpt.color} 
      roughness={shellOpt.roughness} 
      metalness={shellOpt.metalness} 
      map={sideMap} 
      bumpMap={sideMap} 
      bumpScale={0.001} 
    />
  );
  const innerMaterial = <meshStandardMaterial color={innerOpt.color} roughness={innerOpt.roughness} metalness={innerOpt.metalness} />;

  // Parametric divider system
  const dividerCount = config.dividerCount;
  const bayCount = dividerCount + 1;
  const bayW = (innerW - dividerCount * T) / bayCount;  // Even bay width
  const dividerXPositions = Array.from({ length: dividerCount }, (_, i) =>
    -innerW / 2 + (i + 1) * bayW + (i + 0.5) * T
  );

  const bayBackH = h - 2 * T;        // Bay back: overall height minus 36mm

  // Shelf geometry (one per bay)
  const shelfClearance = 0.002;                       // 2mm clearance each side
  const shelfW = bayW - 2 * shelfClearance;           // Bay width minus clearance
  const shelfY = -T / 2;                              // Centered vertically
  const shelfZ = -0.010;                              // Same Z as internal panels

  // Inset door geometry
  const S = 0.002;                            // Front setback: 2mm inset behind side fronts
  const doorW = (innerW - (bayCount + 1) * R) / bayCount; // Each door: inner width minus reveals
  const doorH = h - T - R;                   // Flush bottom to 3mm below applied top cap underside
  const doorCZ = d / 2 - T / 2 - S;          // Inset: 2mm behind side panel front faces
  const doorCY = -T / 2 - R / 2;             // Center Y: flush bottom + top reveal from cap

  // TAU Handle geometry
  const handleW = 0.012;                     // 12mm slim vertical profile
  const handleH = 0.160;                     // 160mm tall pull
  const handleD = 0.024;                     // 24mm deep
  const handleMargin = 0.035;                // 35mm inset from the opening edge
  const handleY = doorH * 0.15;              // Centered in the upper-middle zone
  const handleZ = T / 2 + handleD / 2;       // Pushing out from the front face of the door

  // Plinth underframe geometry — recessed horizontal rails
  const plinthRailW = innerW;                         // Rail width: between side panels
  const plinthFrontZ = d / 2 - PRE;                   // Front rail Z: recessed 50mm from front
  const plinthBackZ = -d / 2 + PRE;                   // Back rail Z: recessed 50mm from back
  const torsionRailD = plinthFrontZ - plinthBackZ - T; // Torsion rail depth: between inner faces of horiz rails
  const plinthCY = -h / 2 - PH / 2;                   // Plinth center Y (in shifted space)

  return (
    <div className="w-full h-full bg-[#f5f5f7]">
      <Canvas shadows camera={{ position: [3, 2, 3], fov: 35 }}>
        {/* Soft premium studio lighting */}
        <ambientLight intensity={0.5} />
        <Environment preset="studio" environmentIntensity={0.25} />
        <directionalLight 
          position={[-4, 6, 6]} 
          intensity={1.4} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        >
          <orthographicCamera attach="shadow-camera" args={[-2.5, 2.5, 2.5, -2.5, 0.1, 20]} />
        </directionalLight> {/* Bright soft key light from upper front-left */}
        <directionalLight position={[5, 4, 4]} intensity={0.6} /> {/* Softer fill light from upper front-right */}
        <directionalLight position={[10, 2, 2]} intensity={0.4} /> {/* Gentle side fill to lift shell textures */}
        <directionalLight position={[0, 5, -6]} intensity={0.4} /> {/* Subtle rim / separation light from above-rear */}

        {/* Premium contact shadow under the cabinet footprint */}
        <ContactShadows
          position={[0, -h / 2 - PH / 2 + 0.001, 0]}
          opacity={0.9}
          scale={w * 2.5}
          blur={2.4}
          resolution={1024}
          far={h}
          color="#000000"
        />

        {/* Solid neutral floor plane with built-in shadow receiving */}
        <mesh position={[0, -h / 2 - PH / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#f0f0f2" roughness={1} metalness={0} />
        </mesh>

        {/* Subtle studio backdrop plane */}
        <mesh position={[0, 0, -d * 4]} rotation={[0, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="#e5e5e7" />
        </mesh>

        <Framing w={w} h={h} d={d} />

        {/* Outer group: shift everything up by PH/2 to keep assembly centered */}
        <group position={[0, PH / 2, 0]}>

          {/* ── Cabinet body ── */}
          <group>
            {/* Applied top cap — full width, full depth, sits on top */}
            <mesh castShadow receiveShadow position={[0, h / 2 - T / 2, 0]}>
              <boxGeometry args={[w, T, d]} />
              {outerMaterialH}
            </mesh>

            {/* Left side panel — full depth, runs from top cap down to floor */}
            <mesh castShadow receiveShadow position={[-w / 2 + T / 2, -PH / 2, 0]}>
              <boxGeometry args={[T, sideH, d]} />
              {outerMaterialV}
            </mesh>

            {/* Right side panel — mirror of left */}
            <mesh castShadow receiveShadow position={[w / 2 - T / 2, -PH / 2, 0]}>
              <boxGeometry args={[T, sideH, d]} />
              {outerMaterialV}
            </mesh>

            {/* Internal bottom panel — between sides, stepped back 20mm */}
            <mesh castShadow receiveShadow position={[0, -h / 2 + T / 2, -0.010]}>
              <boxGeometry args={[innerW, T, innerD]} />
              {innerMaterial}
            </mesh>

            {/* Parametric inset back panels — one per bay */}
            {Array.from({ length: bayCount }, (_, i) => {
              const cx = -innerW / 2 + i * (bayW + T) + bayW / 2;
              return (
                <mesh castShadow receiveShadow key={`back-panel-${i + 1}`} position={[cx, 0, -d / 2 + T / 2]}>
                  <boxGeometry args={[bayW, bayBackH, T]} />
                  {innerMaterial}
                </mesh>
              );
            })}

            {/* Parametric vertical dividers */}
            {dividerXPositions.map((x, i) => (
              <mesh castShadow receiveShadow key={`divider-${i + 1}`} position={[x, 0, -0.010]}>
                <boxGeometry args={[T, dividerH, innerD]} />
                {innerMaterial}
              </mesh>
            ))}

            {/* Parametric bay shelves — one per bay */}
            {Array.from({ length: bayCount }, (_, i) => {
              const cx = -innerW / 2 + i * (bayW + T) + bayW / 2;
              return (
                <mesh castShadow receiveShadow key={`shelf-${i + 1}`} position={[cx, shelfY, shelfZ]}>
                  <boxGeometry args={[shelfW, T, innerD]} />
                  {innerMaterial}
                </mesh>
              );
            })}

            {/* Parametric inset doors — one per bay, open for inspection */}
            {Array.from({ length: bayCount }, (_, i) => {
              const cx = -innerW / 2 + R + i * (doorW + R) + doorW / 2;
              const isHingedLeft = i < bayCount / 2;
              const hingeX = isHingedLeft ? cx - doorW / 2 : cx + doorW / 2;
              const hingeRot = 0; // Return doors to closed neutral position
              const meshShift = isHingedLeft ? doorW / 2 : -doorW / 2;
              const handleX = isHingedLeft ? doorW - handleMargin - handleW / 2 : -doorW + handleMargin + handleW / 2;

              return (
                <group
                  key={`door-${i + 1}`}
                  position={[hingeX, doorCY, doorCZ]}
                  rotation={[0, hingeRot, 0]}
                >
                  <mesh castShadow receiveShadow position={[meshShift, 0, 0]}>
                    <boxGeometry args={[doorW, doorH, T]} />
                    {innerMaterial}
                  </mesh>
                  {/* TAU Handle */}
                  <mesh castShadow receiveShadow position={[handleX, handleY, handleZ]}>
                    <boxGeometry args={[handleW, handleH, handleD]} />
                    <meshStandardMaterial color="#2c2c2e" roughness={0.5} metalness={0.4} />
                  </mesh>
                </group>
              );
            })}
          </group>

          {/* ── Plinth underframe — recessed horizontal rails ── */}
          <group>
            {/* Front horizontal rail — runs left-to-right, recessed behind front face */}
            <mesh castShadow receiveShadow position={[0, plinthCY, plinthFrontZ]}>
              <boxGeometry args={[plinthRailW, PH, T]} />
              {innerMaterial}
            </mesh>

            {/* Back horizontal rail — runs left-to-right, recessed behind back face */}
            <mesh castShadow receiveShadow position={[0, plinthCY, plinthBackZ]}>
              <boxGeometry args={[plinthRailW, PH, T]} />
              {innerMaterial}
            </mesh>

            {/* Centre torsion rail — runs front-to-back between horizontal rails */}
            <mesh castShadow receiveShadow position={[0, plinthCY, (plinthFrontZ + plinthBackZ) / 2]}>
              <boxGeometry args={[T, PH, torsionRailD]} />
              {innerMaterial}
            </mesh>
          </group>

        </group>

        <OrbitControls
          makeDefault
          target={[0, 0, 0]}
          enableRotate={true}
          enableZoom={true}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
}
