import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SceneMachine } from "./SceneMachine";
import { RenderUpdater } from "./RenderUpdater";

gsap.registerPlugin(ScrollTrigger);

/**
 * SOVEREIGN MOTION ENGINE: GLOBAL MASS CONTROLLER
 * friction: 0.85
 * settleFrequency: 3Hz
 * velocity damping: true
 */
export const ScrollCore = {
  init: () => {
    const proxy = { t: 0 };
    
    const trigger = ScrollTrigger.create({
      trigger: "#cinematic-scroll-track",
      start: "top top",
      end: "bottom bottom",
      scrub: false, // We handle smoothing manually via the MassController
      onUpdate: (self) => {
        // MOVEMENT SLIGHTLY TRAILS INPUT
        // Settle with harmonic decay (approx 1.0s duration)
        gsap.to(proxy, {
          t: self.progress,
          duration: 1.0, // 0.8 - 1.2s range
          ease: "expo.out", // High initial velocity, smooth damping
          overwrite: "auto",
          onUpdate: () => {
            const state = SceneMachine.compute(proxy.t);
            RenderUpdater.applyState(state);
          }
        });
      }
    });

    // Initial render guarantee
    RenderUpdater.applyState(SceneMachine.compute(0));

    return () => trigger.kill();
  }
};