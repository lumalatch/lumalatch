"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore } from '../../../lib/useScrollStore';
import { COLORS } from '../../../lib/useGlobalMotion';
import { CHOREOGRAPHY, MESH_TRANSMISSION_MATERIAL } from '../../../lib/SceneRegistry';

interface NylonThread {
  startPosition: [number, number, number];
  targetPosition: [number, number, number];
  twistPhase: number;
  thickness: number;
  segmentCount: number;
}

const THREAD_COUNT = 48; // For 8-shaft herringbone (6 threads per shaft)
const VIEWPORT_MARGIN = 8;
const WEAVE_RADIUS = 3;

function generateThreads(): NylonThread[] {
  const threads: NylonThread[] = [];
  
  // Generate threads entering from viewport edges
  for (let i = 0; i < THREAD_COUNT; i++) {
    const side = i % 4; // 0: left, 1: right, 2: top, 3: bottom
    const offset = (Math.floor(i / 4) / (THREAD_COUNT / 4)) * VIEWPORT_MARGIN * 2 - VIEWPORT_MARGIN;
    
    let startPos: [number, number, number] = [0, 0, 0];
    let targetPos: [number, number, number] = [0, 0, 0];
    
    switch (side) {
      case 0: // Left edge
        startPos = [-VIEWPORT_MARGIN, offset * 0.5, (Math.random() - 0.5) * 4];
        targetPos = [(offset * 0.3), offset * 0.3, 0];
        break;
      case 1: // Right edge
        startPos = [VIEWPORT_MARGIN, offset * 0.5, (Math.random() - 0.5) * 4];
        targetPos = [(offset * 0.3), offset * 0.3, 0];
        break;
      case 2: // Top edge
        startPos = [offset * 0.5, VIEWPORT_MARGIN, (Math.random() - 0.5) * 4];
        targetPos = [offset * 0.3, (offset * 0.3), 0];
        break;
      case 3: // Bottom edge
        startPos = [offset * 0.5, -VIEWPORT_MARGIN, (Math.random() - 0.5) * 4];
        targetPos = [offset * 0.3, (offset * 0.3), 0];
        break;
    }
    
    threads.push({
      startPosition: startPos,
      targetPosition: targetPos,
      twistPhase: Math.random() * Math.PI * 2,
      thickness: 0.02 + Math.random() * 0.03,
      segmentCount: 16,
    });
  }
  
  return threads;
}

interface SynthesisAssemblyProps {
  scrollProgress?: number;
  isActive?: boolean;
  opacity?: number;
}

