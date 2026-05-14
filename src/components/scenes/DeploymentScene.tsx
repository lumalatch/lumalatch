import React from 'react';

export const DeploymentScene: React.FC = () => {
  const handlePreOrder = () => {
    window.location.href = '/checkout';
  };

  return (
    <div className="scene-container">
      <div className="gutter left-gutter">
        <div>
          <span className="metadata-tag">ACT IV // DEPLOYMENT</span>
          <span className="metadata-tag">SEATBELT SYSTEM</span>
        </div>
      </div>
      
      <div className="catwalk">
        <div className="visual-container" style={{ marginTop: '-10vh' }}>
           <div className="deployment-chassis">
              <div className="deployment-tongue">
                <div className="deployment-slot" />
              </div>
              <div className="deployment-gap" />
              <div className="deployment-buckle">
                <div className="deployment-button" />
                <div className="deployment-branding">LUMA // LATCH</div>
              </div>
           </div>
        </div>
        <div className="text-container" style={{ marginTop: '45vh' }}>
          <h1 className="display-headline">Luma Latch</h1>
          <p className="narrative-text mb-12">Automotive Grade Security. Commercial deployment verified.</p>
          <button onClick={handlePreOrder} className="cta-button">[ INITIALIZE PRE-ORDER ]</button>
        </div>
      </div>
      
      <div className="gutter right-gutter">
        <div>
          <span className="metadata-tag">t ∈ [0.75, 1.00]</span>
          <span className="metadata-tag">AUTHORITY</span>
        </div>
      </div>
    </div>
  );
};
