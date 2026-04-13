"use client";

import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Points, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore } from '../../lib/useScrollStore';
import { COLORS } from '../../lib/useGlobalMotion';

interface NeuralNode {
  position: [number, number, number];
  radialPos: [number, number, number];
  pathwayPos: [number, number, number];
  baseSize: number;
  phaseOffset: number;
  isStress: boolean;
  isShadow: boolean;
  isActive: boolean;
  metadata?: string;
}

const NODE_COUNT = 5000;
const RADIAL_RADIUS = 6;
const PATHWAY_LENGTH = 12;

function generateNodes(): NeuralNode[] {
  const nodes: NeuralNode[] = [];
  
  for (let i = 0; i < NODE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    const radialR = RADIAL_RADIUS * Math.cbrt(Math.random());
    const radialPos: [number, number, number] = [
      radialR * Math.sin(phi) * Math.cos(theta),
      radialR * Math.sin(phi) * Math.sin(theta),
      radialR * Math.cos(phi),
    ];
    
    const pathwayX = (Math.random() - 0.5) * PATHWAY_LENGTH;
    const pathwayY = (Math.random() - 0.5) * 2;
    const pathwayZ = (Math.random() - 0.5) * 2;
    const pathwayPos: [number, number, number] = [pathwayX, pathwayY, pathwayZ];
    
    const isStress = Math.random() > 0.85;
    const isShadow = !isStress && Math.random() > 0.7;
    const isActive = Math.random() > 0.3;
    
    const metadataOptions = [
      'Findability Index: 0.847',
      'Perception Threshold: 520nm',
      'Neural Pathway Active',
      'Biometric Sync: 98.2%',
      'Visibility Coefficient: 0.923',
      'Rod Sensitivity Peak',
      'Purkinje Shift Detected',
      'Scotopic Vision Engaged',
    ];
    
    nodes.push({
      position: [...radialPos] as [number, number, number],
      radialPos,
      pathwayPos,
      baseSize: 0.015 + Math.random() * 0.025,
      phaseOffset: Math.random() * Math.PI * 2,
      isStress,
      isShadow,
      isActive,
      metadata: isActive ? metadataOptions[Math.floor(Math.random() * metadataOptions.length)] : undefined,
    });
  }
  
  return nodes;
}

interface VisibilityFlowMorphProps {
  scrollProgress?: number;
}

