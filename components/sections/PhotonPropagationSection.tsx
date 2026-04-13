"use client";

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useScrollStore } from '../../lib/useScrollStore';
import { COLORS } from '../../lib/useGlobalMotion';

interface PhotonParticle {
  position: [number, number, number];
  velocity: [number, number, number];
  baseSize: number;
  phaseOffset: number;
  frequency: number;
}

const PARTICLE_COUNT = 3000;
const FIELD_SIZE = 8;
const APERTURE_COUNT = 12;

function generateParticles(): PhotonParticle[] {
  const particles: PhotonParticle[] = [];
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * FIELD_SIZE * 0.8;
    
    particles.push({
      position: [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ],
      velocity: [
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
      ],
      baseSize: 0.02 + Math.random() * 0.04,
      phaseOffset: Math.random() * Math.PI * 2,
      frequency: 480 + Math.random() * 80,
    });
  }
  
  return particles;
}

function generateApertures(): THREE.Vector3[] {
  const apertures: THREE.Vector3[] = [];
  
  for (let i = 0; i < APERTURE_COUNT; i++) {
    const theta = (i / APERTURE_COUNT) * Math.PI * 2;
    const phi = Math.acos((Math.random() - 0.5) * 1.5);
    const r = FIELD_SIZE * 0.9;
    
    apertures.push(
      new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
    );
  }
  
  return apertures;
}

interface PhotonPropagationSectionProps {
  scrollProgress?: number;
}

