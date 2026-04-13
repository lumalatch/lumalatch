"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useScrollStore } from "../scroll/useScrollStore";

export default function FluidPlane() {
  const groupRef = useRef<any>();
  const prevScroll = useRef(0);
  const { setProgress, setVelocity } = useScrollStore();

  // Track scroll via wheel/touch since we don't have native scroll in this canvas setup
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;

    // Simulate scroll progress from time for demo (in real app, bind to actual scroll)
    const simulatedProgress = (Math.sin(t * 0.15) * 0.5 + 0.5);
    
    // Calculate velocity
    const velocity = (simulatedProgress - prevScroll.current) / (delta + 0.0001);
    prevScroll.current = simulatedProgress;

    // Update store
    setProgress(simulatedProgress);
    setVelocity(Math.max(-2, Math.min(2, velocity)));

    // =========================
    // CAMERA BREATHING + PERSPECTIVE DRIFT (improved stability)
    // =========================
    const driftX = Math.sin(t * 0.18) * 0.05 + state.pointer.x * 0.14;
    const driftY = Math.cos(t * 0.16) * 0.045 + state.pointer.y * 0.11;
    const driftZ = 3 + Math.sin(t * 0.08) * 0.03;

    // Smooth camera interpolation for temporal coherence
    state.camera.position.x += (driftX - state.camera.position.x) * 0.03;
    state.camera.position.y += (driftY - state.camera.position.y) * 0.03;
    state.camera.position.z += (driftZ - state.camera.position.z) * 0.02;

    state.camera.lookAt(0, 0, 0);

    // =========================
    // GROUP PARALLAX RESPONSE (damped for stability)
    // =========================
    groupRef.current.rotation.x +=
      (state.pointer.y * 0.05 - groupRef.current.rotation.x) * 0.04;

    groupRef.current.rotation.y +=
      (state.pointer.x * 0.05 - groupRef.current.rotation.y) * 0.04;

    // =========================
    // MATERIAL UPDATE LOOP
    // =========================
    groupRef.current.children.forEach((child: any, i: number) => {
      if (!child.material) return;

      const m = child.material;

      m.uniforms.uTime.value += delta;

      // smooth scroll with improved temporal coherence
      m.uniforms.uScroll.value +=
        (simulatedProgress - m.uniforms.uScroll.value) * 0.07;

      // velocity injection with damping to reduce shimmer
      m.uniforms.uVelocity.value +=
        (velocity - m.uniforms.uVelocity.value) * 0.08;
    });
  });

  // =========================
  // SHADER CORE (PHYSICALLY PLAUSIBLE LIGHT TRANSPORT)
  // =========================
  const shader = `
    precision highp float;

    uniform float uTime;
    uniform float uScroll;
    uniform float uVelocity;
    uniform float uDepth;

    varying vec2 vUv;

    // =========================
    // IMPROVED NOISE WITH TEMPORAL COHERENCE
    // =========================
    float hash(vec2 p){
      return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123);
    }

    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash(i);
      float b = hash(i + vec2(1.0,0.0));
      float c = hash(i + vec2(0.0,1.0));
      float d = hash(i + vec2(1.0,1.0));

      vec2 u = f*f*(3.0-2.0*f);

      return mix(a,b,u.x) +
             (c-a)*u.y*(1.0-u.x) +
             (d-b)*u.x*u.y;
    }

    // =========================
    // PHYSICALLY-BASED ANISOTROPIC WEAVE MODEL
    // =========================
    float weaveAnisotropic(vec2 uv){
      // Fiber direction vectors for herringbone pattern
      vec2 dir1 = normalize(vec2(1.0, 0.5));
      vec2 dir2 = normalize(vec2(-1.0, 0.5));
      
      // Project UV onto fiber directions
      float proj1 = dot(uv, dir1) * 58.0;
      float proj2 = dot(uv, dir2) * 58.0;
      
      // Anisotropic fiber response with phase offset per depth
      float fiber1 = sin(proj1 + uDepth * 0.5);
      float fiber2 = sin(proj2 - uDepth * 0.5);
      
      // Physical occlusion: fibers block light based on angle
      float occlusion = 0.5 + 0.5 * fiber1 * fiber2;
      
      // Add micro-fiber variation for realism
      float microFiber = noise(uv * 120.0 + uDepth * 2.0) * 0.15;
      
      return occlusion + microFiber;
    }

    // =========================
    // ENERGY CONSERVATION: REDISTRIBUTION NOT AMPLIFICATION
    // =========================
    vec3 energyConservation(vec3 incoming, float intensity){
      // Instead of amplifying, redistribute energy across channels
      float totalEnergy = dot(incoming, vec3(0.299, 0.587, 0.114));
      float scale = intensity * 0.85; // Keep below 1.0 for conservation
      
      // Preserve color ratios while scaling
      return incoming * scale;
    }

    // =========================
    // VOLUMETRIC SCATTERING APPROXIMATION
    // =========================
    float volumetricScatter(vec2 uv, float depth){
      // Distance from center with depth-based falloff
      vec2 centered = uv - 0.5;
      float dist = length(centered);
      
      // Depth-aware volumetric falloff
      float baseFalloff = exp(-dist * (2.2 + depth * 3.5));
      
      // Subsurface scattering approximation
      float sss = noise(uv * (3.0 + depth * 7.0) + uTime * 0.35);
      float scatterContribution = 0.55 + sss * 0.45;
      
      // Combine with energy conservation
      return baseFalloff * scatterContribution;
    }

    // =========================
    // TEMPORAL AFTERIMAGE WITH IMPROVED STABILITY
    // =========================
    float afterimage(float x, float vel){
      // Reduced velocity influence to minimize shimmer
      float decay = 1.5 + abs(vel) * 0.35;
      return exp(-x * decay);
    }

    // =========================
    // MICROGEOMETRY DEFORMATION IN UV SPACE
    // =========================
    vec2 microDeform(vec2 uv, float depth){
      // Subtle UV displacement based on depth layer
      vec2 deformation = vec2(
        sin(uTime * 0.35 + depth) * 0.02,
        cos(uTime * 0.3 - depth * 0.5) * 0.02
      );
      return uv + deformation * uDepth;
    }

    void main(){
      vec2 uv = vUv;

      // =========================
      // DEPTH-BASED MICROGEOMETRY
      // =========================
      uv = microDeform(uv, uDepth);

      // =========================
      // SCROLL FIELD ACTIVATION
      // =========================
      float diag = uv.x * 0.85 + uv.y;
      float threshold = 1.12 - uScroll * 1.2;
      
      // Wave and turbulence with reduced amplitude for stability
      float wave = sin(uv.x * (4.0 + uScroll * 11.0) + uTime * 2.0)
                 * (0.025 + uScroll * 0.05);
      
      float turb = noise(uv * (2.8 + uScroll * 6.5) + uTime * 0.5)
                 * (0.02 + uScroll * 0.04);
      
      float surface = threshold + wave + turb;
      float field = smoothstep(surface, surface + 0.018, diag);

      // =========================
      // ANISOTROPIC WEAVE LIGHT GATING
      // =========================
      float w = weaveAnisotropic(uv + uDepth * 0.18);
      
      // Physical gaps between fibers
      float gaps = smoothstep(-0.15, 0.15, w);
      float channels = 1.0 - gaps;
      
      // Micro-occlusion variation
      channels *= 0.6 + 0.4 * noise(uv * 95.0 + uDepth);

      // =========================
      // TEMPORAL PERSISTENCE (reduced for stability)
      // =========================
      float trail = afterimage(field + channels, uVelocity);

      // =========================
      // VOLUMETRIC FIELD LAYERING
      // =========================
      float v = volumetricScatter(uv, uDepth);

      // =========================
      // PHYSICALLY-BASED COLOR LAYERS
      // =========================
      vec3 shallow = vec3(0.78, 1.0, 0.84);
      vec3 mid     = vec3(0.5, 0.92, 0.7);
      vec3 deep    = vec3(0.22, 0.85, 0.58);

      // Depth-based color mixing with perceptual linearity
      vec3 col = mix(shallow, mid, uDepth);
      col = mix(col, deep, uDepth * uDepth);

      // =========================
      // PHYSICAL LIGHT TRANSPORT
      // =========================
      // Apply volumetric scattering first
      col *= v;
      
      // Apply weave occlusion (light gating)
      col *= channels;
      
      // Apply scroll field activation
      col *= field;

      // =========================
      // ENERGY CONSERVATION PASS
      // =========================
      col = energyConservation(col, 0.9 + uDepth * 0.1);

      // =========================
      // TEMPORAL AFTERIMAGE INJECTION (subtle)
      // =========================
      col += trail * 0.18;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const makeLayer = (depth: number, scale: number) => (
    <mesh scale={[scale, scale, 1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={{
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uVelocity: { value: 0 },
          uDepth: { value: depth },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `}
        fragmentShader={shader}
      />
    </mesh>
  );

  return (
    <group ref={groupRef}>
      {makeLayer(0.0, 1.0)}
      {makeLayer(0.5, 1.08)}
      {makeLayer(1.0, 1.16)}
    </group>
  );
}
