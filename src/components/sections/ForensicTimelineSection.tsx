import React, { useRef, useMemo, useLayoutEffect } from 'react';

import { Canvas, useFrame, extend } from '@react-three/fiber';

import * as THREE from 'three';

import gsap from 'gsap';

import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// 🔧 CRITICAL R3F REGISTRATION

// ==========================================
// PROCEDURAL WEAVE GENERATOR
// ==========================================
const createHerringboneTexture = (): THREE.CanvasTexture => {

    const size = 1024;

    const canvas = document.createElement('canvas');

    canvas.width = size;

    canvas.height = size;

    const ctx = canvas.getContext('2d');

    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#000000';

    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#FFFFFF';

    ctx.lineWidth = 4;

    ctx.lineCap = 'round';

    ctx.lineJoin = 'round';

    const stepX = 16;

    const stepY = 16;

    const shaftCount = 8;

    for (let y = -size; y < size * 2; y += stepY) {
        ctx.beginPath();
        for (let x = 0; x <= size; x += stepX) {
            const block = Math.floor(x / (stepX * shaftCount));
            const isUp = block % 2 === 0;
            const offset = isUp
                ? (x % (stepX * shaftCount))
                : ((stepX * shaftCount) - (x % (stepX * shaftCount)));
            ctx.lineTo(x, y + offset);
        }
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    return texture;
};

// ==========================================
// GLSL SHADERS (CORE PHYSICS)
// ==========================================

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform float uScrollProgress;
  uniform float uTime;
  uniform sampler2D uWeave;

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    float t = uScrollProgress * 15.0;

    float L = 300.0 / pow(1.0 + 0.25 * t, 1.6);
    float normalizedEmission = L / 300.0;

    float noise = snoise(vUv * 12.0 + uTime * 0.2);

    float erosionPhase =
      smoothstep(0.35, 0.45, uScrollProgress) -
      smoothstep(0.60, 0.70, uScrollProgress);

    float erosion = 1.0 - (erosionPhase * smoothstep(-0.2, 0.2, noise));

    float weaveMask = texture2D(uWeave, vUv).r;
    float occlusion = pow(weaveMask, 3.0);

    float emission = normalizedEmission * erosion * occlusion;

    vec3 emerald = vec3(180.0/255.0, 255.0/255.0, 200.0/255.0);
    vec3 scotopic = vec3(0.75, 0.78, 0.82);

    float scotopicBlend = smoothstep(0.65, 0.90, uScrollProgress);
    vec3 desaturated = mix(emerald, scotopic, scotopicBlend);

    emission = max(emission, 0.015);

    vec3 finalColor = desaturated * emission;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ==========================================
// RENDER CONTEXT
// ==========================================

const ForensicScene = ({ scrollState, uiRefs }: any) => {

    const materialRef = useRef<THREE.ShaderMaterial>(null);

    const weaveTexture = useMemo(() => createHerringboneTexture(), []);

    const uniforms = useMemo(() => ({
        uWeave: { value: weaveTexture },
        uScrollProgress: { value: 0 },
        uTime: { value: 0 }
    }), [weaveTexture]);

    useFrame((state) => {

        const p = scrollState.current.progress;

        if (materialRef.current) {
            materialRef.current.uniforms.uScrollProgress.value = p;
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
        }

        let targetZ = 6.0;

        if (p <= 0.30) targetZ = 6.0 - 0.5 * (p / 0.30);
        else if (p <= 0.65) targetZ = 5.5 - 1.0 * ((p - 0.30) / 0.35);
        else {
            const diveP = (p - 0.65) / 0.35;
            const easeOutQuart = 1 - Math.pow(1 - diveP, 4);
            targetZ = 4.5 - 1.3 * easeOutQuart;
        }

        state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.04);
        state.camera.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
        state.camera.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.015;

        if (uiRefs.card1.current) {
            const opacity = p < 0.05 ? p * 20 : (p < 0.30 ? 1 : 1 - (p - 0.30) * 15);
            uiRefs.card1.current.style.opacity = THREE.MathUtils.clamp(opacity, 0, 1).toString();
        }
    });

    return (
        <mesh>
            <planeGeometry args={[25, 25]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
            />
        </mesh>
    );
};

// ==========================================
// MAIN
// ==========================================

export default function ForensicTimelineSection() {

    const containerRef = useRef<HTMLDivElement>(null);

    const scrollState = useRef({ progress: 0 });

    const card1Ref = useRef<HTMLDivElement>(null);

    const card2Ref = useRef<HTMLDivElement>(null);

    const card3Ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: containerRef.current,
                pin: true,
                scrub: 1.5,
                start: "top top",
                end: "+=400%",
                onUpdate: (self) => {
                    scrollState.current.progress = self.progress;
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>
            <Canvas>
                <mesh>
                    <boxGeometry />
                    <meshBasicMaterial color="red" />
                </mesh>
            </Canvas>
        </div>
    );
}