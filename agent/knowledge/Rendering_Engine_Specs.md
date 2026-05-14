# LUMA LATCH: OCTANE RENDER PHYSICS STANDARDS (v2.0)

## 1. VIRTUAL OPTICS & CAMERA
- **Lens Profile**: 
  - Scale 01 (Macro): **100mm Macro f/2.8**. Shallow depth of field. Focus stacking required for weave clarity.
  - Scale 02 (Micro): **Electron Microscope Simulation**. Infinite depth of field for crystalline structures.
- **Sensor Settings**:
  - **ISO**: 0.03 (Forensic Grain Texture).
  - **Noise Profile**: Monochromatic Gaussian Noise. No color noise.
  - **Shutter Angle**: 180° (Natural motion blur on scroll).

## 2. ENVIRONMENT & LIGHTING
- **Background**: **#050505 Scotopic Void**.
  - *Constraint:* Zero ambient light. Zero HDRI. The only light source is the material itself.
- **Volumetric Scaling**:
  - **Scale 01 (Macro)**: 0.1m–2m view. Threads cast microscopic self-shadows.
  - **Scale 02 (Micro)**: 0.1mm–5mm view. Subsurface scattering (SSS) visible within crystals.

## 3. INTERACTION PHYSICS (SCROLL & MOUSE)
- **Scroll Inertia**: 
  - Damping: 0.92
  - Curve: Cubic-Bezier **[0.17, 0.67, 0.83, 0.67]** (Heavy, mechanical feel).
- **Parallax Logic**:
  - Mouse X/Y influences **Subsurface Scattering Origin**.
  - Move mouse right -> Light source shifts right inside the fiber core.
  - *Effect:* Creates the illusion of a handheld light source inspecting the material.
- **Scroll Velocity Trigger**:
  - If scroll speed > 100px/s -> Motion blur increases by 20%.
  - If scroll speed < 10px/s -> Sharp focus, grain becomes more visible.