# FORENSIC PHOTOLUMINESCENT WEAVE SHADER SYSTEM
## Technical Documentation & Physical Enhancement Analysis

---

## OVERVIEW

This shader system implements a **physically believable photoluminescent material** designed for forensic-grade scrollytelling experiences. The goal is to simulate light trapped within a woven polymer structure—not a "glow effect," but a material sample under microscopic observation.

**Visual Target:** A $100,000 optical lab instrument visualizing trapped photonic energy inside a woven polymer structure.

---

## FILE STRUCTURE

```
/workspace
├── PhotoluminescentShader.js    # GLSL shaders (vertex + fragment)
├── PhotoluminescentWeave.jsx    # React Three Fiber components
├── demo.html                    # Standalone interactive demo
└── TECHNICAL_DOCUMENTATION.md   # This file
```

---

## PHYSICAL ENHANCEMENTS BREAKDOWN

### 1. SUBSURFACE LIGHT CONTAINMENT ⭐ MANDATORY

**Problem Solved:** Traditional emission shaders make light appear on the surface. Real photoluminescent materials trap light beneath fibers.

**Implementation:**
```glsl
float calculateCurvature(vec2 uv) {
    float texelSize = 1.0 / 512.0;
    float center = texture2D(uLumaMask, uv).r;
    float left = texture2D(uLumaMask, uv + vec2(-texelSize, 0.0)).r;
    float right = texture2D(uLumaMask, uv + vec2(texelSize, 0.0)).r;
    float top = texture2D(uLumaMask, uv + vec2(0.0, -texelSize)).r;
    float bottom = texture2D(uLumaMask, uv + vec2(0.0, texelSize)).r;
    
    float laplacian = (left + right + top + bottom) - 4.0 * center;
    return clamp(laplacian * 2.0 + 0.5, 0.0, 1.0);
}
```

**Why It Improves Realism:**
- Uses Laplacian approximation to detect surface curvature
- Positive values in valleys (V-shaped recesses) = brighter emission
- Negative values at ridges (thread boundaries) = darker edges
- Creates the illusion that light originates from WITHIN the weave gaps

**Edge Falloff:**
```glsl
float edgeFalloff = smoothstep(0.0, 0.3, weavePattern);
edgeFalloff *= smoothstep(1.0, 0.7, weavePattern);
```
This ensures threads themselves don't glow—only the gaps between them.

---

### 2. TRUE STOCHASTIC DECAY 🎲 NO LINEAR FADES

**Problem Solved:** Binary `step()` functions create harsh, unrealistic cutoffs. Real materials decay unevenly due to microstructural variations.

**Before (Original):**
```glsl
float stochasticErosion = step(decayThreshold, snoise(vUv * 500.0 + uTime));
```

**After (Enhanced):**
```glsl
float stochasticDecay(float time, vec2 uv) {
    float noise1 = snoise(uv * 500.0 + time * 0.1);
    float noise2 = snoise(uv * 250.0 - time * 0.05) * 0.5;
    float noise3 = fbm(uv * 1000.0, 3) * 0.25;
    float combinedNoise = noise1 + noise2 + noise3;
    
    float threshold = 0.35 - (time * 0.02);
    return smoothstep(threshold, threshold + 0.15, combinedNoise);
}
```

**Why It Improves Realism:**
- **Multi-frequency noise:** Three layers at different scales (500, 250, 1000)
- **Soft threshold:** `smoothstep()` creates gradual transitions instead of hard edges
- **Temporal variation:** Each noise layer moves at different speeds
- **Micro starvation effect:** Some areas dim before others, like real phosphorescent decay

---

### 3. MULTI-PHASE LUMINANCE DECAY ⏳ PHYSICS-BASED

**Problem Solved:** Simple `uLuminance` uniform doesn't represent how photoluminescent materials actually lose brightness over time.

**Physical Formula:**
```
L(t) = L₀ / (1 + a·t)^n
```

Where:
- `L₀ = 300.0` (initial luminance)
- `a = 0.25` (decay coefficient)
- `n = 1.6` (non-linear exponent)

**Implementation:**
```glsl
const float L0 = 300.0;
const float decayRate = 0.25;
const float decayExponent = 1.6;

float scrollTime = uScrollProgress * 10.0;
float effectiveTime = uTime * 0.1 + scrollTime;
float rawLuminance = L0 / pow((1.0 + decayRate * effectiveTime), decayExponent);
float normalizedLuminance = rawLuminance / L0;
```

**Why It Improves Realism:**
- Non-linear decay matches real phosphorescent materials
- Scroll-driven component ties visual decay to user interaction
- Gradual power-law falloff instead of linear interpolation

---

### 4. SPECTRAL COMPRESSION (PURKINJE EFFECT) 🌈

