# Tailwind v4 — AEC-V-2026-03 Enforcement Specification

## 1. Configuration Model (MANDATORY)
- Tailwind v4 CSS-first only
- No `tailwind.config.js`
- All tokens defined inside `@theme`

```css
@theme {
  --color-void: #050505;
  --color-luma-520nm: #B4FFC8;
  --grain-opacity: 0.03;
}
2. HARD PROHIBITIONS (AUTO-REJECT)

The following utilities MUST NOT appear:

border-radius / rounded-*
shadow-* / drop-shadow-*
bg-gradient-* / gradient-*
blur / backdrop-blur
mix-blend-mode
filter
opacity-based glow simulation

Any usage = NON-COMPLIANT

3. BACKGROUND LAW
Only allowed background:
#050505
Exception:
Section 02: #F4F4F5

No layered backgrounds. No elevation tones.

4. LIGHT REPRESENTATION
No CSS-based glow
No gradients
No bloom

Light must be:
→ baked into image assets ONLY

5. GEOMETRY RULES
border-radius: 0 (globally enforced)
No soft UI shapes
No neumorphism
No glassmorphism
6. LAYOUT SYSTEM
Use:
flex
grid
Avoid:
visual decoration utilities
7. TYPOGRAPHY
Headers: Inter
Data: JetBrains Mono
Monospace ONLY for numeric/spec content
8. COMPLIANCE PRINCIPLE

Tailwind is used for:

layout
spacing
typography

NOT for:

lighting
rendering
visual effects