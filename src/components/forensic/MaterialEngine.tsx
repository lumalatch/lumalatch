import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createHerringboneTexture } from '../../lib/utils/createWeaveTexture';
import fragmentShader from '../../lib/shaders/weaveFragment.glsl?raw';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface MaterialEngineProps {
    scrollState: React.MutableRefObject<{ target: number, current: number }>;
    uiRefs: {
        card1: React.RefObject<HTMLDivElement>;
        card2: React.RefObject<HTMLDivElement>;
        card3: React.RefObject<HTMLDivElement>;
    };
}

export const MaterialEngine: React.FC<MaterialEngineProps> = ({ scrollState, uiRefs }) => {
    const materialRef = useRef<THREE.ShaderMaterial>(null);

    // Runtime Stabilization: Lazy Initialization to prevent SSR crashes while guaranteeing singleton.
    const textureRef = useRef<THREE.CanvasTexture | null>(null);
    if (!textureRef.current) {
        textureRef.current = createHerringboneTexture();
    }

    // Shader State Persistence Lock: NEVER recreate on rerender
    const uniforms = useRef({
        uWeave: { value: textureRef.current },
        uPerceptualT: { value: 0.0 },
        uTime: { value: 0.0 },
        uMicroJitter: { value: 0.0 },
        uBeat: { value: 0.0 }
    }).current;

    useFrame((state) => {
        // 2. SCROLL INERTIA SYSTEM (HUMANIZED MOTION)
        const pTarget = scrollState.current.target;
        const inertia = 0.08;
        scrollState.current.current = THREE.MathUtils.lerp(scrollState.current.current, pTarget, inertia);
        const t = scrollState.current.current;

        // 1. TEMPORAL MODEL (CRITICAL CORE)
        const perceptualT = t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const time = state.clock.elapsedTime;
        
        // 5. MICRO-TIMING ASYMMETRY (HUMAN FEEL LAYER)
        const microJitter = (Math.sin(time * 0.8) * 0.003) + (Math.sin(time * 1.37) * 0.0015);
        
        // 7. SILENT RHYTHM ENGINE
        const beat = Math.sin(perceptualT * Math.PI * 4);

        // Update Shader Uniforms - DIRECT MUTATION ONLY
        if (materialRef.current) {
            materialRef.current.uniforms.uPerceptualT.value = perceptualT;
            materialRef.current.uniforms.uTime.value = time;
            materialRef.current.uniforms.uMicroJitter.value = microJitter;
            materialRef.current.uniforms.uBeat.value = beat;
        }

        // Camera Choreography (Z-axis path)
        let targetZ = 6.0;
        if (perceptualT <= 0.30) {
            targetZ = 6.0 - (0.6 * (perceptualT / 0.30));
        } else if (perceptualT <= 0.65) {
            targetZ = 5.4;
        } else {
            const diveP = (perceptualT - 0.65) / 0.35;
            const easeOutQuart = 1 - Math.pow(1 - diveP, 4); 
            targetZ = 5.4 - (2.2 * easeOutQuart);
        }

        // Heavy inertial camera lerping + Micro-timing drift
        state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.04);
        state.camera.position.y = (Math.sin(time * 0.5) * 0.3) + (microJitter * 2.0);
        state.camera.rotation.z = Math.sin(time * 0.3) * 0.015;

        // 3. ATTENTION STEERING SYSTEM (FOCUS CONTROL)
        const w1 = 1.0 - Math.abs(0.15 - perceptualT) * 2.0;
        const w2 = 1.0 - Math.abs(0.50 - perceptualT) * 2.0;
        const w3 = 1.0 - Math.abs(0.85 - perceptualT) * 2.0;

        // UI Pulse logic
        const uiPulse = 1.0 + (beat * 0.02);

        // Mutate DOM safely without React State
        if (uiRefs.card1.current) {
            const op = THREE.MathUtils.clamp(w1, 0, 1) * (0.9 + 0.1 * beat);
            uiRefs.card1.current.style.opacity = op.toString();
            uiRefs.card1.current.style.transform = `translateY(-50%) scale(${uiPulse})`;
        }

        if (uiRefs.card2.current) {
            const op = THREE.MathUtils.clamp(w2, 0, 1) * (0.9 + 0.1 * beat);
            uiRefs.card2.current.style.opacity = op.toString();
            uiRefs.card2.current.style.transform = `translateY(-50%) scale(${uiPulse})`;
        }

        if (uiRefs.card3.current) {
            const op = THREE.MathUtils.clamp(w3, 0, 1) * (0.9 + 0.1 * beat);
            uiRefs.card3.current.style.opacity = op.toString();
            uiRefs.card3.current.style.transform = `translate(-50%, -50%) scale(${uiPulse})`;
        }
    });

    return (
        <mesh>
            <planeGeometry args={[25, 25, 1, 1]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={true}
                depthWrite={false}
            />
        </mesh>
    );
};
