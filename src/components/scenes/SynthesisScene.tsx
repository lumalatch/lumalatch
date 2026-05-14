import React from 'react';

export const SynthesisScene: React.FC = () => {
  return (
    <div className="scene-container">
      <div className="gutter left-gutter">
        <div>
          <span className="metadata-tag">ACT II // SYNTHESIS</span>
          <span className="metadata-tag">8-SHAFT HERRINGBONE</span>
        </div>
      </div>
      
      <div className="catwalk">
        <div className="visual-container">
           <div className="synthesis-weave" />
        </div>
        <div className="text-container">
          <h1 className="display-headline">Synthesis</h1>
          <p className="narrative-text">Material Intelligence Engineered. Nylon 6-6 threads assembling.</p>
        </div>
      </div>
      
      <div className="gutter right-gutter">
        <div>
          <span className="metadata-tag">t ∈ [0.25, 0.50]</span>
          <span className="metadata-tag">MACRO WEAVE</span>
        </div>
      </div>
    </div>
  );
};
