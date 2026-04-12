/**
 * FORENSIC PHOTOLUMINESCENT WEAVE COMPONENT
 * React Three Fiber implementation with scroll-driven decay
 * and micro-interaction layer
 */

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ShaderMaterial, PlaneGeometry, TextureLoader } from 'three';
import { vertexShader, fragmentShader } from './PhotoluminescentShader.js';

// ============================================
// LUMA MASK TEXTURE GENERATOR
// Creates a procedural weave pattern for testing
// In production, replace with actual luma mask texture
// ============================================

const generateLumaMask = () => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Deep charcoal background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);
  
  // Weave pattern - diagonal threads
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 8;
  
  for (let i = -size; i < size * 2; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }
  
  for (let i = -size; i < size * 2; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, size);
    ctx.lineTo(i - size, 0);
    ctx.stroke();
  }
  
  // Add noise variation
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 30;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  return canvas;
};

// ============================================
// PHOTOLUMINESCENT WEAVE MATERIAL
// ============================================

export function PhotoluminescentWeave({ 
  scrollProgress = 0,
  width = 2,
  height = 3,
  showDebug = false 
}) {
  const materialRef = useRef();
  const { size, viewport } = useThree();
  
  // Generate or load luma mask texture
  const lumaMaskTexture = useMemo(() => {
    const canvas = generateLumaMask();
    const texture = new TextureLoader().load(canvas.toDataURL());
    texture.wrapS = texture.wrapT = texture.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lumaMaskTexture.image instanceof HTMLCanvasElement) {
        lumaMaskTexture.dispose();
      }
    };
  }, [lumaMaskTexture]);
  
  // Uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uLumaMask: { value: lumaMaskTexture },
    uResolution: { value: new Float32Array([size.width * size.devicePixelRatio, size.height * size.devicePixelRatio]) },
    uMouse: { value: new Float32Array([-1, -1]) },
    uScrollProgress: { value: scrollProgress },
    uPixelRatio: { value: size.devicePixelRatio }
  }), [lumaMaskTexture, size, scrollProgress]);
  
  // Animation loop
  useFrame((state) => {
    if (materialRef.current) {
      // Update time uniform
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Update scroll progress (smooth interpolation)
      materialRef.current.uniforms.uScrollProgress.value = scrollProgress;
      
      // Update resolution on resize
      materialRef.current.uniforms.uResolution.value.set(
        size.width * size.devicePixelRatio,
        size.height * size.devicePixelRatio
      );
    }
  });
  
  // Mouse interaction handler
  const handleMouseMove = (e) => {
    if (materialRef.current) {
      const rect = e.target.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      
      materialRef.current.uniforms.uMouse.value.set(x, y);
    }
  };
  
  const handleMouseLeave = () => {
    if (materialRef.current) {
      materialRef.current.uniforms.uMouse.value.set(-1, -1);
    }
  };
  
  return (
    <mesh
      onPointerMove={handleMouseMove}
      onPointerOut={handleMouseLeave}
    >
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={true}
        depthTest={true}
      />
    </mesh>
  );
}

// ============================================
// DUAL-LAYER WEAVE SYSTEM (Bonus Feature)
// Separates thread geometry from emission layer
// for enhanced physical accuracy
// ============================================

export function DualLayerPhotoluminescentWeave({
  scrollProgress = 0,
  width = 2,
  height = 3
}) {
  const threadMaterialRef = useRef();
  const emissionMaterialRef = useRef();
  const { size } = useThree();
  
  // Shared luma mask
  const lumaMaskTexture = useMemo(() => {
    const canvas = generateLumaMask();
    const texture = new TextureLoader().load(canvas.toDataURL());
    texture.wrapS = texture.wrapT = texture.RepeatWrapping;
    return texture;
  }, []);
  
  // Thread material (base layer - matte charcoal)
  const threadUniforms = useMemo(() => ({
    uLumaMask: { value: lumaMaskTexture },
    uAlbedo: { value: 0.05 },
    uRoughness: { value: 0.8 }
  }), [lumaMaskTexture]);
  
  // Emission material (top layer - photoluminescent)
  const emissionUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uLumaMask: { value: lumaMaskTexture },
    uResolution: { value: new Float32Array([size.width, size.height]) },
    uMouse: { value: new Float32Array([-1, -1]) },
    uScrollProgress: { value: scrollProgress },
    uPixelRatio: { value: size.devicePixelRatio }
  }), [lumaMaskTexture, size, scrollProgress]);
  
  useFrame((state) => {
    if (emissionMaterialRef.current) {
      emissionMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      emissionMaterialRef.current.uniforms.uScrollProgress.value = scrollProgress;
    }
  });
  
  // Slight offset for depth-based attenuation
  const emissionOffset = 0.01;
  
  return (
    <group>
      {/* Base thread layer */}
      <mesh position={[0, 0, -emissionOffset]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          ref={threadMaterialRef}
          color="#0d0d0d"
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Emission layer (gaps only) */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={emissionMaterialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={emissionUniforms}
          transparent={true}
          blending={2} // AdditiveBlending for realistic light emission
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ============================================
// SCROLL-DRIVEN SCENE CONTAINER
// Integrates with page scroll for decay control
// ============================================

export function PhotoluminescentScene({
  containerRef,
  useDualLayer = false
}) {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef?.current) return;
      
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(1, Math.max(0, scrollTop / docHeight));
      
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [containerRef]);
  
  const WeaveComponent = useDualLayer ? DualLayerPhotoluminescentWeave : PhotoluminescentWeave;
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000000']} />
        
        {/* Ambient lighting for base material */}
        <ambientLight intensity={0.2} />
        
        {/* Main photoluminescent weave */}
        <Suspense fallback={null}>
          <WeaveComponent 
            scrollProgress={scrollProgress}
            width={2.5}
            height={4}
          />
        </Suspense>
        
        {/* Subtle vignette via fog */}
        <fog attach="fog" args={['#000000', 3, 8]} />
      </Canvas>
    </div>
  );
}

// Default export
export default PhotoluminescentWeave;
