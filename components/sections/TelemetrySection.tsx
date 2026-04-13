"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Scanline } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useScrollStore } from '../../lib/useScrollStore';
import { COLORS } from '../../lib/useGlobalMotion';
import TensionHeatmap from './telemetry/TensionHeatmap';
import EgressLatency from './telemetry/EgressLatency';
import EmissionDecay from './telemetry/EmissionDecay';

const PANEL_COORDINATES: Record<string, [number, number, number]> = {
  tension: [-3, 0, 4],
  latency: [3, 0, 4],
  emission: [0, 2.5, 3.5],
  default: [0, 0, 10],
};

interface DashboardLayerProps {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  children: React.ReactNode;
  setActivePanel: (id: string | null) => void;
  activePanel: string | null;
  accentColor: string;
  title: string;
}

function DashboardLayer({
  id,
  position,
  rotation = [0, 0, 0],
  children,
  setActivePanel,
  activePanel,
  accentColor,
  title,
}: DashboardLayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const isActive = activePanel === id;
  const isOtherActive = activePanel !== null && activePanel !== id;
  
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const targetScale = isActive ? 1.1 : isHovered ? 1.05 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    
    if (isActive) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
    }
  });
  
  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={() => !isActive && setActivePanel(id)}
    >
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.2}>
        <mesh visible={false}>
          <boxGeometry args={[4, 4, 0.5]} />
        </mesh>
        
        <Html transform occlude="blending" distanceFactor={1.5}>
          <div
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            className={`transition-all duration-500 ${
              isOtherActive ? 'opacity-10 pointer-events-none scale-90' : 'opacity-100'
            } ${!isActive ? 'cursor-pointer' : ''}`}
            style={{
              width: '24rem',
              height: '16rem',
              background: isActive ? 'rgba(5,5,5,0.9)' : 'rgba(5,5,5,0.6)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${accentColor}${isActive || isHovered ? 'E6' : '4D'}`,
              boxShadow: `0 8px 32px ${accentColor}${isActive || isHovered ? '40' : '10'}`,
              borderRadius: '0.75rem',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: '1rem',
            }}
          >
            <h3
              className="text-[10px] font-mono uppercase tracking-widest mb-4 shrink-0"
              style={{ color: accentColor }}
            >
              {title}
            </h3>
            <div className="w-full flex-1 relative">{children}</div>
            
            {!isActive && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-none"
                style={{ opacity: isHovered ? 0 : 1 }}
              >
                <span
                  className="font-mono text-sm tracking-widest"
                  style={{ color: accentColor }}
                >
                  {title}
                </span>
              </div>
            )}
          </div>
        </Html>
      </Float>
    </group>
  );
}

interface SovereignSeatbeltProps {
  activePanel: string | null;
  scrollVelocity: number;
}

function SovereignSeatbelt({ activePanel, scrollVelocity }: SovereignSeatbeltProps) {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<any>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uVelocity = Math.abs(scrollVelocity) * 0.5;
      materialRef.current.uActive = activePanel !== null ? 1.0 : 0.3;
    }
  });
  
  const seatbeltMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uVelocity: { value: 0 },
        uActive: { value: 0.3 },
        uColor1: { value: new THREE.Color(COLORS.emerald) },
        uColor2: { value: new THREE.Color(COLORS.amber) },
        uColor3: { value: new THREE.Color('#0a0a0a') },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uVelocity;
        uniform float uActive;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          float tensionWave = sin(vUv.x * 20.0 - uTime * 2.0) * 0.5 + 0.5;
          tensionWave *= sin(vUv.y * 10.0 + uTime) * 0.3 + 0.7;
          
          vec3 color = mix(uColor3, uColor1, tensionWave * uActive);
          color = mix(color, uColor2, step(0.8, tensionWave) * uActive);
          
          float scanLine = sin(vUv.y * 50.0 - uTime * 3.0) * 0.5 + 0.5;
          scanLine = pow(scanLine, 8.0) * uVelocity;
          color += vec3(scanLine);
          
          float handShake = sin(uTime * 10.0) * step(0.9, uActive);
          color += vec3(handShake * 0.2);
          
          gl_FragColor = vec4(color, 0.85);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);
  
  return (
    <group ref={meshRef}>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[2.0, 1.4, 4.8]} />
        <primitive object={seatbeltMaterial} attach="material" ref={materialRef} />
      </mesh>
      
      {[
        [1.0, 0.35, 1.5],
        [-1.0, 0.35, 1.5],
        [1.0, 0.35, -1.5],
        [-1.0, 0.35, -1.5],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 16]} />
          <meshStandardMaterial
            color={COLORS.emerald}
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

