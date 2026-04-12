/**
 * FORENSIC PHOTOLUMINESCENT WEAVE SHADER SYSTEM
 * Awards-calibre physically believable material
 * 
 * Physical Principles:
 * - Subsurface light containment (trapped beneath fibers)
 * - Stochastic decay (non-linear, multi-frequency)
 * - Spectral compression (Purkinje effect)
 * - Micro shadowing & occlusion
 */

// ============================================
// VERTEX SHADER
// ============================================
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ============================================
// FRAGMENT SHADER
// ============================================
const fragmentShader = `
  precision highp float;
  
  // Uniforms
  uniform float uTime;
  uniform sampler2D uLumaMask;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uScrollProgress;
  uniform float uPixelRatio;
  
  // Varyings
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  // ==========================================
  // NOISE FUNCTIONS (Simplex + FBM)
  // ==========================================
  
  // Simplex 2D noise by Ian McEwan, Ashima Arts
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
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
  
  // Fractal Brownian Motion for multi-frequency detail
  float fbm(vec2 st, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    
    for (int i = 0; i < octaves; i++) {
      value += amplitude * snoise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // ==========================================
  // PHYSICAL CONSTANTS
  // ==========================================
  
  // Photoluminescent decay parameters
  const float L0 = 300.0;      // Initial luminance
  const float decayRate = 0.25; // Decay coefficient
  const float decayExponent = 1.6; // Non-linear decay power
  
  // Material properties
  const float albedo = 0.05;     // Deep charcoal base
  const float roughness = 0.8;   // Matte threads
  const float reflectance = 0.05; // Minimal surface reflection
  
  // Emerald signal (#B4FFC8 normalized)
  const vec3 emeraldSignal = vec3(0.706, 1.0, 0.784);
  
  // ==========================================
  // CURVATURE & OCCLUSION CALCULATION
  // ==========================================
  
  // Calculate curvature bias for subsurface containment
  float calculateCurvature(vec2 uv) {
    float texelSize = 1.0 / 512.0;
    
    // Sample neighboring points for curvature estimation
    float center = texture2D(uLumaMask, uv).r;
    float left = texture2D(uLumaMask, uv + vec2(-texelSize, 0.0)).r;
    float right = texture2D(uLumaMask, uv + vec2(texelSize, 0.0)).r;
    float top = texture2D(uLumaMask, uv + vec2(0.0, -texelSize)).r;
    float bottom = texture2D(uLumaMask, uv + vec2(0.0, texelSize)).r;
    
    // Laplacian approximation (second derivative)
    float laplacian = (left + right + top + bottom) - 4.0 * center;
    
    // Curvature bias: positive in valleys (V-shaped recesses)
    // Negative at ridges (thread boundaries)
    float curvature = clamp(laplacian * 2.0 + 0.5, 0.0, 1.0);
    
    return curvature;
  }
  
  // Ambient occlusion from weave pattern contrast
  float calculateAO(vec2 uv, float weavePattern) {
    float contrast = abs(dFdx(weavePattern)) + abs(dFdy(weavePattern));
    // Higher contrast = deeper gaps = more occlusion
    float ao = 1.0 - smoothstep(0.0, 0.8, contrast);
    return mix(0.6, 1.0, ao);
  }
  
  // ==========================================
  // STOCHASTIC DECAY (Multi-frequency)
  // ==========================================
  
  float stochasticDecay(float time, vec2 uv) {
    // Multi-layered noise for uneven light death
    float noise1 = snoise(uv * 500.0 + time * 0.1);
    float noise2 = snoise(uv * 250.0 - time * 0.05) * 0.5;
    float noise3 = fbm(uv * 1000.0, 3) * 0.25;
    
    // Combine with decreasing influence
    float combinedNoise = noise1 + noise2 + noise3;
    
    // Soft threshold instead of harsh step()
    // Creates gradual "starvation" effect
    float threshold = 0.35 - (time * 0.02);
    float erosion = smoothstep(threshold, threshold + 0.15, combinedNoise);
    
    return erosion;
  }
  
  // ==========================================
  // SPECTRAL COMPRESSION (Purkinje Effect)
  // ==========================================
  
  vec3 spectralShift(vec3 baseColor, float luminance) {
    // As luminance decreases:
    // 1. Saturation drops BEFORE brightness
    // 2. Green shifts toward neutral grey
    
    float normalizedLum = clamp(luminance / 300.0, 0.0, 1.0);
    
    // Desaturation factor increases as light fades
    float desaturationFactor = 1.0 - pow(normalizedLum, 0.7);
    
    // Neutral grey target
    vec3 neutralGrey = vec3(0.75, 0.78, 0.76);
    
    // Mix toward grey as luminance decreases
    vec3 shiftedColor = mix(baseColor, neutralGrey, desaturationFactor * 0.6);
    
    // Additional brightness falloff
    shiftedColor *= pow(normalizedLum, 0.85);
    
    return shiftedColor;
  }
  
  // ==========================================
  // TEMPORAL FLICKER (Electron Instability)
  // ==========================================
  
  float temporalFlicker(float time, float decayProgress) {
    // High-frequency micro-flicker
    float flicker1 = snoise(vec2(time * 50.0, 0.0)) * 0.03;
    
    // Lower frequency pulse
    float flicker2 = sin(time * 8.0) * cos(time * 13.0) * 0.02;
    
    // Frequency decreases over time (damping)
    float damping = 1.0 - decayProgress * 0.7;
    
    return 1.0 + (flicker1 + flicker2) * damping;
  }
  
  // ==========================================
  // MICRO SPECULAR HIGHLIGHT (Cursor Interaction)
  // ==========================================
  
  float microSpecular(vec2 uv, vec3 normal) {
    if (uMouse.x < 0.0 || uMouse.y < 0.0) return 0.0;
    
    // Calculate distance from cursor
    vec2 mouseUV = uMouse / uResolution;
    float dist = distance(uv, mouseUV);
    
    // Very subtle highlight shift (NOT glossy)
    float highlight = exp(-dist * 15.0) * 0.08;
    
    // Add micro-detail noise
    float microDetail = snoise(uv * 200.0 + uTime * 0.2) * 0.5 + 0.5;
    highlight *= microDetail;
    
    return highlight;
  }
  
  // ==========================================
  // MAIN SHADING FUNCTION
  // ==========================================
  
  void main() {
    // Correct UV for aspect ratio
    vec2 uv = vUv;
    
    // ========================================
    // 1. FORENSIC WEAVE OCCLUSION LOGIC
    // ========================================
    
    float weavePattern = texture2D(uLumaMask, uv).r;
    
    // Enhanced stochastic erosion (multi-frequency, soft threshold)
    float stochasticErosion = stochasticDecay(uTime, uv);
    
    // ========================================
    // 2. SUBSURFACE LIGHT CONTAINMENT
    // ========================================
    
    // Curvature bias: emission strongest in V-shaped recess centers
    float curvatureBias = calculateCurvature(uv);
    
    // Edge falloff toward thread boundaries
    float edgeFalloff = smoothstep(0.0, 0.3, weavePattern);
    edgeFalloff *= smoothstep(1.0, 0.7, weavePattern);
    
    // Combine containment factors
    float subsurfaceContainment = curvatureBias * edgeFalloff;
    
    // ========================================
    // 3. MULTI-PHASE LUMINANCE DECAY
    // ========================================
    
    // Scroll-driven decay time
    float scrollTime = uScrollProgress * 10.0;
    float effectiveTime = uTime * 0.1 + scrollTime;
    
    // Physical decay formula: L = L0 / (1 + a*t)^n
    float rawLuminance = L0 / pow((1.0 + decayRate * effectiveTime), decayExponent);
    
    // Normalize to 0-1 range for shader
    float normalizedLuminance = rawLuminance / L0;
    
    // ========================================
    // 4. AMBIENT OCCLUSION MULTIPLIER
    // ========================================
    
    float aoMultiplier = calculateAO(uv, weavePattern);
    
    // ========================================
    // 5. FINAL EMISSION CALCULATION
    // ========================================
    
    // Base emission from weave pattern
    float baseEmission = weavePattern * stochasticErosion;
    
    // Apply subsurface containment
    float containedEmission = baseEmission * subsurfaceContainment;
    
    // Apply AO
    containedEmission *= aoMultiplier;
    
    // Apply luminance decay
    float finalEmission = containedEmission * normalizedLuminance;
    
    // Apply temporal flicker
    finalEmission *= temporalFlicker(uTime, uScrollProgress);
    
    // Clamp to prevent negative values
    finalEmission = max(finalEmission, 0.0);
    
    // ========================================
    // 6. SPECTRAL COMPRESSION
    // ========================================
    
    vec3 spectralColor = spectralShift(emeraldSignal, rawLuminance);
    
    // ========================================
    // 7. MICRO SPECULAR INTERACTION
    // ========================================
    
    float specularHighlight = microSpecular(uv, vNormal);
    
    // ========================================
    // 8. BASE ALBEDO (Thread Material)
    // ========================================
    
    // Deep charcoal base color
    vec3 baseAlbedo = vec3(albedo);
    
    // Add subtle thread texture
    float threadNoise = fbm(uv * 150.0, 4) * 0.5 + 0.5;
    baseAlbedo *= (0.9 + threadNoise * 0.2);
    
    // ========================================
    // 9. FINAL COMPOSITION
    // ========================================
    
    // Emission layer (ONLY from gaps, never surface glow)
    vec3 emissionLayer = spectralColor * finalEmission;
    
    // Combine base + emission + micro specular
    vec3 finalColor = baseAlbedo + emissionLayer + vec3(specularHighlight);
    
    // Gamma correction
    finalColor = pow(finalColor, vec3(1.0 / 2.2));
    
    // Output
    gl_FragColor = vec4(finalColor, 1.0);
    
    // ========================================
    // DEBUG VISUALIZATION (Uncomment if needed)
    // ========================================
    // gl_FragColor = vec4(vec3(curvatureBias), 1.0);
    // gl_FragColor = vec4(vec3(subsurfaceContainment), 1.0);
    // gl_FragColor = vec4(vec3(stochasticErosion), 1.0);
  }
`;

export { vertexShader, fragmentShader };
