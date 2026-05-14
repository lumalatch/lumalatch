import React from 'react';
import GenesisModule from '../modules/GenesisModule';
import { SynthesisModule } from '../modules/SynthesisModule';
import { OcclusionModule } from '../modules/OcclusionModule';
// This module now acts as the bridge for Exploded4Layer.tsx
import { DissectionModule } from '../modules/DissectionModule';
import { DeploymentModule } from '../modules/DeploymentModule';

export interface SceneDefinition {
  id: string;
  range: [number, number];
  Component: React.FC<{ progress: number }>;
}

export const MODULE_STACK: SceneDefinition[] = [
  // Phase 1: Genesis (0.15 overlap with Synthesis)
  { id: 'genesis', range: [0.0, 0.30], Component: GenesisModule },

  // Phase 2: Synthesis (0.15 overlap with Occlusion)
  { id: 'synthesis', range: [0.15, 0.50], Component: SynthesisModule },

  // Phase 3: Occlusion (0.15 overlap with Dissection)
  { id: 'occlusion', range: [0.35, 0.70], Component: OcclusionModule },

  // Phase 4: Dissection (0.15 overlap with Deployment)
  { id: 'dissection', range: [0.55, 0.90], Component: DissectionModule },

  // Phase 5: Deployment (Ends at 1.0)
  { id: 'deployment', range: [0.75, 1.0], Component: DeploymentModule }
];