**Problem Solved:** As real photoluminescent materials fade, they don't just get darker—they change color. Saturation drops BEFORE brightness.

**Implementation:**
```glsl
vec3 spectralShift(vec3 baseColor, float luminance) {
    float normalizedLum = clamp(luminance / 300.0, 0.0, 1.0);
    
    // Desaturation increases as light fades
    float desaturationFactor = 1.0 - pow(normalizedLum, 0.7);
    
    // Shift toward neutral grey
    vec3 neutralGrey = vec3(0.75, 0.78, 0.76);
    vec3 shiftedColor = mix(baseColor, neutralGrey, desaturationFactor * 0.6);
    
    // Additional brightness falloff
    shiftedColor *= pow(normalizedLum, 0.85);
    
    return shiftedColor;
}
```

**Why It Improves Realism:**
- **Desaturation first:** Color loses saturation before losing brightness
- **Neutral grey target:** Emerald (#B4FFC8) shifts toward grey, not black
- **Perceptual accuracy:** Mimics how human eyes perceive fading light (Purkinje shift)

---

### 5. MICRO SHADOWING (OCCLUSION LAW) 🌓

**Problem Solved:** Uniform glow looks fake. Real woven structures cast internal shadows.

**Implementation:**
```glsl
float calculateAO(vec2 uv, float weavePattern) {
    float contrast = abs(dFdx(weavePattern)) + abs(dFdy(weavePattern));
    float ao = 1.0 - smoothstep(0.0, 0.8, contrast);
    return mix(0.6, 1.0, ao);
}
```

**Why It Improves Realism:**
- Uses derivative functions (`dFdx`, `dFdy`) to detect local contrast
- High contrast = deep gaps = more ambient occlusion
- Multiplier ranges from 0.6 (deep shadow) to 1.0 (full exposure)
- Creates subtle depth variation within the weave pattern

---

### 6. TEMPORAL FLICKER (ELECTRON INSTABILITY) ⚡

**Problem Solved:** Perfectly steady emission looks artificial. Real photoluminescent materials exhibit micro-fluctuations.

**Implementation:**
```glsl
float temporalFlicker(float time, float decayProgress) {
    float flicker1 = snoise(vec2(time * 50.0, 0.0)) * 0.03;
    float flicker2 = sin(time * 8.0) * cos(time * 13.0) * 0.02;
    float damping = 1.0 - decayProgress * 0.7;
    return 1.0 + (flicker1 + flicker2) * damping;
}
```

**Why It Improves Realism:**
- **High-frequency noise:** 50Hz micro-flicker (±3%)
- **Beat frequency:** 8Hz × 13Hz creates irregular pulse pattern
- **Damping:** Flicker decreases as material decays (energy depletion)
- **Subtlety:** Total variation under 5%—perceptible but not distracting

---

### 7. MICRO SPECULAR INTERACTION 👆

**Problem Solved:** Completely matte surfaces look dead. Real materials have subtle light disturbance from viewer/cursor position.

**Implementation:**
```glsl
float microSpecular(vec2 uv, vec3 normal) {
    if (uMouse.x < 0.0 || uMouse.y < 0.0) return 0.0;
    
    vec2 mouseUV = uMouse / uResolution;
    float dist = distance(uv, mouseUV);
    float highlight = exp(-dist * 15.0) * 0.08;
    
    float microDetail = snoise(uv * 200.0 + uTime * 0.2) * 0.5 + 0.5;
    highlight *= microDetail;
    
    return highlight;
}
```

**Why It Improves Realism:**
- **Exponential falloff:** Sharp but not glossy (15.0 coefficient)
- **Low intensity:** Maximum 8% brightness increase
- **Micro-detail modulation:** Noise prevents plastic-looking highlights
- **NOT glossy:** Deliberately subtle—just light disturbance

---

## MATERIAL PROPERTIES (OPTICAL QUALITY TARGET)

| Property | Value | Purpose |
|----------|-------|---------|
| Albedo | 0.05 | Deep charcoal base (near-black) |
| Roughness | 0.8 | Matte thread surface |
| Reflectance | 0.05 | Minimal surface reflection |
| Emission | Gaps only | Never from thread surface |
| Base Color | #B4FFC8 | Emerald photoluminescent signal |

---

## UNIFORMS REFERENCE

### Required Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `uTime` | float | Elapsed time in seconds |
| `uLumaMask` | sampler2D | Grayscale weave pattern texture |
| `uResolution` | vec2 | Canvas resolution in pixels |
| `uMouse` | vec2 | Cursor position (UV space, -1 if inactive) |
| `uScrollProgress` | float | Scroll position (0.0 - 1.0) |
| `uPixelRatio` | float | Device pixel ratio |

### Animation Loop Integration

```javascript
useFrame((state) => {
  material.uniforms.uTime.value = state.clock.elapsedTime;
  material.uniforms.uScrollProgress.value = scrollProgress;
});
```

---

## REACT THREE FIBER INTEGRATION

### Basic Usage

```jsx
import { PhotoluminescentWeave } from './PhotoluminescentWeave.jsx';

function MyScene() {
  const [scrollProgress, setScrollProgress] = useState(0);
  
  return (
    <Canvas>
      <PhotoluminescentWeave 
        scrollProgress={scrollProgress}
        width={2.5}
        height={4}
      />
    </Canvas>
  );
}
```

### Dual-Layer System (Bonus)

For enhanced physical accuracy with depth-based attenuation:

```jsx
import { DualLayerPhotoluminescentWeave } from './PhotoluminescentWeave.jsx';

<DualLayerPhotoluminescentWeave 
  scrollProgress={scrollProgress}
/>
```

This separates:
1. **Base layer:** Matte charcoal threads (meshStandardMaterial)
2. **Emission layer:** Photoluminescent gaps (shaderMaterial with additive blending)

---

## TEXTURE PIPELINE

### Generating Luma Mask

The system includes a procedural generator for testing:

```javascript
function generateLumaMask() {
  const canvas = document.createElement('canvas');
  // ... diagonal weave pattern with noise
  return canvas;
}
```

### Production Workflow

For production, replace with actual captured luma mask:

```javascript
const texture = new TextureLoader().load('/path/to/luma-mask.png');
texture.wrapS = texture.wrapT = RepeatWrapping;
texture.needsUpdate = true;
```

**Recommended texture specs:**
- Resolution: 512×512 or 1024×1024
- Format: 8-bit grayscale PNG
- Pattern: High-contrast weave with soft edges

---

## SCROLL-DRIVEN DECAY MAPPING

The system accepts external scroll progress and maps it to decay time:

```javascript
const scrollTime = uScrollProgress * 10.0;
const effectiveTime = uTime * 0.1 + scrollTime;
```

This creates a hybrid decay:
- **Real-time component:** `uTime * 0.1` (ambient temporal decay)
- **Scroll component:** `uScrollProgress * 10.0` (user-controlled decay)

**Result:** Light fades both with time AND scroll progress, creating narrative control.

---

## WHAT THIS SYSTEM AVOIDS ❌

Per hard constraints, this system does NOT:

1. **Additive bloom hacks** — No post-processing glow as primary effect
2. **Uniform luminance** — Belt is NOT uniformly luminous
3. **Neon/LED aesthetics** — Organic photoluminescent decay only
4. **Linear opacity fades** — All decay is non-linear, physics-based
5. **Surface glow** — Emission ONLY from gaps between threads

---

## PERFORMANCE CONSIDERATIONS

### GPU Optimization

- **Single-pass rendering** — All calculations in fragment shader
- **No expensive loops** — FBM limited to 4 octaves max
- **Derivative functions** — `dFdx`/`dFdy` for AO (GPU-native)
- **Texture sampling** — 5 samples per pixel for curvature (acceptable)

### Mobile Considerations

For mobile deployment, consider:
- Reduce FBM octaves from 4 to 3
- Lower noise frequencies by 30%
- Use `mediump` precision where possible

---

## DEBUG VISUALIZATION

Uncomment these lines in the fragment shader to debug individual components:

```glsl
// Debug curvature mask
gl_FragColor = vec4(vec3(calculateCurvature(uv)), 1.0);

// Debug subsurface containment
gl_FragColor = vec4(vec3(subsurfaceContainment), 1.0);

// Debug stochastic erosion
gl_FragColor = vec4(vec3(stochasticErosion), 1.0);
```

---

## VISUAL REFERENCE CHECKLIST

To verify the shader meets quality standards, check for:

- [ ] Light appears TRAPPED beneath fibers, not on surface
- [ ] V-shaped recess centers are brightest
- [ ] Thread boundaries show edge falloff (darker)
- [ ] Decay is UNEVEN (some patches dim before others)
- [ ] Color shifts toward grey as brightness decreases
- [ ] Micro-flicker is perceptible but subtle (<5% variation)
- [ ] Cursor creates micro-specular highlight (not glossy)
- [ ] Base albedo is deep charcoal (~5% reflectance)
- [ ] NO uniform glow across the entire surface
- [ ] Overall feel: optical lab instrument, not UI animation

---

## CREDITS & INSPIRATION

**Shader Techniques:**
- Simplex Noise: Ian McEwan / Ashima Arts
- Curvature-based AO: Common in PBR pipelines
- Purkinje Effect: Human vision research

**Visual References:**
- Scanning electron microscopy of woven polymers
- Photoluminescent safety equipment testing
- Forensic material analysis imagery

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial release with all core features |

---

## SUPPORT

For questions regarding implementation or customization, refer to the inline shader comments and React component documentation.

**End of Documentation**
