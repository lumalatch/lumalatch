"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore } from '../../../lib/useScrollStore';
import { COLORS } from '../../../lib/useGlobalMotion';
import { CHOREOGRAPHY, MESH_TRANSMISSION_MATERIAL } from '../../../lib/SceneRegistry';

interface CrystallineShard {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  velocity: [number, number, number];
  phaseOffset: number;
  frequency: number;
}

const SHARD_COUNT = 160;
const ORBIT_RADIUS = 4;
const CORE_RADIUS = 0.5;

function generateShards(): CrystallineShard[] {
  const shards: CrystallineShard[] = [];
  
  for (let i = 0; i < SHARD_COUNT; i++) {
    const theta = (i / SHARD_COUNT) * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = ORBIT_RADIUS * (0.6 + Math.random() * 0.4);
    
    shards.push({
      position: [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ],
      rotation: [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      ],
      scale: [
        0.1 + Math.random() * 0.2,
        0.1 + Math.random() * 0.2,
        0.1 + Math.random() * 0.2,
      ],
      velocity: [
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
      ],
      phaseOffset: Math.random() * Math.PI * 2,
      frequency: 0.5 + Math.random() * 1.5,
    });
  }
  
  return shards;
}

interface GenesisCoreProps {
  scrollProgress?: number;
  isActive?: boolean;
  opacity?: number;
}

