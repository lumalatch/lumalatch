# Vite 4 — Forensic Asset Pipeline Specification

## 1. Asset Integrity (CRITICAL)

- All PBR assets must be:
  - .png format
  - uncompressed
  - no base64 embedding

```ts
// vite.config.ts
export default defineConfig({
  build: {
    assetsInlineLimit: 0
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
2. IMPORT STRATEGY (MANDATORY)
All assets imported via ES modules
No string paths in JSX
import { Assets } from '@/assets';
3. DIRECTORY ENFORCEMENT

Allowed patterns:

scale01-* → macro
scale02-* → micro

Reject:

arbitrary filenames
mixed naming
4. NO RUNTIME TEXTURE LOGIC
No:
dynamic asset loading
runtime texture swapping
shader pipelines

This project is:
→ STATIC PBR RENDER DELIVERY

5. IMAGE USAGE RULES
object-contain ONLY
no CSS filters
no transforms that distort material fidelity
6. PERFORMANCE TARGETS
LCP < 1.8s
All images:
lazy loaded except Hero
7. PROHIBITED
GLSL
WebGL shaders
video scrubbing
canvas rendering

These violate deterministic rendering constraints