export default function SynthesisAssembly({ scrollProgress, isActive, opacity }: SynthesisAssemblyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const weaveGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { scroll, velocity } = useScrollStore();
  
  const progress = scrollProgress ?? scroll;
  const threads = useMemo(() => generateThreads(), []);
  
  // Track weave assembly state
  const weaveState = useRef<{
    assemblyProgress: number;
    twistAngle: number;
    loomSpeed: number;
  }>({ assemblyProgress: 0, twistAngle: 0, loomSpeed: 0 });
  
  useFrame((state) => {
    if (!groupRef.current || !weaveGroupRef.current) return;
    
    const time = state.clock.elapsedTime;
    const deltaTime = state.clock.getDelta();
    
    // Calculate assembly progress based on scroll
    const assemblyStart = 0.18;
    const assemblyEnd = 0.45;
    const assemblyFactor = Math.max(0, Math.min(1, (progress - assemblyStart) / (assemblyEnd - assemblyStart)));
    const easeAssembly = assemblyFactor * assemblyFactor * (3 - 2 * assemblyFactor);
    
    weaveState.current.assemblyProgress = easeAssembly;
    
    // Slow, mechanical movement (industrial loom in deep space)
    const targetLoomSpeed = 0.3 + easeAssembly * 0.5;
    weaveState.current.loomSpeed = THREE.MathUtils.lerp(
      weaveState.current.loomSpeed,
      targetLoomSpeed,
      0.02
    );
    
    // Apply inertia-based motion with friction and harmonic decay
    const friction = CHOREOGRAPHY.INERTIA_ENGINE.frictionCoefficient;
    const decayFreq = CHOREOGRAPHY.INERTIA_ENGINE.harmonicDecayHz;
    const damping = Math.exp(-decayFreq * deltaTime);
    
    // Twist angle for herringbone pattern
    weaveState.current.twistAngle = time * weaveState.current.loomSpeed;
    
    // Update thread positions - entering from edges and twisting into weave
    threads.forEach((thread, i) => {
      const threadMesh = weaveGroupRef.current?.children[i] as THREE.Mesh | undefined;
      if (!threadMesh) return;
      
      // Thread enters from edge position toward weave center
      const entryProgress = Math.min(1, easeAssembly * 1.2 + (i / THREAD_COUNT) * 0.3);
      const easedEntry = entryProgress * entryProgress * (3 - 2 * entryProgress);
      
      const currentPos = new THREE.Vector3(...thread.startPosition);
      const targetPos = new THREE.Vector3(...thread.targetPosition);
      
      // Lerp position with inertia
      const lerpPos = currentPos.lerp(targetPos, easedEntry * 0.08 * damping);
      
      // Add twist for herringbone weave pattern (8-shaft)
      const shaftIndex = Math.floor(i / 6); // 6 threads per shaft
      const twistOffset = (shaftIndex / 8) * Math.PI * 2;
      const twistRadius = WEAVE_RADIUS * 0.3;
      
      lerpPos.x += Math.sin(weaveState.current.twistAngle + twistOffset) * twistRadius * easedEntry;
      lerpPos.y += Math.cos(weaveState.current.twistAngle + twistOffset) * twistRadius * easedEntry;
      
      threadMesh.position.lerp(lerpPos, 0.05);
      
      // Rotate thread to follow twist
      threadMesh.rotation.z = weaveState.current.twistAngle + twistOffset;
      threadMesh.rotation.x = Math.sin(time * 0.5 + i) * 0.1 * easedEntry;
    });
    
    // Rotate entire weave assembly slowly (mechanical feel)
    weaveGroupRef.current.rotation.y = Math.sin(time * 0.2) * 0.05;
    weaveGroupRef.current.rotation.x = Math.sin(time * 0.15) * 0.03;
    
    // Camera FOV adjustment
    const baseFov = 45;
    const targetFov = baseFov + easeAssembly * 15;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.02);
    camera.updateProjectionMatrix();
  });
  
  // HUD metadata values
  const hudData = {
    albedo: 0.05,
    roughness: 0.8,
    shaftCount: 8,
    threadCount: THREAD_COUNT,
    weavePattern: 'HERRINGBONE',
  };
  
  return (
    <group ref={groupRef} position={[0, 0, -8]} opacity={opacity}>
      {/* Deep space background */}
      <mesh visible={false}>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial color="#030303" />
      </mesh>
      
      {/* Weave assembly group */}
      <group ref={weaveGroupRef}>
        {threads.map((thread, i) => {
          // Create twisted thread geometry
          const points = [];
          for (let j = 0; j < thread.segmentCount; j++) {
            const t = j / (thread.segmentCount - 1);
            const twist = Math.sin(t * Math.PI) * thread.twistPhase;
            points.push(new THREE.Vector3(
              Math.sin(twist) * thread.thickness,
              (t - 0.5) * 2,
              Math.cos(twist) * thread.thickness
            ));
          }
          const curve = new THREE.CatmullRomCurve3(points);
          
          return (
            <mesh key={i} position={thread.startPosition}>
              <tubeGeometry args={[curve, thread.segmentCount, thread.thickness, 8, false]} />
              <meshPhysicalMaterial
                color="#1a1a1a"
                roughness={MESH_TRANSMISSION_MATERIAL.roughness}
                metalness={MESH_TRANSMISSION_MATERIAL.metalness}
                transmission={0.1}
                thickness={0.5}
                envMapIntensity={0.5}
                transparent
                opacity={0.95}
              />
            </mesh>
          );
        })}
      </group>
      
      {/* HUD metadata at architectural gutters */}
      <Html position={[-5.5, 4, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            ALBEDO
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">{hudData.albedo.toFixed(2)}</span>
          </div>
        </div>
      </Html>
      
      <Html position={[5.5, 4, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            ROUGHNESS
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">{hudData.roughness.toFixed(1)}</span>
          </div>
        </div>
      </Html>
      
      <Html position={[-5.5, -4, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            SHAFT COUNT
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">{hudData.shaftCount}</span>
          </div>
        </div>
      </Html>
      
      <Html position={[5.5, -4, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            PATTERN
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono text-[#B4FFC8]">{hudData.weavePattern}</span>
          </div>
        </div>
      </Html>
      
      {/* Title */}
      <Html position={[0, 5, 0]} center transform occlude="blending" distanceFactor={1.5}>
        <div className="pointer-events-none select-none text-center">
          <h2 className="text-[10px] font-mono text-[#B4FFC8] uppercase tracking-[0.4em] mb-2">
            Act II: The Synthesis Assembly
          </h2>
          <h3 className="text-3xl md:text-4xl font-light text-white tracking-tighter text-center">
            Industrial <span className="text-[#B4FFC8]">Loom</span>
          </h3>
        </div>
      </Html>
      
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 10, 5]} intensity={0.4} color="#ffffff" />
      <pointLight position={[0, 0, 5]} intensity={0.3} color={COLORS.emerald} distance={10} />
    </group>
  );
}
