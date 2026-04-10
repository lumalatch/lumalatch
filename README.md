# Material Decay — Forensic Timeline System

A controlled laboratory simulation of photoluminescent discharge behavior under zero-light conditions.

## Overview

This is NOT a UI component. This is NOT an animation.

This is a **forensic material science visualization** that communicates:
- Energy storage
- Controlled decay  
- Material truth
- Passive safety reliability

## States

### STATE A — PHOTOPIC (Clinical Baseline)
- Background: `#FFFFFF` (absolute clinical white)
- Seatbelt: Matte nylon 6-6, Albedo 0.05, Roughness 0.8
- Lighting: Uniform top-down softbox

### STATE B — SCOTOPIC (Activated Observation)
- Background: `#050505` (pure charcoal void)
- Seatbelt emits 520.4nm wavelength (#B4FFC8 Emerald-Lime)
- Luminance: 300 mcd/m² peak at full charge

## Interaction

1. **Toggle Switch** (center viewport): Activates scotopic mode
   - Hard cut initiation (0–120ms)
   - Environmental transition (120–900ms)
   - Material activation (synchronous)

2. **Scroll**: Vertical input → Horizontal timeline scrubbing
   - Represents 12-hour photoluminescent decay
   - Exponential decay curve: L = L₀ × e^(-kt)

## Data Markers

Four calibration points revealed when tracer intersects:

| Marker | Charge | Remaining | Luminance |
|--------|--------|-----------|-----------|
| 01 | 100% | 12.0h | 300 mcd/m² |
| 02 | 80% | 9.5h | 240 mcd/m² |
| 03 | 50% | 6.0h | 150 mcd/m² |
| 04 | 10% | 1.2h | 30 mcd/m² |

## Typography

- **Headers**: Cormorant Garamond
- **Body**: Inter
- **Data**: JetBrains Mono

## Technical

- Single `.tsx` file
- GPU-safe transforms (`translateZ(0)`, `will-change`)
- No layout shift, no scroll jitter
- Deterministic behavior (no randomness)

## Files

- `MaterialDecayTimeline.tsx` — Main component
- `index.html` — Entry point
- `style.css` — Global styles
