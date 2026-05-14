import React from 'react';

export const OcclusionScene: React.FC = () => {
  return (
    <div className="scene-container">
      <div className="gutter left-gutter">
        <div>
          <span className="metadata-tag">ACT III // OCCLUSION</span>
          <span className="metadata-tag">INTERNAL SHADOW</span>
        </div>
      </div>
      
      <div className="catwalk">
        <div className="visual-container">
           <div className="occlusion-gap">
             <div className="occlusion-wall-top" />
             <div className="occlusion-light" />
             <div className="occlusion-wall-bottom" />
           </div>
        </div>
        <div className="text-container" style={{ marginTop: '45vh' }}>
          <h1 className="display-headline">Occlusion</h1>
          <p className="narrative-text">The Caged Light Law. Light physically trapped within structural boundaries.</p>
        </div>
      </div>
      
      <div className="gutter right-gutter">
        <div>
          <span className="metadata-tag">t ∈ [0.50, 0.75]</span>
          <span className="metadata-tag">EXTREME MACRO</span>
        </div>
      </div>
    </div>
  );
};
