import type { SceneState } from "./SceneMachine";
import { MODULE_STACK } from "./SceneRegistry";

/**
 * RENDER UPDATER: SOVEREIGN MOTION ENGINE
 * Enforces standardized title choreography and optical aperture locks.
 */
export const RenderUpdater = {
  applyState(state: SceneState) {
    const root = document.documentElement;
    const t = state.t;
    
    let apertureIntensity = 0;

    // TITLE SYSTEM CHOREOGRAPHY
    MODULE_STACK.forEach(scene => {
      const [start, end] = scene.range;
      const span = end - start;
      
      // Calculate phases based on "0.15 normalized scroll units" hold requirement
      const holdDuration = 0.15; 
      const transitionSpan = (span - holdDuration) / 2;
      
      const lockStart = start + transitionSpan;
      const lockEnd = end - transitionSpan;

      let opacity = 0;
      let y = 100;
      let blur = 50;
      let scale = 2;

      if (t >= start && t <= end) {
        if (t < lockStart) {
          // ENTRY PHASE
          const p = (t - start) / transitionSpan;
          const ease = 1 - Math.pow(1 - p, 4); // expo.out / cubic-bezier(0.19,1,0.22,1)
          
          opacity = ease;
          scale = 2 - ease;
          blur = 50 * (1 - ease);
          y = 100 * (1 - ease);
        } else if (t <= lockEnd) {
          // LOCK / HOLD PHASE
          opacity = 1;
          scale = 1;
          blur = 0;
          y = 0;
          
          // Trigger Aperture Lock intensity for backgrounds
          // Maximize intensity at the center of the hold
          const midHold = (lockStart + lockEnd) / 2;
          const dist = Math.abs(t - midHold) / (holdDuration / 2);
          apertureIntensity = Math.max(apertureIntensity, 1 - dist);
        } else {
          // EXIT PHASE
          const p = (t - lockEnd) / transitionSpan;
          // blur slowly returns, opacity delayed
          blur = p * 25;
          opacity = p > 0.6 ? 1 - (p - 0.6) * 2.5 : 1;
          scale = 1 - p * 0.1;
          y = p * -50;
        }
      }

      root.style.setProperty(`--scene-${scene.id}-op`, opacity.toFixed(4));
      root.style.setProperty(`--scene-${scene.id}-y`, `${y.toFixed(2)}px`);
      root.style.setProperty(`--scene-${scene.id}-blur`, `${blur.toFixed(2)}px`);
      root.style.setProperty(`--scene-${scene.id}-scale`, scale.toFixed(4));
    });

    // OPTICAL APERTURE LOCK: Background effects
    // blur:25px, brightness:.45, scale:.95
    const bgBlur = apertureIntensity * 25;
    const bgBright = 1 - (apertureIntensity * 0.55);
    const bgScale = 1 - (apertureIntensity * 0.05);

    root.style.setProperty('--bg-aperture-blur', `${bgBlur}px`);
    root.style.setProperty('--bg-aperture-bright', String(bgBright));
    root.style.setProperty('--bg-aperture-scale', String(bgScale));

    // MATERIAL SCIENCE MANIFEST
    root.style.setProperty('--mat-opacity', String(state.material.opacity));
    root.style.setProperty('--mat-blur', `${state.material.blur}px`);
    root.style.setProperty('--mat-bg-shift', `${state.material.bgShift}px`);

    // OPTICAL PHYSICS
    root.style.setProperty('--phys-scale', String(state.physics.scale));
    root.style.setProperty('--phys-y', `${state.physics.yOffset}px`);

    // CLINICAL FEEDBACK
    const readout = document.getElementById("metadata-readout");
    if (readout) {
      readout.textContent = `LUMA_LATCH // STATE: ${state.t.toFixed(4)}`;
    }
  }
};