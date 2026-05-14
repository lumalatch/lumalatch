"use client";

import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore } from '../../../lib/useScrollStore';
import { COLORS } from '../../../lib/useGlobalMotion';
import { CHOREOGRAPHY, MESH_TRANSMISSION_MATERIAL } from '../../../lib/SceneRegistry';

interface HiddenDataPoint {
  position: [number, number, number];
  text: string;
  revealed: boolean;
}

const DATA_POINTS: HiddenDataPoint[] = [
  { position: [-2, 0.5, 0], text: 'V-GAP: 0.3mm', revealed: false },
  { position: [2, 0.5, 0], text: 'OCCLUSION: 98.7%', revealed: false },
  { position: [0, -1, 0], text: 'LUMINANCE: 520.4nm', revealed: false },
  { position: [-1.5, -0.5, 0.5], text: 'SHADOW DEPTH: #050505', revealed: false },
  { position: [1.5, -0.5, 0.5], text: 'BOUNCE: 0.0%', revealed: false },
  { position: [0, 1.2, 0.3], text: 'WEAVE DENSITY: 84 TPI', revealed: false },
];

interface OcclusionDiscoveryProps {
  scrollProgress?: number;
  isActive?: boolean;
  opacity?: number;
}

export default function OcclusionDiscovery({ scrollProgress, isActive, opacity }: OcclusionDiscoveryProps) {
  const groupRef = useRef<THREE.Group>(null);
  const weaveMeshRef = useRef<THREE.Mesh>(null);
  const searchlightRef = useRef<THREE.PointLight>(null);
  const { camera, gl } = useThree();
  const { scroll, velocity } = useScrollStore();
  
  const progress = scrollProgress ?? scroll;
  const [revealedData, setRevealedData] = useState<Set<number>>(new Set());
  
  // Track searchlight state
  const searchlightState = useRef<{
    x: number;
    y: number;
    wavelength: number;
    sweepAngle: number;
  }>({ x: 0, y: 0, wavelength: 520.4, sweepAngle: 0 });
  
  useFrame((state) => {
    if (!groupRef.current || !weaveMeshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const deltaTime = state.clock.getDelta();
    
    // Calculate occlusion scan progress
    const scanStart = 0.43;
    const scanEnd = 0.70;
    const scanFactor = Math.max(0, Math.min(1, (progress - scanStart) / (scanEnd - scanStart)));
    const easeScan = scanFactor * scanFactor * (3 - 2 * scanFactor);
    
    // Apply inertia-based motion with friction and harmonic decay
    const friction = CHOREOGRAPHY.INERTIA_ENGINE.frictionCoefficient;
    const decayFreq = CHOREOGRAPHY.INERTIA_ENGINE.harmonicDecayHz;
    const damping = Math.exp(-decayFreq * deltaTime);
    
    // Searchlight follows mouse/gyroscope (simulated via sine wave for auto-sweep)
    searchlightState.current.sweepAngle = time * 0.5;
    searchlightState.current.x = Math.sin(searchlightState.current.sweepAngle) * 3;
    searchlightState.current.y = Math.cos(searchlightState.current.sweepAngle * 0.7) * 2;
    
    // Update searchlight position
    if (searchlightRef.current) {
      searchlightRef.current.position.lerp(
        new THREE.Vector3(
          searchlightState.current.x,
          searchlightState.current.y,
          3
        ),
        0.05 * damping
      );
      
      // 520.4nm light (green-cyan)
      searchlightRef.current.color.setHex(0x49FF9C);
      searchlightRef.current.intensity = 2 + Math.sin(time * 2) * 0.5;
    }
    
    // Weave mesh subtle rotation
    weaveMeshRef.current.rotation.y = Math.sin(time * 0.3) * 0.05;
    weaveMeshRef.current.rotation.x = Math.sin(time * 0.2) * 0.03;
    
    // Check which data points are revealed by searchlight
    DATA_POINTS.forEach((point, i) => {
      const dx = point.position[0] - searchlightState.current.x;
      const dy = point.position[1] - searchlightState.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 1.2 && !revealedData.has(i)) {
        setRevealedData(prev => new Set(prev).add(i));
      }
    });
    
    // Camera FOV punch preparation (transition to Act IV)
    const baseFov = 40;
    const targetFov = baseFov + easeScan * 30;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.02);
    camera.updateProjectionMatrix();
  });
  
  // Reset revealed data when act becomes inactive
  React.useEffect(() => {
    if (!isActive) {
      setRevealedData(new Set());
    }
  }, [isActive]);
  
  return (
    <group ref={groupRef} position={[0, 0, -6]} opacity={opacity}>
      {/* Absolute black background - shadows with zero secondary bounce */}
      <mesh visible={false}>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial color="#050505" />
      </mesh>
      
      {/* V-gap weave structure */}
      <mesh ref={weaveMeshRef}>
        <boxGeometry args={[6, 4, 0.3]} />
        <meshPhysicalMaterial
          color="#0a0a0a"
          roughness={MESH_TRANSMISSION_MATERIAL.roughness}
          metalness={MESH_TRANSMISSION_MATERIAL.metalness}
          transmission={0}
          thickness={1}
          envMapIntensity={0.2}
        />
      </mesh>
      
      {/* Herringbone pattern on weave surface */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[(i - 6) * 0.5, 0, 0.16]} rotation={[0, 0, i % 2 === 0 ? 0.7 : -0.7]}>
          <boxGeometry args={[0.3, 3, 0.02]} />
          <meshStandardMaterial color="#111111" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
      
      {/* Searchlight - 520.4nm light sweep mapped to mouse/gyro */}
      <pointLight
        ref={searchlightRef}
        position={[0, 0, 3]}
        intensity={2}
        color={COLORS.brightEmerald}
        distance={8}
        decay={2}
      />
      
      {/* Hidden data points - invisible until searchlight passes over */}
      {DATA_POINTS.map((point, i) => (
        <Html
          key={i}
          position={point.position}
          center
          transform
          occlude="blending"
          distanceFactor={1.5}
          style={{
            opacity: revealedData.has(i) ? 1 : 0,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          <div className="border border-[#B4FFC8]/40 backdrop-blur-xl bg-black/90 py-2 px-4 rounded-sm pointer-events-none">
            <p className="text-[8px] font-mono text-[#B4FFC8] uppercase tracking-widest">
              {point.text}
            </p>
          </div>
        </Html>
      ))}
      
      {/* Title */}
      <Html position={[0, 4.5, 0]} center transform occlude="blending" distanceFactor={1.5}>
        <div className="pointer-events-none select-none text-center">
          <h2 className="text-[10px] font-mono text-[#B4FFC8] uppercase tracking-[0.4em] mb-2">
            Act III: The Occlusion Discovery
          </h2>
          <h3 className="text-3xl md:text-4xl font-light text-white tracking-tighter text-center">
            Forensic <span className="text-[#B4FFC8]">Scan</span>
          </h3>
        </div>
      </Html>
      
      {/* HUD metadata at architectural gutters */}
      <Html position={[-5.5, 4, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            WAVELENGTH
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">520.4</span>
            <span className="text-[10px] text-[#B4FFC8]/40">nm</span>
          </div>
        </div>
      </Html>
      
      <Html position={[5.5, 4, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            SHADOW COLOR
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono text-[#B4FFC8]">#050505</span>
          </div>
        </div>
      </Html>
      
      <Html position={[-5.5, -4, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            BOUNCE LIGHT
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">0.0</span>
            <span className="text-[10px] text-[#B4FFC8]/40">%</span>
          </div>
        </div>
      </Html>
      
      <Html position={[5.5, -4, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            DATA REVEALED
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">{revealedData.size}</span>
            <span className="text-[10px] text-[#B4FFC8]/40">/ {DATA_POINTS.length}</span>
          </div>
        </div>
      </Html>
      
      {/* Lighting - minimal, caged beneath weave */}
      <ambientLight intensity={0.05} />
      <directionalLight position={[0, 5, 2]} intensity={0.1} color="#050505" />
    </group>
  );
}
