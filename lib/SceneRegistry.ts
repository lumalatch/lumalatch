import { useScrollStore } from './useScrollStore';
import { COLORS } from './useGlobalMotion';

// ============================================================================
// GLOBAL CHOREOGRAPHY CONSTANTS
// ============================================================================

export const CHOREOGRAPHY = {
  // Aperture Lock: Background blurs and dims when title locks at center-screen
  APERTURE_LOCK: {
    blurPx: 25,
    brightness: 0.45,
  },
  
  // Inertia Engine: Heavy, suspended movement feel
  INERTIA_ENGINE: {
    frictionCoefficient: 0.85,
    harmonicDecayHz: 3,
  },
  
  // The 18% Overlap: No hard cuts, acts overlap at 0.15 opacity
  OVERLAP: {
    transitionOpacity: 0.15,
    overlapPercent: 0.18,
  },
};

// ============================================================================
// ACT CONFIGURATIONS
// ============================================================================

export interface ActConfig {
  id: string;
  name: string;
  scrollRange: [number, number];
  visual: string;
  narrative?: string[];
}

export const ACTS: ActConfig[] = [
  {
    id: 'genesis',
    name: 'THE GENESIS CORE',
    scrollRange: [0, 0.25],
    visual: '160 crystalline shards orbiting a scotopic void',
    narrative: ['Photonic emission...', 'within...', 'SrAl₂O₄'],
  },
  {
    id: 'synthesis',
    name: 'THE SYNTHESIS ASSEMBLY',
    scrollRange: [0.18, 0.50],
    visual: 'Nylon 6-6 threads twisting into 8-shaft herringbone weave',
  },
  {
    id: 'occlusion',
    name: 'THE OCCLUSION DISCOVERY',
    scrollRange: [0.43, 0.75],
    visual: 'V-gap inspection with 520.4nm light sweep',
  },
  {
    id: 'sovereign',
    name: 'THE SOVEREIGN DEPLOYMENT',
    scrollRange: [0.68, 1.0],
    visual: 'Full harness orbital rotation, FOV 35 to 120',
  },
];

// ============================================================================
// MESH TRANSMISSION MATERIAL VALUES
// ============================================================================

export const MESH_TRANSMISSION_MATERIAL = {
  roughness: 0.8,
  metalness: 0.05,
  transmission: 1.0,
  thickness: 0.5,
  envMapIntensity: 1.0,
  clearcoat: 0.2,
  clearcoatRoughness: 0.1,
  ior: 1.5,
};

// ============================================================================
// ACT MODULE REGISTRY
// ============================================================================

export type ActModuleType = 'genesis' | 'synthesis' | 'occlusion' | 'sovereign';

export interface ActModule {
  type: ActModuleType;
  component: React.ComponentType<any>;
  config: ActConfig;
}

// Registry mapping act types to their configurations
export const SceneRegistry: Record<ActModuleType, ActConfig> = {
  genesis: ACTS[0],
  synthesis: ACTS[1],
  occlusion: ACTS[2],
  sovereign: ACTS[3],
};

// ============================================================================
// TRANSITION UTILITIES
// ============================================================================

/**
 * Calculate overlap opacity between two acts
 * Act N begins transition while Act N-1 is visible at 0.15 opacity
 */
export function calculateOverlapOpacity(
  currentScroll: number,
  currentActIndex: number,
  previousActIndex: number
): number {
  const currentAct = ACTS[currentActIndex];
  const previousAct = ACTS[previousActIndex];
  
  if (!currentAct || !previousAct) return 1;
  
  const overlapStart = currentAct.scrollRange[0];
  const overlapEnd = currentAct.scrollRange[0] + CHOREOGRAPHY.OVERLAP.overlapPercent;
  
  if (currentScroll < overlapStart) return 0;
  if (currentScroll > overlapEnd) return 1;
  
  // Smooth interpolation for overlap transition
  const t = (currentScroll - overlapStart) / CHOREOGRAPHY.OVERLAP.overlapPercent;
  return t;
}

/**
 * Apply inertia-based motion with friction and harmonic decay
 */
export function applyInertiaMotion(
  velocity: number,
  deltaTime: number,
  position: number,
  targetPosition: number
): { newPosition: number; newVelocity: number } {
  const { frictionCoefficient, harmonicDecayHz } = CHOREOGRAPHY.INERTIA_ENGINE;
  
  // Calculate spring force toward target
  const springForce = (targetPosition - position) * 0.1;
  
  // Apply harmonic decay (damping)
  const damping = Math.exp(-harmonicDecayHz * deltaTime);
  
  // Apply friction to velocity
  const frictionApplied = velocity * frictionCoefficient;
  
  // Update velocity with spring force and damping
  const newVelocity = (frictionApplied + springForce) * damping;
  
  // Update position
  const newPosition = position + newVelocity * deltaTime;
  
  return { newPosition, newVelocity };
}

/**
 * Get aperture lock state based on title position
 */
export function getApertureLockState(isTitleCentered: boolean): {
  blur: string;
  brightness: number;
} {
  if (isTitleCentered) {
    return {
      blur: `${CHOREOGRAPHY.APERTURE_LOCK.blurPx}px`,
      brightness: CHOREOGRAPHY.APERTURE_LOCK.brightness,
    };
  }
  return {
    blur: '0px',
    brightness: 1,
  };
}

/**
 * Determine which act(s) should be visible at current scroll position
 * Implements the 18% overlap rule
 */
export function getVisibleActs(scrollProgress: number): {
  primaryAct: ActModuleType | null;
  secondaryAct: ActModuleType | null;
  secondaryOpacity: number;
} {
  let primaryAct: ActModuleType | null = null;
  let secondaryAct: ActModuleType | null = null;
  let secondaryOpacity = 0;
  
  for (let i = 0; i < ACTS.length; i++) {
    const act = ACTS[i];
    const [start, end] = act.scrollRange;
    
    if (scrollProgress >= start && scrollProgress <= end) {
      primaryAct = act.id as ActModuleType;
      
      // Check for overlap with previous act
      if (i > 0 && scrollProgress < start + CHOREOGRAPHY.OVERLAP.overlapPercent) {
        secondaryAct = ACTS[i - 1].id as ActModuleType;
        const overlapT = (scrollProgress - start) / CHOREOGRAPHY.OVERLAP.overlapPercent;
        secondaryOpacity = CHOREOGRAPHY.OVERLAP.transitionOpacity * (1 - overlapT);
      }
      
      break;
    }
  }
  
  return { primaryAct, secondaryAct, secondaryOpacity };
}

export default SceneRegistry;
