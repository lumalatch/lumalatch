varying vec2 vUv;
uniform float uPerceptualT;
uniform float uTime;
uniform sampler2D uWeave;
uniform float uMicroJitter;
uniform float uBeat;

// Simplex 2D noise
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
  float progress = uPerceptualT;
  
  // 6. Visual Focus Depth Model
  float distCenter = length(vUv - 0.5);
  float depthFocus = 1.0 - clamp(distCenter * 1.5, 0.0, 1.0);
  
  // 1. Hyperbolic Decay
  float L = 300.0 / pow(1.0 + 0.25 * (progress * 15.0), 1.6);
  float normalizedLuminance = L / 300.0;
  
  // 2. Stochastic Erosion
  float rawNoise = snoise(vUv * 12.0 + uTime * 0.2);
  float erosionPhase = smoothstep(0.35, 0.45, progress) - smoothstep(0.60, 0.70, progress);
  
  // 4. Scanline = Perceptual Trigger
  float scanlineY = fract(uTime * 0.15 - progress * 2.0 + uMicroJitter * 5.0);
  float scanDist = abs(vUv.y - scanlineY);
  float scanline = smoothstep(0.015, 0.0, scanDist);
  
  // noise amplitude briefly drops on scanline
  float noise = rawNoise * (1.0 - scanline * 0.8);
  float erosion = 1.0 - (erosionPhase * smoothstep(-0.2, 0.2, noise));
  
  // 3. Occlusion Law & Focus Blur
  float weaveRaw = texture2D(uWeave, vUv).r;
  float weaveMask = mix(0.5, weaveRaw, 0.3 + 0.7 * depthFocus); 
  
  float baseEmission = pow(weaveMask, 3.0) * erosion * normalizedLuminance;
  
  // scanline emission boost
  float scanlineBoost = scanline * smoothstep(0.5, 1.0, weaveMask) * 0.12;
  float emission = baseEmission + scanlineBoost;
  
  // 7. Silent Rhythm Engine (Breathing)
  emission *= (1.0 + uBeat * 0.05);
  
  // Depth focus intensity
  emission = mix(emission * 0.5, emission, depthFocus);
  
  // 4. Purkinje Shift
  vec3 emerald = vec3(180.0/255.0, 255.0/255.0, 200.0/255.0);
  vec3 scotopic = vec3(0.75, 0.78, 0.82);
  float scotopicBlend = smoothstep(0.65, 0.90, progress);
  vec3 colorShift = mix(emerald, scotopic, scotopicBlend);
  
  // Low focus -> desaturated
  float luminance = dot(colorShift, vec3(0.299, 0.587, 0.114));
  vec3 desaturatedColor = mix(vec3(luminance), colorShift, 0.2 + 0.8 * depthFocus);
  
  emission = max(emission, 0.015);
  vec3 finalColor = desaturatedColor * emission;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
