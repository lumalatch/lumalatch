"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef, useEffect } from "react";
import FluidPlane from "./FluidPlane";
import { useScrollStore } from "./scroll/useScrollStore";

import {
    EffectComposer,
    DepthOfField,
    Bloom,
    Noise,
} from "@react-three/postprocessing";

function CameraRig() {
    const { camera } = useThree();

    const baseX = useRef(0);
    const baseY = useRef(0);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;

        // Micro drift (handheld optical instability) with improved temporal coherence
        const targetX = Math.sin(t * 0.25) * 0.08 + state.pointer.x * 0.15;
        const targetY = Math.cos(t * 0.2) * 0.06 + state.pointer.y * 0.12;
        const targetZ = 3 + Math.sin(t * 0.1) * 0.05;

        // Smooth interpolation for stability
        camera.position.x += (targetX - camera.position.x) * 0.025;
        camera.position.y += (targetY - camera.position.y) * 0.025;
        camera.position.z += (targetZ - camera.position.z) * 0.02;

        camera.lookAt(0, 0, 0);
    });

    return null;
}

// Scroll listener component to update store from actual page scroll
function ScrollListener() {
    const setProgress = useScrollStore((s) => s.setProgress);
    const setVelocity = useScrollStore((s) => s.setVelocity);
    const prevScroll = useRef(0);
    const lastTime = useRef(performance.now());

    useEffect(() => {
        const handleScroll = () => {
            const currentTime = performance.now();
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.scrollY || document.documentElement.scrollTop;
            
            const normalizedProgress = maxScroll > 0 ? currentScroll / maxScroll : 0;
            const deltaTime = (currentTime - lastTime.current) / 1000;
            
            const velocity = (normalizedProgress - prevScroll.current) / (deltaTime + 0.0001);
            
            prevScroll.current = normalizedProgress;
            lastTime.current = currentTime;
            
            setProgress(Math.max(0, Math.min(1, normalizedProgress)));
            setVelocity(Math.max(-2, Math.min(2, velocity)));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [setProgress, setVelocity]);

    return null;
}

export default function Scene() {
    return (
        <Canvas
            camera={{ position: [0, 0, 3], fov: 45 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            style={{ background: "#050505" }}
        >
            <Suspense fallback={null}>
                {/* SCROLL LISTENER */}
                <ScrollListener />

                {/* CAMERA SYSTEM */}
                <CameraRig />

                {/* MATERIAL FIELD */}
                <FluidPlane />

                {/* OPTICAL SYSTEM - Tuned for physical realism */}
                <EffectComposer>
                    <Bloom
                        intensity={1.15}
                        luminanceThreshold={0.4}
                        luminanceSmoothing={0.25}
                    />

                    <DepthOfField
                        focusDistance={0.02}
                        focalLength={0.035}
                        bokehScale={2.5}
                    />

                    <Noise opacity={0.025} />
                </EffectComposer>
            </Suspense>
        </Canvas>
    );
}