interface TelemetrySectionProps {
  scrollProgress?: number;
}

export default function TelemetrySection({ scrollProgress }: TelemetrySectionProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const { scroll, velocity } = useScrollStore();
  
  const progress = scrollProgress ?? scroll;
  
  useFrame((state) => {
    const targetPos = activePanel
      ? new THREE.Vector3(...PANEL_COORDINATES[activePanel])
      : new THREE.Vector3(0, 0, 10);
    
    const targetLook = activePanel
      ? new THREE.Vector3(0, 0, 0)
      : new THREE.Vector3(0, 0, 0);
    
    camera.position.lerp(targetPos, 0.08);
    camera.lookAt(targetLook);
  });
  
  const bloomIntensity = useMemo(() => {
    return 1.2 + Math.abs(velocity) * 2;
  }, [velocity]);
  
  const scanlineDensity = useMemo(() => {
    return Math.max(0.5, 1 - Math.abs(velocity) * 0.5);
  }, [velocity]);
  
  return (
    <group position={[0, 0, 0]}>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 5, 20]} />
      
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color={COLORS.emerald} />
      
      <SovereignSeatbelt activePanel={activePanel} scrollVelocity={velocity} />
      
      <DashboardLayer
        id="tension"
        title="Tension Matrix"
        position={[-3, 0, 2]}
        rotation={[0, 0.26, 0]}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        accentColor={COLORS.amber}
      >
        <TensionHeatmap isActive={activePanel === 'tension'} />
      </DashboardLayer>
      
      <DashboardLayer
        id="latency"
        title="Egress Latency"
        position={[3, 0, 2]}
        rotation={[0, -0.26, 0]}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        accentColor={COLORS.blue}
      >
        <EgressLatency isActive={activePanel === 'latency'} />
      </DashboardLayer>
      
      <DashboardLayer
        id="emission"
        title="Emission Decay"
        position={[0, 2.5, 0]}
        rotation={[-0.17, 0, 0]}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        accentColor={COLORS.brightEmerald}
      >
        <EmissionDecay isActive={activePanel === 'emission'} />
      </DashboardLayer>
      
      <Html position={[0, 4, 0]} center transform occlude="blending" distanceFactor={1.5}>
        <div className="pointer-events-none select-none text-center">
          <h2 className="text-[10px] font-mono text-[#B4FFC8] uppercase tracking-[0.4em] mb-2">
            LumaLatch Telemetry
          </h2>
          <p className="text-white/40 text-xs font-sans max-w-md">
            Real-time volumetric analysis of restraint systems
          </p>
        </div>
      </Html>
      
      {activePanel && (
        <Html position={[4, 3.5, 0]} transform occlude="blending" distanceFactor={1.5}>
          <button
            onClick={() => setActivePanel(null)}
            className="text-[#B4FFC8] font-mono text-[10px] uppercase tracking-widest border border-[#B4FFC8]/30 px-4 py-2 hover:bg-[#B4FFC8]/10 transition-colors backdrop-blur-md cursor-pointer rounded-sm"
          >
            ESC // CLOSE
          </button>
        </Html>
      )}
      
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={bloomIntensity}
        />
        <Scanline density={scanlineDensity} />
      </EffectComposer>
    </group>
  );
}
