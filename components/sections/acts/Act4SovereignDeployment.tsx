"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore } from '../../../lib/useScrollStore';
import { COLORS } from '../../../lib/useGlobalMotion';
import { CHOREOGRAPHY, MESH_TRANSMISSION_MATERIAL } from '../../../lib/SceneRegistry';

interface HarnessComponent {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

const HARNESS_COMPONENTS: HarnessComponent[] = [
  { id: 'main-buckle', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  { id: 'left-strap', position: [-1.2, 0.5, 0.3], rotation: [0, 0, 0.2], scale: [0.4, 1.5, 0.1] },
  { id: 'right-strap', position: [1.2, 0.5, 0.3], rotation: [0, 0, -0.2], scale: [0.4, 1.5, 0.1] },
  { id: 'lap-belt-left', position: [-0.8, -0.8, 0.2], rotation: [0.3, 0, 0.5], scale: [0.5, 1.2, 0.08] },
  { id: 'lap-belt-right', position: [0.8, -0.8, 0.2], rotation: [0.3, 0, -0.5], scale: [0.5, 1.2, 0.08] },
  { id: 'anchor-point', position: [0, -1.5, 0.5], rotation: [0, 0, 0], scale: [0.6, 0.4, 0.6] },
];

const ALIGNMENT_READOUTS = [
  { standard: 'FMVSS 209', value: 'PASS', tolerance: '±0.02mm' },
  { standard: 'ECE R16', value: 'CERTIFIED', tolerance: '±0.05mm' },
  { standard: 'ISO 13369', value: 'COMPLIANT', tolerance: '±0.03mm' },
  { standard: 'SAE J826', value: 'VERIFIED', tolerance: '±0.04mm' },
];

interface SovereignDeploymentProps {
  scrollProgress?: number;
  isActive?: boolean;
  opacity?: number;
}

export default function SovereignDeployment({ scrollProgress, isActive, opacity }: SovereignDeploymentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const harnessGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { scroll, velocity } = useScrollStore();
  
  const progress = scrollProgress ?? scroll;
  
  // Track deployment state
  const deploymentState = useRef<{
    rotationAngle: number;
    fovPunch: number;
    readoutVisibility: number;
    grainIntensity: number;
  }>({ rotationAngle: 0, fovPunch: 0, readoutVisibility: 0, grainIntensity: 0 });
  
  useFrame((state) => {
    if (!groupRef.current || !harnessGroupRef.current) return;
    
    const time = state.clock.elapsedTime;
    const deltaTime = state.clock.getDelta();
    
    // Calculate deployment progress
    const deployStart = 0.68;
    const deployEnd = 0.95;
    const deployFactor = Math.max(0, Math.min(1, (progress - deployStart) / (deployEnd - deployStart)));
    const easeDeploy = deployFactor * deployFactor * (3 - 2 * deployFactor);
    
    deploymentState.current.fovPunch = easeDeploy;
    
    // Apply inertia-based motion with friction and harmonic decay
    const friction = CHOREOGRAPHY.INERTIA_ENGINE.frictionCoefficient;
    const decayFreq = CHOREOGRAPHY.INERTIA_ENGINE.harmonicDecayHz;
    const damping = Math.exp(-decayFreq * deltaTime);
    
    // Full harness orbital rotation
    deploymentState.current.rotationAngle = time * 0.3 * easeDeploy;
    harnessGroupRef.current.rotation.y = deploymentState.current.rotationAngle;
    harnessGroupRef.current.rotation.x = Math.sin(time * 0.2) * 0.05 * easeDeploy;
    
    // Camera FOV punch from 35 to 120 during final transition
    const startFov = 35;
    const endFov = 120;
    const targetFov = startFov + (endFov - startFov) * easeDeploy;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.03);
    camera.updateProjectionMatrix();
    
    // Readouts fade in with slight delay
    const readoutDelay = 0.15;
    const readoutProgress = Math.max(0, (easeDeploy - readoutDelay) / (1 - readoutDelay));
    deploymentState.current.readoutVisibility = readoutProgress * readoutProgress;
    
    // ISO grain overlay intensity
    deploymentState.current.grainIntensity = 0.04 * easeDeploy;
  });
  
  // Grain canvas for ISO 0.03 overlay at 0.04 opacity
  const grainCanvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!grainCanvasRef.current || !isActive) return;
    
    const canvas = grainCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    const grainSize = 1;
    
