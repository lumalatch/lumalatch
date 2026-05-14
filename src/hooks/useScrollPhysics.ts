/**
 * MASS CONTROLLER — GLOBAL SOVEREIGN PHYSICS
 * friction: 0.85
 * settleFrequency: 3Hz
 * velocity damping: enabled
 *
 * Scroll inertia: movement lags behind user input.
 * On stop: harmonic decay 0.8–1.2s. No immediate halt.
 */

import { useEffect, useRef, useCallback } from 'react';

interface MassControllerState {
  rawT: number;
  smoothT: number;
  velocity: number;
  settling: boolean;
}

// Singleton physics state — shared across the whole app
const MASS_STATE: MassControllerState = {
  rawT: 0,
  smoothT: 0,
  velocity: 0,
  settling: false,
};

// Physics constants
const FRICTION = 0.85;
const SETTLE_FREQ_HZ = 3;
const SETTLE_OMEGA = 2 * Math.PI * SETTLE_FREQ_HZ;
const DAMPING_RATIO = 0.7; // underdamped → harmonic ring-down

let rafId = 0;
let lastTime = 0;
let settleTimer: ReturnType<typeof setTimeout> | null = null;

type PhysicsCallback = (smoothT: number, velocity: number) => void;
const subscribers: Set<PhysicsCallback> = new Set();

function runPhysicsLoop(timestamp: number) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
  lastTime = timestamp;

  const track = document.getElementById('cinematic-scroll-track');
  const th = track ? track.offsetHeight : window.innerHeight * 5;
  const rawT = th > 0 ? window.scrollY / th : 0;

  MASS_STATE.rawT = rawT;

  // Spring-damper model for inertial lag
  const diff = rawT - MASS_STATE.smoothT;
  const springForce = SETTLE_OMEGA * SETTLE_OMEGA * diff;
  const dampForce = 2 * DAMPING_RATIO * SETTLE_OMEGA * MASS_STATE.velocity;
  const acceleration = springForce - dampForce;

  MASS_STATE.velocity += acceleration * dt;
  // Apply friction to velocity
  MASS_STATE.velocity *= Math.pow(FRICTION, dt * 60);
  MASS_STATE.smoothT += MASS_STATE.velocity * dt;

  // Clamp
  MASS_STATE.smoothT = Math.max(0, Math.min(1, MASS_STATE.smoothT));

  // Notify all subscribers
  subscribers.forEach(cb => cb(MASS_STATE.smoothT, MASS_STATE.velocity));

  // Write CSS vars for skew/blur from velocity magnitude
  const absVel = Math.abs(MASS_STATE.velocity);
  document.documentElement.style.setProperty(
    '--scroll-vel-skew',
    `${Math.max(-4, Math.min(4, MASS_STATE.velocity * 0.04))}deg`
  );
  document.documentElement.style.setProperty(
    '--scroll-vel-blur',
    `${Math.min(absVel * 0.015, 3)}px`
  );

  rafId = requestAnimationFrame(runPhysicsLoop);
}

export function startMassController() {
  if (rafId) return;
  lastTime = 0;
  rafId = requestAnimationFrame(runPhysicsLoop);
}

export function stopMassController() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

export function subscribeMassController(cb: PhysicsCallback): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

/**
 * Hook: useScrollPhysics
 * Returns smoothT (inertial progress 0→1) and velocity.
 */
export function useScrollPhysics(cb: PhysicsCallback) {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  const stableCb = useCallback((t: number, v: number) => {
    cbRef.current(t, v);
  }, []);

  useEffect(() => {
    startMassController();
    const unsub = subscribeMassController(stableCb);
    return () => {
      unsub();
      // Don't stop the loop — RenderLayer may still need it
    };
  }, [stableCb]);
}