export default function VisibilityFlowMorph({ scrollProgress }: VisibilityFlowMorphProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<any>(null);
  const { camera } = useThree();
  const { scroll, velocity } = useScrollStore();
  const [selectedNode, setSelectedNode] = useState<NeuralNode | null>(null);
  
  const progress = scrollProgress ?? scroll;
  
  const nodes = useMemo(() => generateNodes(), []);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(NODE_COUNT * 3);
    nodes.forEach((n, i) => {
      pos[i * 3] = n.position[0];
      pos[i * 3 + 1] = n.position[1];
      pos[i * 3 + 2] = n.position[2];
    });
    return pos;
  }, [nodes]);
  
  const colors = useMemo(() => {
    const cols = new Float32Array(NODE_COUNT * 3);
    const emeraldColor = new THREE.Color(COLORS.emerald);
    const amberColor = new THREE.Color(COLORS.amber);
    const blueColor = new THREE.Color(COLORS.blue);
    const grayColor = new THREE.Color('#2a2a2a');
    
    nodes.forEach((n, i) => {
      let color: THREE.Color;
      if (n.isStress) {
        color = amberColor;
      } else if (n.isShadow) {
        color = blueColor;
      } else if (n.isActive) {
        color = emeraldColor;
      } else {
        color = grayColor;
      }
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    });
    
    return cols;
  }, [nodes]);
  
  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    materialRef.current.uTime = time;
    materialRef.current.uProgress = progress;
    materialRef.current.uVelocity = Math.abs(velocity) * 0.3;
    
    const morphFactor = Math.min(1, Math.max(0, progress));
    const easeMorph = morphFactor * morphFactor * (3 - 2 * morphFactor);
    
    const purkinjeIntensity = Math.pow(morphFactor, 0.5);
    materialRef.current.uPurkinje = purkinjeIntensity;
    
    nodes.forEach((n, i) => {
      const idx = i * 3;
      const pos = pointsRef.current!.geometry.attributes.position.array as Float32Array;
      
      const targetX = THREE.MathUtils.lerp(n.radialPos[0], n.pathwayPos[0], easeMorph);
      const targetY = THREE.MathUtils.lerp(n.radialPos[1], n.pathwayPos[1], easeMorph);
      const targetZ = THREE.MathUtils.lerp(n.radialPos[2], n.pathwayPos[2], easeMorph);
      
      const wobble = Math.sin(time * 2 + n.phaseOffset) * 0.02 * (1 - morphFactor);
      
      pos[idx] = THREE.MathUtils.lerp(pos[idx], targetX + wobble, 0.05);
      pos[idx + 1] = THREE.MathUtils.lerp(pos[idx + 1], targetY + wobble, 0.05);
      pos[idx + 2] = THREE.MathUtils.lerp(pos[idx + 2], targetZ + wobble, 0.05);
    });
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    const baseFov = 50;
    const targetFov = baseFov + morphFactor * 15;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.02);
    camera.updateProjectionMatrix();
    
    const bgColor = new THREE.Color('#050505');
    const monoColor = new THREE.Color('#1a1a1a');
    const lerpColor = bgColor.clone().lerp(monoColor, purkinjeIntensity * 0.4);
  });
  
  const handlePointerDown = (e: THREE.Event) => {
    e.stopPropagation();
    const index = (e as any).index;
    if (index !== undefined && nodes[index]) {
      setSelectedNode(nodes[index]);
    }
  };
  
  const vertexShader = `
    uniform float uTime;
    uniform float uProgress;
    uniform float uVelocity;
    uniform float uPurkinje;
    
    attribute float size;
    attribute vec3 customColor;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vGlow;
    
    void main() {
      vColor = customColor;
      
      float pulse = sin(uTime * 3.0 + position.x * 2.0) * 0.3 + 0.7;
      vGlow = pulse;
      
      float visibilityBoost = 0.5 + uPurkinje * 0.5;
      vAlpha = visibilityBoost * pulse;
      vAlpha += uVelocity * 0.4;
      vAlpha = clamp(vAlpha, 0.2, 1.0);
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      float baseSize = size * (3.0 / -mvPosition.z);
      baseSize *= 1.0 + uVelocity * 1.5;
      baseSize *= 0.5 + vGlow * 0.5;
      gl_PointSize = baseSize;
    }
  `;
  
  const fragmentShader = `
    uniform float uPurkinje;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vGlow;
    
    void main() {
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      
      float glow = 1.0 - r * 2.0;
      glow = pow(glow, 1.2);
      
      float purkinjeBoost = 1.0 + uPurkinje * 0.5;
      vec3 enhancedColor = vColor * purkinjeBoost;
      
      vec3 finalColor = enhancedColor * (1.0 + glow * vGlow * 0.6);
      
      gl_FragColor = vec4(finalColor, vAlpha * glow);
    }
  `;
  
  return (
    <>
      <group position={[0, 0, -8]}>
        <Points ref={pointsRef} limit={NODE_COUNT}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
              needsUpdate
            />
            <bufferAttribute
              attach="attributes-customColor"
              count={colors.length / 3}
              array={colors}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              count={nodes.length}
              array={new Float32Array(nodes.map((n) => n.baseSize))}
              itemSize={1}
            />
          </bufferGeometry>
          <shaderMaterial
            ref={materialRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </Points>
        
        <Html position={[0, 5, 0]} center transform occlude="blending" distanceFactor={1.5}>
          <div className="pointer-events-none select-none text-center">
            <h2 className="text-[10px] font-mono text-[#B4FFC8] uppercase tracking-[0.4em] mb-2">
              Biometric Hijack
            </h2>
            <h3 className="text-4xl md:text-5xl font-light text-white tracking-tighter text-center">
              Phase-State <span className="text-[#B4FFC8]">Emission Topography</span>
            </h3>
          </div>
        </Html>
        
        <Html position={[-5, -3, 0]} transform occlude="blending" distanceFactor={1.5}>
          <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none max-w-xs">
            <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest mb-2">
              Neural Constellation
            </p>
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              5,000 particles transition between Neural Hive and Survival Pathway configurations.
              Purkinje shift intensifies emerald nodes as background desaturates.
            </p>
          </div>
        </Html>
        
        {selectedNode && (
          <Html position={[4, 2, 0]} transform occlude="blending" distanceFactor={1.5}>
            <div className="border border-[#B4FFC8]/30 backdrop-blur-xl bg-black/80 py-4 px-5 rounded-sm pointer-events-auto max-w-xs">
              <button
                onClick={() => setSelectedNode(null)}
                className="absolute top-2 right-2 text-[#B4FFC8]/50 hover:text-[#B4FFC8] text-xs"
              >
                ×
              </button>
              <p className="text-[9px] font-mono text-[#B4FFC8] uppercase tracking-widest mb-2">
                Forensic Metadata
              </p>
              <p className="text-sm text-white font-mono">{selectedNode.metadata}</p>
              <div className="mt-3 flex gap-2">
                <span className={`text-[10px] px-2 py-1 rounded ${selectedNode.isStress ? 'bg-[#FFB049]/20 text-[#FFB049]' : 'bg-[#B4FFC8]/20 text-[#B4FFC8]'}`}>
                  {selectedNode.isStress ? 'STRESS' : 'ACTIVE'}
                </span>
                <span className="text-[10px] px-2 py-1 rounded bg-white/10 text-neutral-400">
                  Node #{Math.floor(selectedNode.phaseOffset * 1000)}
                </span>
              </div>
            </div>
          </Html>
        )}
        
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 10, 0]} intensity={0.3} color={COLORS.emerald} />
      </group>
    </>
  );
}
