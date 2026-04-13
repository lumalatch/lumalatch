"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const EmissionDecayMaterial = shaderMaterial(
  {
    uTime: 0,
    uScanPosition: 0.5,
    uScanActive: false,
    uColor1: new THREE.Color('#B4FFC8'),
    uColor2: new THREE.Color('#49FF9C'),
    uColor3: new THREE.Color('#050505'),
  },
  `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform float uScanPosition;
    uniform bool uScanActive;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    
    varying vec2 vUv;
    
    void main() {
      float decayCurve = 1.0 - pow(vUv.x, 2.0);
      
      vec3 color = uColor3;
      
      float emissionGlow = exp(-3.0 * vUv.x) * 0.5;
      color += uColor1 * emissionGlow;
      
      if (uScanActive) {
        float scanWidth = 0.05;
        float scanDist = abs(vUv.y - uScanPosition);
        float inScan = 1.0 - smoothstep(0.0, scanWidth, scanDist);
        
        vec3 scanColor = mix(uColor1, uColor2, smoothstep(0.0, 1.0, inScan));
        color = mix(color, scanColor, inScan * 0.8);
        
        float trail = exp(-10.0 * (uScanPosition - vUv.y)) * step(vUv.y, uScanPosition);
        color += uColor1 * trail * 0.3;
      }
      
      float pulse = sin(uTime * 4.0) * 0.5 + 0.5;
      color += uColor2 * pulse * 0.1 * decayCurve;
      
      float gridX = step(0.98, fract(vUv.x * 20.0));
      float gridY = step(0.98, fract(vUv.y * 20.0));
      color += vec3(gridX + gridY) * 0.15;
      
      gl_FragColor = vec4(color, 0.9);
    }
  `
);

THREE.extend({ EmissionDecayMaterial });

interface EmissionDecayProps {
  isActive?: boolean;
}

export default function EmissionDecay({ isActive = false }: EmissionDecayProps) {
  const materialRef = useRef<any>();
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uScanActive = isActive;
      
      if (isActive) {
        const scanSpeed = 0.5;
        materialRef.current.uScanPosition = 
          0.5 + 0.4 * Math.sin(state.clock.elapsedTime * scanSpeed);
      } else {
        materialRef.current.uScanPosition = 0.5;
      }
    }
  });
  
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(1, 1, 32, 32);
  }, []);
  
  return (
    <mesh>
      <primitive object={geometry} attach="geometry" />
      <EmissionDecayMaterial
        ref={materialRef}
        attach="material"
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
