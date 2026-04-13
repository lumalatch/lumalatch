"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const TensionHeatmapMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1.0,
    uScrollVelocity: 0,
    uColor1: new THREE.Color('#FFB049'),
    uColor2: new THREE.Color('#B4FFC8'),
    uColor3: new THREE.Color('#050505'),
  },
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform float uIntensity;
    uniform float uScrollVelocity;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    // Simplex noise function
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                      + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                              dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      float noiseVal = snoise(vUv * 4.0 + uTime * 0.5);
      float velocityBoost = uScrollVelocity * 0.3;
      float intensity = uIntensity + velocityBoost;
      
      noiseVal = noiseVal * 0.5 + 0.5;
      noiseVal = pow(noiseVal, 2.0) * intensity;
      
      vec3 color = mix(uColor3, uColor1, noiseVal);
      color = mix(color, uColor2, smoothstep(0.6, 1.0, noiseVal));
      
      float scanLine = sin(vUv.y * 50.0 - uTime * 3.0) * 0.5 + 0.5;
      scanLine = pow(scanLine, 10.0) * 0.3;
      color += vec3(scanLine);
      
      gl_FragColor = vec4(color, 0.9);
    }
  `
);

THREE.extend({ TensionHeatmapMaterial });

interface TensionHeatmapProps {
  isActive?: boolean;
}

export default function TensionHeatmap({ isActive = false }: TensionHeatmapProps) {
  const materialRef = useRef<any>();
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      materialRef.current.uIntensity = isActive ? 1.5 : 0.8;
    }
  });
  
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(1, 1, 64, 64);
  }, []);
  
  return (
    <mesh>
      <primitive object={geometry} attach="geometry" />
      <TensionHeatmapMaterial
        ref={materialRef}
        attach="material"
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
