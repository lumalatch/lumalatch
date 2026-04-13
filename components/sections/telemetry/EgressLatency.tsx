"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const EgressLatencyMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor1: new THREE.Color('#3A86FF'),
    uColor2: new THREE.Color('#B4FFC8'),
    uColor3: new THREE.Color('#050505'),
    uLatency: 0.5,
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
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uLatency;
    
    varying vec2 vUv;
    
    void main() {
      float barWidth = 0.08;
      float spacing = 0.12;
      float numBars = 8.0;
      
      float barIdx = floor(vUv.x / spacing);
      float localX = fract(vUv.x / spacing);
      
      float barHeight = 0.3 + 0.6 * sin(uTime * 2.0 + barIdx * 0.8 + uLatency * 3.14);
      barHeight *= 0.5 + 0.5 * sin(uTime * 3.0 + barIdx);
      
      float inBar = step(localX, barWidth) * step(vUv.y, barHeight);
      
      vec3 color = uColor3;
      color = mix(color, uColor1, inBar * 0.7);
      color = mix(color, uColor2, inBar * smoothstep(0.0, 1.0, barHeight));
      
      float gridLine = step(0.98, fract(vUv.y * 10.0)) * 0.2;
      color += vec3(gridLine);
      
      float progressLine = step(vUv.y, 0.5 + 0.4 * sin(uTime)) * 0.1;
      color += vec3(progressLine) * uColor2;
      
      gl_FragColor = vec4(color, 0.85);
    }
  `
);

THREE.extend({ EgressLatencyMaterial });

interface EgressLatencyProps {
  isActive?: boolean;
}

export default function EgressLatency({ isActive = false }: EgressLatencyProps) {
  const materialRef = useRef<any>();
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uLatency = isActive ? 0.8 : 0.3;
    }
  });
  
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(1, 1, 32, 32);
  }, []);
  
  return (
    <mesh>
      <primitive object={geometry} attach="geometry" />
      <EgressLatencyMaterial
        ref={materialRef}
        attach="material"
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