    const renderGrain = () => {
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      
      // ISO 0.03 grain
      for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() - 0.5) * 255 * 0.03;
        data[i] = 128 + grain;
        data[i + 1] = 128 + grain;
        data[i + 2] = 128 + grain;
        data[i + 3] = 255 * 0.04; // 0.04 opacity
      }
      
      ctx.putImageData(imageData, 0, 0);
      animationId = requestAnimationFrame(renderGrain);
    };
    
    renderGrain();
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isActive]);
  
  return (
    <group ref={groupRef} position={[0, 0, -4]} opacity={opacity}>
      {/* Clinical background */}
      <mesh visible={false}>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      
      {/* Harness assembly group - orbital rotation */}
      <group ref={harnessGroupRef}>
        {HARNESS_COMPONENTS.map((component) => (
          <Float
            key={component.id}
            speed={1.5}
            rotationIntensity={0.3}
            floatIntensity={0.5}
          >
            <mesh position={component.position} rotation={component.rotation} scale={component.scale}>
              <boxGeometry args={[1, 1, 1]} />
              <meshPhysicalMaterial
                color={component.id.includes('buckle') ? COLORS.amber : '#2a2a2a'}
                roughness={MESH_TRANSMISSION_MATERIAL.roughness}
                metalness={MESH_TRANSMISSION_MATERIAL.metalness}
                transmission={MESH_TRANSMISSION_MATERIAL.transmission}
                thickness={0.5}
                envMapIntensity={1.0}
                clearcoat={0.3}
                clearcoatRoughness={0.1}
                ior={1.5}
                transparent
                opacity={0.95}
              />
            </mesh>
          </Float>
        ))}
        
        {/* Buckle detail */}
        <mesh position={[0, 0.2, 0.5]} scale={[0.8, 0.4, 0.3]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial
            color={COLORS.amber}
            roughness={0.3}
            metalness={0.8}
            transmission={0.2}
            thickness={0.3}
            envMapIntensity={1.5}
          />
        </mesh>
      </group>
      
      {/* HUD Overdrive - Technical alignment readouts */}
      <group opacity={deploymentState.current.readoutVisibility}>
        {ALIGNMENT_READOUTS.map((readout, i) => (
          <Html
            key={i}
            position={[-4 + (i % 2) * 8, 2 - Math.floor(i / 2) * 1.5, 0]}
            transform
            occlude="blending"
            distanceFactor={1.5}
          >
            <div className="border border-[#B4FFC8]/30 backdrop-blur-xl bg-black/80 py-3 px-4 rounded-sm pointer-events-none min-w-[140px]">
              <p className="text-[7px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
                {readout.standard}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-[#B4FFC8]">{readout.value}</span>
              </div>
              <p className="text-[6px] font-mono text-neutral-600 mt-1">
                TOL: {readout.tolerance}
              </p>
            </div>
          </Html>
        ))}
      </group>
      
      {/* Title */}
      <Html position={[0, 5, 0]} center transform occlude="blending" distanceFactor={1.5}>
        <div className="pointer-events-none select-none text-center">
          <h2 className="text-[10px] font-mono text-[#B4FFC8] uppercase tracking-[0.4em] mb-2">
            Act IV: The Sovereign Deployment
          </h2>
          <h3 className="text-3xl md:text-4xl font-light text-white tracking-tighter text-center">
            Clinical <span className="text-[#B4FFC8]">Full-View</span>
          </h3>
        </div>
      </Html>
      
      {/* Additional HUD metadata */}
      <Html position={[-5.5, -3.5, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            ORBITAL ROTATION
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">
              {(deploymentState.current.rotationAngle * (180 / Math.PI)).toFixed(1)}
            </span>
            <span className="text-[10px] text-[#B4FFC8]/40">°</span>
          </div>
        </div>
      </Html>
      
      <Html position={[5.5, -3.5, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            FOV PUNCH
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">
              {camera.fov.toFixed(0)}
            </span>
            <span className="text-[10px] text-[#B4FFC8]/40">°</span>
          </div>
        </div>
      </Html>
      
      {/* ISO grain overlay canvas */}
      {isActive && (
        <Html position={[0, 0, 0]} center transform distanceFactor={1}>
          <canvas
            ref={grainCanvasRef}
            width={200}
            height={200}
            className="pointer-events-none fixed inset-0 w-full h-full"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.04,
              mixBlendMode: 'overlay',
            }}
          />
        </Html>
      )}
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} color="#ffffff" />
      <pointLight position={[0, 0, 5]} intensity={0.4} color={COLORS.emerald} distance={10} />
      <pointLight position={[0, 0, -5]} intensity={0.3} color={COLORS.amber} distance={8} />
    </group>
  );
}
