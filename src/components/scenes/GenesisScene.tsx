import React from 'react';

export const GenesisScene: React.FC = () => {
  return (
    <div className="scene-container">
      <div className="gutter left-gutter">
        <div>
          <span className="metadata-tag">ACT I // GENESIS</span>
          <span className="metadata-tag">SrAl2O4 LATTICE</span>
        </div>
      </div>
      
      <div className="catwalk">
        <div className="visual-container">
           <div className="genesis-particles" />
        </div>
        <div className="text-container">
          <h1 className="display-headline">Genesis<br/>State</h1>
          <p className="narrative-text">Safety is an atomic property. Initializing particulate field at 0.1mm scale.</p>
        </div>
      </div>
      
      <div className="gutter right-gutter">
        <div>
          <span className="metadata-tag">t ∈ [0.00, 0.25]</span>
          <span className="metadata-tag">MICRO SCALE</span>
        </div>
      </div>
    </div>
  );
};
