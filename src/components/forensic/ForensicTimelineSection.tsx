import React, { useRef, useLayoutEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MaterialEngine } from './MaterialEngine';

gsap.registerPlugin(ScrollTrigger);

export default function ForensicTimelineSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Strict ScrollTrigger Mutable State (NO useState)
    // Upgraded to handle target and current for Inertia
    const scrollState = useRef({ target: 0, current: 0 });
    
    // UI Data Visualization Layer Refs
    const card1Ref = useRef<HTMLDivElement>(null);
    const card2Ref = useRef<HTMLDivElement>(null);
    const card3Ref = useRef<HTMLDivElement>(null);

    // Authoritative Scroll System Initialization
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: containerRef.current,
                pin: true,
                scrub: 1.5,
                start: "top top",
                end: "+=400%",
                onUpdate: (self) => {
                    scrollState.current.target = self.progress;
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const glassStyle: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        backdropFilter: 'blur(60px)',
        WebkitBackdropFilter: 'blur(60px)',
        background: 'rgba(5,5,5,0.4)',
        padding: '2.5rem',
        borderRadius: '4px',
        color: '#ffffff',
        fontFamily: 'monospace',
        opacity: 0,
        pointerEvents: 'none',
        width: '380px',
        willChange: 'opacity, transform',
        transform: 'translateY(-50%)'
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '0.85rem',
        letterSpacing: '0.12em',
        color: 'rgba(180,255,200,1)',
        marginBottom: '0.75rem',
        textTransform: 'uppercase'
    };

    const dataStyle: React.CSSProperties = {
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: '#ffffff'
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: '100vw',
                height: '100vh',
                position: 'relative',
                backgroundColor: '#000000',
                overflow: 'hidden',
                margin: 0,
                padding: 0
            }}
        >
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                <Canvas
                    camera={{ position: [0, 0, 6.0], fov: 45 }}
                    gl={{ 
                        antialias: false, 
                        powerPreference: 'high-performance',
                        alpha: false 
                    }}
                    dpr={[1, 2]} // WebGL Lifecycle Lock: dpr locked, no dynamic scaling
                    frameloop="always" // Locks RAF to run continuously
                    scene={{ 
                        background: new THREE.Color('#000000'),
                        fog: new THREE.FogExp2('#000000', 0.05) // Visual Coherence Normalization
                    }}
                >
                    <MaterialEngine
                        scrollState={scrollState}
                        uiRefs={{ card1: card1Ref, card2: card2Ref, card3: card3Ref }}
                    />
                </Canvas>
            </div>

            <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
                <div ref={card1Ref} style={{ ...glassStyle, left: '10%' }}>
                    <div style={titleStyle}>[01] PEAK EXCITATION</div>
                    <div style={dataStyle}>300 mcd/m²</div>
                </div>

                <div ref={card2Ref} style={{ ...glassStyle, right: '10%' }}>
                    <div style={titleStyle}>[02] STOCHASTIC EROSION</div>
                    <div style={dataStyle}>Entropy Rising</div>
                </div>

                <div ref={card3Ref} style={{ ...glassStyle, left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <div style={titleStyle}>[03] SCOTOPIC SHIFT</div>
                    <div style={dataStyle}>Rod-Dominant</div>
                </div>
            </div>
        </div>
    );
}