export default function PhotonPropagationSection({ scrollProgress }: PhotonPropagationSectionProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<any>(null);
  const { camera } = useThree();
  const { scroll, velocity } = useScrollStore();
  
  const particles = useMemo(() => generateParticles(), []);
  const apertures = useMemo(() => generateApertures(), []);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    particles.forEach((p, i) => {
      pos[i * 3] = p.position[0];
      pos[i * 3 + 1] = p.position[1];
      pos[i * 3 + 2] = p.position[2];
    });
    return pos;
  }, [particles]);
  
  const colors = useMemo(() => {
    const cols = new Float32Array(PARTICLE_COUNT * 3);
    const emeraldColor = new THREE.Color(COLORS.emerald);
    const blueColor = new THREE.Color(COLORS.blue);
    
    particles.forEach((p, i) => {
      const isEmerald = p.frequency > 500;
      const color = isEmerald ? emeraldColor : blueColor;
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    });
    
    return cols;
  }, [particles]);
  
  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;
    
    const time = state.clock.elapsedTime;
    const progress = scrollProgress ?? scroll;
    
    materialRef.current.uTime = time;
    materialRef.current.uProgress = progress;
    materialRef.current.uVelocity = velocity;
    materialRef.current.uScrollVelocity = Math.abs(velocity) * 0.5;
    
    const apertureInfluence = Math.sin(progress * Math.PI);
    
    particles.forEach((p, i) => {
      const idx = i * 3;
      const pos = pointsRef.current!.geometry.attributes.position.array as Float32Array;
      
      let newX = p.position[0] + Math.sin(time * 0.5 + p.phaseOffset) * 0.01;
      let newY = p.position[1] + Math.cos(time * 0.3 + p.phaseOffset) * 0.01;
      let newZ = p.position[2] + Math.sin(time * 0.4 + p.phaseOffset) * 0.01;
      
      let minDist = Infinity;
      apertures.forEach((aperture) => {
        const dx = pos[idx] - aperture.x;
        const dy = pos[idx + 1] - aperture.y;
        const dz = pos[idx + 2] - aperture.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        minDist = Math.min(minDist, dist);
      });
      
      const aperturePull = Math.max(0, 1 - minDist / 3) * apertureInfluence * 0.02;
      
      if (progress > 0.3) {
        const bleedFactor = (progress - 0.3) * 2;
        newX += p.velocity[0] * bleedFactor;
        newY += p.velocity[1] * bleedFactor;
        newZ += p.velocity[2] * bleedFactor;
      }
      
      pos[idx] = THREE.MathUtils.lerp(pos[idx], newX, 0.02);
      pos[idx + 1] = THREE.MathUtils.lerp(pos[idx + 1], newY, 0.02);
      pos[idx + 2] = THREE.MathUtils.lerp(pos[idx + 2], newZ, 0.02);
    });
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    const targetFov = 45 + progress * 20;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.02);
    camera.updateProjectionMatrix();
  });
  
  const vertexShader = `
    uniform float uTime;
    uniform float uProgress;
    uniform float uVelocity;
    uniform float uScrollVelocity;
    
    attribute float size;
    attribute vec3 customColor;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistortion;
    
    void main() {
      vColor = customColor;
      
      float distortion = sin(position.x * 10.0 + uTime * 2.0) * 0.1;
      distortion += cos(position.y * 8.0 + uTime * 1.5) * 0.1;
      vDistortion = distortion;
      
      float visibilityThreshold = 0.3;
      float emissionThreshold = 0.6;
      
      if (uProgress < visibilityThreshold) {
        vAlpha = uProgress / visibilityThreshold;
      } else if (uProgress < emissionThreshold) {
        vAlpha = 0.5 + (uProgress - visibilityThreshold) / (emissionThreshold - visibilityThreshold) * 0.5;
      } else {
        vAlpha = 1.0;
      }
      
      vAlpha *= 0.3 + 0.7 * sin(uTime * 3.0 + position.x);
      vAlpha += uScrollVelocity * 0.5;
      vAlpha = clamp(vAlpha, 0.0, 1.0);
      
      vec3 newPosition = position;
      float apertureEffect = sin(uProgress * 3.14159) * 0.2;
      newPosition += normal * apertureEffect * distortion;
      
      vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      float baseSize = size * (2.0 / -mvPosition.z);
      baseSize *= 1.0 + uScrollVelocity * 2.0;
      gl_PointSize = baseSize;
    }
  `;
  
  const fragmentShader = `
    uniform float uProgress;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vDistortion;
    
    void main() {
      float r = distance(gl_PointCoord, vec2(0.5));
      if (r > 0.5) discard;
      
      float glow = 1.0 - r * 2.0;
      glow = pow(glow, 1.5);
      
      float chromaticOffset = vDistortion * uProgress * 0.3;
      vec3 chromaticColor = vColor;
      chromaticColor.r += chromaticOffset;
      chromaticColor.b -= chromaticOffset;
      
      vec3 finalColor = chromaticColor * (1.0 + glow * 0.5);
      finalColor = mix(vec3(0.05, 0.05, 0.05), finalColor, vAlpha);
      
      gl_FragColor = vec4(finalColor, vAlpha * glow);
    }
  `;
  
  return (
    <group position={[0, 0, -5]}>
      <Points ref={pointsRef} limit={PARTICLE_COUNT}>
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
            count={particles.length}
            array={new Float32Array(particles.map((p) => p.baseSize))}
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
      
      <Html position={[0, 3, 0]} center transform occlude="blending" distanceFactor={1.5}>
        <div className="pointer-events-none select-none">
          <h2 className="text-[10px] font-mono text-[#B4FFC8] uppercase tracking-[0.4em] mb-2 text-center">
            Photon Propagation
          </h2>
          <h3 className="text-4xl md:text-5xl font-light text-white tracking-tighter text-center">
            Volumetric <span className="text-[#B4FFC8]">Field</span>
          </h3>
        </div>
      </Html>
      
      <Html position={[-4, -2, 0]} transform occlude="blending" distanceFactor={1.5}>
        <div className="border border-white/10 backdrop-blur-xl bg-gradient-to-b from-transparent to-white/[0.03] py-3 px-5 rounded-sm pointer-events-none">
          <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
            Escape Flux
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-mono text-[#B4FFC8]">
              {(scrollProgress ?? scroll) * 18.4}
            </span>
            <span className="text-[10px] text-[#B4FFC8]/40">%</span>
          </div>
        </div>
      </Html>
      
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color={COLORS.emerald} />
    </group>
  );
}