export default function GenesisCore({ scrollProgress, isActive, opacity }: GenesisCoreProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const { scroll, velocity } = useScrollStore();
  
  const progress = scrollProgress ?? scroll;
  const shards = useMemo(() => generateShards(), []);
  
  // SVG turbulence and displacement map simulation via shader uniforms
  const turbulenceRef = useRef<{ uTime: number; uCollapse: number }>({ uTime: 0, uCollapse: 0 });
  
  useFrame((state) => {
    if (!groupRef.current || !coreRef.current) return;
    
    const time = state.clock.elapsedTime;
    turbulenceRef.current.uTime = time;
    
    // Calculate collapse factor based on scroll progress
    // Shards start orbiting and collapse into photonic core as user scrolls
    const collapseStart = 0.05;
    const collapseEnd = 0.20;
    const collapseFactor = Math.max(0, Math.min(1, (progress - collapseStart) / (collapseEnd - collapseStart)));
    const easeCollapse = collapseFactor * collapseFactor * (3 - 2 * collapseFactor);
    
    turbulenceRef.current.uCollapse = easeCollapse;
    
    // Apply inertia-based motion with friction and harmonic decay
    const deltaTime = state.clock.getDelta();
    const targetRotationY = Math.sin(time * 0.2) * 0.1;
    
    // Heavy, suspended movement feel (Inertia Engine)
    const friction = CHOREOGRAPHY.INERTIA_ENGINE.frictionCoefficient;
    const decayFreq = CHOREOGRAPHY.INERTIA_ENGINE.harmonicDecayHz;
    const damping = Math.exp(-decayFreq * deltaTime);
    
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotationY,
      0.02 * damping
    );
    
    // Vibrate shards using feDisplacementMap-like turbulence
    shards.forEach((shard, i) => {
      const shardMesh = groupRef.current?.children[i] as THREE.Mesh | undefined;
      if (!shardMesh) return;
      
      // Turbulence vibration
      const turbulenceX = Math.sin(time * shard.frequency + shard.phaseOffset) * 0.02;
      const turbulenceY = Math.cos(time * shard.frequency * 0.8 + shard.phaseOffset) * 0.02;
      const turbulenceZ = Math.sin(time * shard.frequency * 1.2 + shard.phaseOffset) * 0.02;
      
      // Collapse toward core
      const currentRadius = ORBIT_RADIUS * (1 - easeCollapse * 0.85);
      const targetRadius = CORE_RADIUS + (ORBIT_RADIUS - CORE_RADIUS) * (1 - easeCollapse);
      
      const theta = (i / SHARD_COUNT) * Math.PI * 2;
      const phi = Math.acos(2 * ((i % 50) / 50) - 1);
      
      const newX = targetRadius * Math.sin(phi) * Math.cos(theta) + turbulenceX;
      const newY = targetRadius * Math.sin(phi) * Math.sin(theta) + turbulenceY;
      const newZ = targetRadius * Math.cos(phi) + turbulenceZ;
      
      shardMesh.position.lerp(new THREE.Vector3(newX, newY, newZ), 0.05 * damping);
      
      // Rotate shards as they collapse
      shardMesh.rotation.x += shard.velocity[0] * (1 + easeCollapse * 2);
      shardMesh.rotation.y += shard.velocity[1] * (1 + easeCollapse * 2);
      shardMesh.rotation.z += shard.velocity[2] * (1 + easeCollapse * 2);
      
      // Scale down as they approach core
      const targetScale = 1 - easeCollapse * 0.7;
      shardMesh.scale.lerp(
        new THREE.Vector3(
          shard.scale[0] * targetScale,
          shard.scale[1] * targetScale,
          shard.scale[2] * targetScale
        ),
        0.05
      );
    });
    
    // Photonic core pulse
    const corePulse = Math.sin(time * 3) * 0.1 + 1;
    coreRef.current.scale.setScalar(corePulse * (0.5 + easeCollapse * 0.5));
    
    // Camera FOV change during collapse
    const baseFov = 50;
    const targetFov = baseFov + easeCollapse * 20;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.02);
    camera.updateProjectionMatrix();
  });
  
  // Staggered narrative fragments emerging from void
  const narrativeFragments = ['Photonic emission...', 'within...', 'SrAl₂O₄'];
  const [visibleFragment, setVisibleFragment] = React.useState(0);
  
  useEffect(() => {
    if (progress > 0.02 && visibleFragment < narrativeFragments.length) {
      const timer = setTimeout(() => {
        setVisibleFragment(Math.min(visibleFragment + 1, narrativeFragments.length));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [progress, visibleFragment]);
  
  return (
    <group ref={groupRef} position={[0, 0, -6]} opacity={opacity}>
      {/* Scotopic void background */}
      <mesh visible={false}>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial color="#020202" />
      </mesh>
      
      {/* Render crystalline shards */}
      {shards.map((shard, i) => (
        <Float key={i} speed={1 + shard.frequency} rotationIntensity={0.5} floatIntensity={0.3}>
          <mesh position={shard.position} scale={shard.scale}>
            <octahedronGeometry args={[1, 0]} />
            <meshPhysicalMaterial
              color={COLORS.emerald}
              roughness={MESH_TRANSMISSION_MATERIAL.roughness}
              metalness={MESH_TRANSMISSION_MATERIAL.metalness}
              transmission={MESH_TRANSMISSION_MATERIAL.transmission}
              thickness={0.3}
              envMapIntensity={1.2}
              clearcoat={0.5}
              clearcoatRoughness={0.1}
              ior={1.5}
              transparent
              opacity={0.9}
            />
          </mesh>
        </Float>
      ))}
      
      {/* Photonic core at center */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial
          color={COLORS.brightEmerald}
          toneMapped={false}
        />
      </mesh>
      
      {/* Core glow */}
      <pointLight position={[0, 0, 0]} intensity={2} color={COLORS.emerald} distance={8} />
      
      {/* Narrative fragments - words emerge from void, not a container */}
      <Html position={[0, 3.5, 0]} center transform occlude="blending" distanceFactor={1.5}>
        <div className="pointer-events-none select-none text-center">
          <h2 className="text-[10px] font-mono text-[#B4FFC8] uppercase tracking-[0.4em] mb-4">
            Act I: The Genesis Core
          </h2>
          <div className="flex flex-col items-center gap-2">
            {narrativeFragments.map((fragment, i) => (
              <span
                key={i}
                className={`text-lg md:text-xl font-light tracking-widest transition-all duration-1000 ${
                  i < visibleFragment ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{
                  color: i < visibleFragment ? COLORS.emerald : 'transparent',
                  textShadow: i < visibleFragment ? `0 0 20px ${COLORS.emerald}` : 'none',
                }}
              >
                {fragment}
              </span>
            ))}
          </div>
        </div>
      </Html>
      
      {/* HUD metadata at architectural gutters */}
      <Html position={[-5, -3, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            Shard Count
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">{SHARD_COUNT}</span>
          </div>
        </div>
      </Html>
      
      <Html position={[5, -3, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            Turbulence Freq
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">
              {(turbulenceRef.current.uTime * 2).toFixed(2)}
            </span>
            <span className="text-[10px] text-[#B4FFC8]/40">Hz</span>
          </div>
        </div>
      </Html>
      
      <ambientLight intensity={0.1} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} color={COLORS.emerald} />
    </group>
  );
}
