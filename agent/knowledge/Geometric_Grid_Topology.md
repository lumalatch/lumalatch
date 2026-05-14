# LUMA LATCH: GEOMETRIC GRID TOPOLOGY

## 1. THE 8-SHAFT HERRINGBONE GRID (THE SKELETON)
The site layout is not a standard 12-column grid. It is a **60% Catwalk / 40% Data** split, governed by the physics of an 8-shaft twill weave.

- **Primary Axis (The Warp):** Vertical flow. Strictly aligned to the `8-shaft` rhythm.
- **Secondary Axis (The Weft):** Horizontal data injection. Interlocks with the Warp at precise 45-degree angles.
- **Gutter Logic:** Gutters are not empty space; they are **"Shadow Voids"** (#050505). They represent the physical depth between woven threads.
- **Grid Unit:** `1vh = 1 Thread Width`. All spacing is relative to viewport height to maintain macro-scale immersion.

## 2. SPATIAL CONSTRAINTS (THE CATWALK)
- **Content Width:** Max 60vw (Centered). This is the "Illuminated Core."
- **Data Margins:** 20vw Left | 20vw Right. These are the "Structural Edges" where technical specs (Monospace) anchor.
- **Alignment:** 
  - Text aligns to the **Left Edge** of the Catwalk.
  - Images align to the **Right Edge** of the Catwalk.
  - This creates a "Tension Line" down the center, mimicking the stress point of a seatbelt under load.

## 3. SVG WEAVE PATTERN SPECIFICATIONS
For all background textures and section dividers, use the following SVG logic:
- **Pattern ID:** `herringbone-8shaft`
- **Tile Size:** 64px x 64px
- **Stroke Width:** 1.5px (Sharp, no anti-aliasing blur)
- **Color:** #1A1A1A (Subtle structure on #050505 void)
- **Geometry:** 
  - Path A: `(0,0) -> (32,32) -> (64,0)`
  - Path B: `(0,64) -> (32,32) -> (64,64)`
  - *Note:* This creates the classic "V" shape of the herringbone.
- **Opacity:** 0.05 (Only visible on close inspection or scroll-hover)

## 4. RESPONSIVE COLLAPSE PROTOCOL
- **Desktop (>1024px):** Full 60/40 Split. Herringbone gutters active.
- **Tablet (768px-1024px):** Collapse Data Margins to 10vw. Catwalk expands to 80vw.
- **Mobile (<768px):** Single Column. Herringbone pattern rotates 90 degrees to become horizontal "stacking layers." Gutters become vertical spacers (2rem).