import React, { useRef, useState, useEffect, Suspense, useMemo } from 'react'
import { Canvas, useFrame, useThree, extend, ThreeEvent } from '@react-three/fiber'
import { useTexture, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { motion, useSpring, useTransform } from 'framer-motion'

// ─────────────────────────────────────────────────────────────────────────────
// SHADER MATERIAL — PHOTOLUMINESCENT DECAY
// ─────────────────────────────────────────────────────────────────────────────

const DecayMaterial = shaderMaterial(
  {
    uTex: new THREE.Texture(),
    uProgress: 0,
    uIsActive: 0,
    uBaseColor: new THREE.Color('#0a0a0a'),
    uGlowColor: new THREE.Color('#B4FFC8'),
    uResolution: new THREE.Vector2(1, 1),
    uTexResolution: new THREE.Vector2(1, 1),
    uLuminance: 1.0,
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform sampler2D uTex;
    uniform float uProgress;
    uniform float uIsActive;
    uniform vec3 uBaseColor;
    uniform vec3 uGlowColor;
    uniform vec2 uResolution;
    uniform vec2 uTexResolution;
    uniform float uLuminance;
    varying vec2 vUv;

    // Pseudo-random for deterministic weave pattern
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    // 8-shaft herringbone twill simulation
    float herringboneWeave(vec2 uv) {
      vec2 grid = uv * vec2(64.0, 32.0);
      float thread = sin(grid.x * 3.14159) * sin(grid.y * 3.14159 * 0.5);
      float pattern = mod(floor(grid.x) + floor(grid.y), 8.0);
      float weaveStep = step(0.5, fract(pattern / 8.0));
      return thread * weaveStep;
    }

    void main() {
      vec2 ratio = uResolution / uTexResolution;
      vec2 uv = vUv;
      float coverRatio = max(ratio.x, ratio.y);
      vec2 newSize = uTexResolution * coverRatio;
      vec2 offset = (newSize - uResolution) / 2.0 / newSize;
      uv = uv * (uResolution / newSize) + offset;

      vec4 texColor = texture2D(uTex, uv);
      
      // Weave geometry — threads block light, gaps allow emission
      float weaveMask = herringboneWeave(vUv * vec2(3.0, 1.5));
      float gapMask = 1.0 - smoothstep(0.3, 0.7, weaveMask);
      
      // V-intersection detection (where glow bleeds through)
      float vIntersect = abs(sin(vUv.x * 50.0) * cos(vUv.y * 25.0));
      float vMask = smoothstep(0.0, 0.15, vIntersect) * gapMask;
      
      // Base fabric — matte charcoal nylon 6-6
      vec3 fabricColor = uBaseColor * (0.8 + 0.2 * texColor.r);
      fabricColor *= 0.95 + 0.05 * weaveMask;
      
      // Photoluminescent emission — only from gaps and V-intersections
      vec3 emission = vec3(0.0);
      if (uIsActive > 0.5) {
        // Emission emerges FROM WITHIN weave gaps only
        float emissionMask = gapMask * (0.3 + 0.7 * vMask);
        
        // Volumetric softness at gap edges
        float edgeSoft = smoothstep(0.0, 0.02, gapMask);
        
        emission = uGlowColor * uLuminance * emissionMask * edgeSoft;
        
        // Subsurface scattering hint — light diffuses slightly
        emission *= 0.8 + 0.2 * texColor.g;
      }
      
      // Final composite — no overlay, emission is additive from within
      vec3 finalColor = fabricColor + emission;
      
      // Scanline tracer — ultra-thin, no bloom
      float lineDist = abs(vUv.x - uProgress);
      float scanline = smoothstep(0.002, 0.0, lineDist);
      finalColor = mix(finalColor, uGlowColor * 0.3, scanline);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
)

extend({ DecayMaterial })

declare module '@react-three/fiber' {
  interface IntrinsicElements {
    decayMaterial: any
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEATBELT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface SeatbeltProps {
  progressRef: React.MutableRefObject<number>
  isActive: boolean
  luminanceRef: React.MutableRefObject<number>
}

function Seatbelt({ progressRef, isActive, luminanceRef }: SeatbeltProps) {
  const { viewport } = useThree()
  const beltTex = useTexture('https://res.cloudinary.com/dx2rreo0l/image/upload/q_auto:eco,f_auto/v1775756343/belt_nzxlyv.jpg')
  
  const matRef = useRef<any>(null)

  useFrame(() => {
    if (matRef.current) {
      matRef.current.uProgress = progressRef.current
      matRef.current.uIsActive = isActive ? 1.0 : 0.0
      matRef.current.uLuminance = luminanceRef.current
    }
  })

  const width = viewport.width * 0.85
  const height = viewport.height * 0.18

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <decayMaterial 
        ref={matRef} 
        uTex={beltTex} 
        uResolution={new THREE.Vector2(width, height)}
        uTexResolution={new THREE.Vector2(beltTex.image?.width || 1, beltTex.image?.height || 1)}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA MARKERS
// ─────────────────────────────────────────────────────────────────────────────

interface MarkerData {
  id: number
  position: number
  charge: string
  remaining: string
  luminance: string
}

const MARKERS: MarkerData[] = [
  { id: 1, position: 0.0, charge: '100%', remaining: '12.0h', luminance: '300 mcd/m²' },
  { id: 2, position: 0.22, charge: '80%', remaining: '9.5h', luminance: '240 mcd/m²' },
  { id: 3, position: 0.5, charge: '50%', remaining: '6.0h', luminance: '150 mcd/m²' },
  { id: 4, position: 0.85, charge: '10%', remaining: '1.2h', luminance: '30 mcd/m²' },
]

interface MarkersProps {
  progressRef: React.MutableRefObject<number>
}

function Markers({ progressRef }: MarkersProps) {
  const [visibleMarkers, setVisibleMarkers] = useState<Set<number>>(new Set())
  const { viewport } = useThree()
  
  useFrame(() => {
    const currentProgress = progressRef.current
    const newlyVisible = new Set<number>()
    
    MARKERS.forEach(marker => {
      const threshold = 0.02
      if (Math.abs(currentProgress - marker.position) < threshold) {
        newlyVisible.add(marker.id)
      }
    })
    
    if (newlyVisible.size !== visibleMarkers.size) {
      setVisibleMarkers(newlyVisible)
    }
  })

  const markerY = viewport.height * 0.35

  return (
    <>
      {MARKERS.map((marker) => {
        const isVisible = visibleMarkers.has(marker.id)
        const x = (marker.position - 0.5) * viewport.width * 0.7
        
        return (
          <group key={marker.id} position={[x, markerY, 0]}>
            <HtmlMarker marker={marker} isVisible={isVisible} />
          </group>
        )
      })}
    </>
  )
}

// HTML overlay for markers (glass micro-tags)
function HtmlMarker({ marker, isVisible }: { marker: MarkerData; isVisible: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        transformStyle: 'preserve-3d',
        transform: isVisible 
          ? 'translate(-50%, -50%) translateZ(8px)' 
          : 'translate(-50%, -50%) translateZ(0)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(5, 5, 5, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(180, 255, 200, 0.2)',
          borderRadius: '4px',
          padding: '8px 12px',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '10px',
          color: '#B4FFC8',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
          boxShadow: isVisible ? '0 0 20px rgba(180, 255, 200, 0.1)' : 'none',
        }}
      >
        <div style={{ marginBottom: '4px', opacity: 0.7 }}>MKR-0{marker.id}</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>{marker.charge}</span>
          <span>{marker.remaining}</span>
          <span>{marker.luminance}</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TRACER LINE
// ─────────────────────────────────────────────────────────────────────────────

interface TracerProps {
  progressRef: React.MutableRefObject<number>
}

function Tracer({ progressRef }: TracerProps) {
  const { viewport } = useThree()
  const lineRef = useRef<THREE.Line>(null)
  
  const springConfig = useMemo(() => ({ stiffness: 10, damping: 40, mass: 1.2 }), [])
  const springRef = useRef({ current: 0, velocity: 0 })
  
  useFrame(() => {
    const target = progressRef.current
    const spring = springRef.current
    
    // Hydraulic inertia simulation
    const acceleration = (target - spring.current) * springConfig.stiffness
    const damping = -spring.velocity * springConfig.damping
    const totalForce = acceleration + damping
    const newVelocity = (spring.velocity + totalForce / springConfig.mass) * 0.9
    const newPosition = spring.current + newVelocity
    
    spring.current = newPosition
    spring.velocity = newVelocity
    
    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position.array
      const startX = -viewport.width * 0.35
      const endX = (spring.current - 0.5) * viewport.width * 0.7
      
      // Update line endpoint based on spring position
      positions[3] = endX
      lineRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  const halfWidth = viewport.width * 0.35

  return (
    <line ref={lineRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([
            -halfWidth, 0, 0.01,
            -halfWidth, 0, 0.01,
          ])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial attach="material" color="#4a6b5a" />
    </line>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENE
// ─────────────────────────────────────────────────────────────────────────────

interface SceneProps {
  progressRef: React.MutableRefObject<number>
  isActive: boolean
  luminanceRef: React.MutableRefObject<number>
}

function Scene({ progressRef, isActive, luminanceRef }: SceneProps) {
  return (
    <>
      <color attach="background" args={isActive ? '#050505' : '#ffffff'} />
      <Seatbelt progressRef={progressRef} isActive={isActive} luminanceRef={luminanceRef} />
      <Tracer progressRef={progressRef} />
      <Markers progressRef={progressRef} />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function MaterialDecayTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const luminanceRef = useRef(1.0)
  const [isActive, setIsActive] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Current time and luminance for UI display
  const [displayTime, setDisplayTime] = useState(0)
  const [displayLuminance, setDisplayLuminance] = useState(300)

  // Exponential decay: L = L₀ * e^(-kt)
  // Tuned for 12-hour decay where at t=1 (100% scroll), luminance ≈ 10%
  const calculateLuminance = (t: number): number => {
    const L0 = 300 // mcd/m²
    const k = 1.9 // decay constant tuned for 12h curve
    return L0 * Math.exp(-k * t)
  }

  // Handle toggle activation
  const handleToggle = () => {
    if (isTransitioning) return
    
    setIsTransitioning(true)
    
    // Hard cut initiation (0-120ms)
    setTimeout(() => {
      setIsActive(!isActive)
      
      // Environmental transition (120-900ms)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 780)
    }, 120)
  }

  // Scroll handling — vertical input → horizontal timeline
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1)
      
      progressRef.current = progress
      
      // Calculate time (0-12 hours)
      const time = progress * 12
      setDisplayTime(time)
      
      // Calculate luminance using exponential decay
      const lum = calculateLuminance(progress)
      luminanceRef.current = lum / 300 // normalize 0-1
      setDisplayLuminance(Math.round(lum))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Inject fonts
  useEffect(() => {
    const link1 = document.createElement('link')
    link1.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap'
    link1.rel = 'stylesheet'
    document.head.appendChild(link1)

    return () => {
      document.head.removeChild(link1)
    }
  }, [])

  const remainingHours = Math.max(0, 12 - displayTime).toFixed(1)

  return (
    <div style={{ 
      minHeight: '300vh', 
      backgroundColor: isActive ? '#050505' : '#ffffff',
      transition: 'background-color 0.78s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {/* Sticky viewport */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        height: '100vh', 
        width: '100%', 
        overflow: 'hidden',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}>
        
        {/* UI Layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          
          {/* Header — Photopic/Scotopic state indicator */}
          <div style={{
            position: 'absolute',
            top: '48px',
            left: '48px',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: isActive ? '#B4FFC8' : '#1a1a1a',
            opacity: 0.8,
          }}>
            {isActive ? '[ SCOTOPIC : OBSERVATION MODE ]' : '[ PHOTOPIC : BASELINE STATE ]'}
          </div>

          {/* Data panel — right side */}
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '48px',
            transform: 'translateY(-50%)',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color: isActive ? '#B4FFC8' : '#1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            minWidth: '280px',
          }}>
            <div style={{
              borderBottom: `1px solid ${isActive ? 'rgba(180, 255, 200, 0.2)' : 'rgba(26, 26, 26, 0.2)'}`,
              paddingBottom: '12px',
            }}>
              <div style={{ opacity: 0.5, marginBottom: '4px' }}>ELAPSED TIME</div>
              <div style={{ fontSize: '20px' }}>{displayTime.toFixed(1)} HOURS</div>
            </div>
            
            <div style={{
              borderBottom: `1px solid ${isActive ? 'rgba(180, 255, 200, 0.2)' : 'rgba(26, 26, 26, 0.2)'}`,
              paddingBottom: '12px',
            }}>
              <div style={{ opacity: 0.5, marginBottom: '4px' }}>REMAINING</div>
              <div style={{ fontSize: '20px' }}>{remainingHours} HOURS</div>
            </div>
            
            <div style={{
              borderBottom: `1px solid ${isActive ? 'rgba(180, 255, 200, 0.2)' : 'rgba(26, 26, 26, 0.2)'}`,
              paddingBottom: '12px',
            }}>
              <div style={{ opacity: 0.5, marginBottom: '4px' }}>LUMINANCE</div>
              <div style={{ fontSize: '20px' }}>{displayLuminance} mcd/m²</div>
            </div>
            
            <div style={{ paddingTop: '8px' }}>
              <div style={{ opacity: 0.5, marginBottom: '4px' }}>CHARGE LEVEL</div>
              <div style={{ fontSize: '20px' }}>{Math.round((1 - displayTime / 12) * 100)}%</div>
            </div>
          </div>

          {/* Timeline axis label */}
          <div style={{
            position: 'absolute',
            bottom: '48px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: '"Inter", sans-serif',
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: isActive ? 'rgba(180, 255, 200, 0.5)' : 'rgba(26, 26, 26, 0.5)',
          }}>
            12-Hour Photoluminescent Decay Timeline
          </div>

          {/* Activation Toggle — Center */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
            zIndex: 20,
          }}>
            <button
              onClick={handleToggle}
              disabled={isTransitioning}
              style={{
                width: '120px',
                height: '64px',
                borderRadius: '32px',
                border: 'none',
                background: isActive 
                  ? 'linear-gradient(135deg, rgba(180, 255, 200, 0.15) 0%, rgba(180, 255, 200, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 240, 240, 0.8) 100%)',
                backdropFilter: 'blur(64px)',
                cursor: isTransitioning ? 'default' : 'pointer',
                outline: 'none',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isActive 
                  ? 'inset 0 0 40px rgba(180, 255, 200, 0.1), 0 0 20px rgba(180, 255, 200, 0.05)'
                  : 'inset 0 0 20px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Internal edge glow */}
              <div style={{
                position: 'absolute',
                inset: '2px',
                borderRadius: '30px',
                background: isActive 
                  ? 'linear-gradient(180deg, transparent 0%, rgba(180, 255, 200, 0.08) 50%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%)',
                pointerEvents: 'none',
              }} />
              
              {/* Toggle indicator */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: isActive ? 'calc(100% - 28px)' : '28px',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: isActive 
                  ? 'radial-gradient(circle at 30% 30%, #B4FFC8 0%, #6BB88A 100%)'
                  : 'radial-gradient(circle at 30% 30%, #ffffff 0%, #d0d0d0 100%)',
                boxShadow: isActive 
                  ? '0 0 20px rgba(180, 255, 200, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s',
              }} />
              
              {/* Label */}
              <span style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: '"Inter", sans-serif',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isActive ? '#B4FFC8' : '#666',
                pointerEvents: 'none',
                opacity: 0.7,
              }}>
                {isActive ? 'ACTIVE' : 'STANDBY'}
              </span>
            </button>
          </div>
        </div>

        {/* R3F Canvas */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
        }}>
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{ willChange: 'transform' }}
          >
            <Suspense fallback={null}>
              <Scene 
                progressRef={progressRef} 
                isActive={isActive} 
                luminanceRef={luminanceRef}
              />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  )
}
