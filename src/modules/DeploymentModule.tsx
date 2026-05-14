import React, { useMemo } from 'react';
import { FORENSIC_CONTENT } from '../content/Forensic_Cotent';

export const DeploymentModule: React.FC<{ progress: number }> = ({ progress }) => {
  const data = FORENSIC_CONTENT.SYMPHONY.ACT_IV;
  
  const handlePreOrder = () => {
    window.location.href = '/checkout';
  };

  const hudItems = useMemo(() => [
    "FMVSS 209",
    "ECE R16",
    "PASSIVE",
    "NO POWER",
    "NO BATTERY"
  ], []);

  return (
    <section className="module deployment bg-void relative overflow-hidden">
      <div className="catwalk perspective-container">
        
        {/* LEFT: VISUAL (z-index 1) - Full Harness Presentation */}
        <div className="visual-column visual-layer">
           <div className="deployment-chassis relative" style={{ 
             transform: `perspective(1000px) rotateX(10deg) scale(${0.9 + progress * 0.1})` 
           }}>
              {/* Harness Straps */}
              <div className="absolute top-[-100px] left-[-20px] w-[20px] h-[300px] bg-[#111] border-x border-white/5 skew-x-[-10deg]" />
              <div className="absolute top-[-100px] right-[-20px] w-[20px] h-[300px] bg-[#111] border-x border-white/5 skew-x-[10deg]" />

              <div className="deployment-tongue z-10">
                <div className="deployment-slot" />
              </div>
              <div className="deployment-gap z-20" />
              <div className="deployment-buckle z-10">
                <div className="deployment-button" />
                <div className="deployment-branding">LUMA // LATCH</div>
              </div>

              {/* Forensic Shine */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, transparent 40%, rgba(180,255,200,0.1) 50%, transparent 60%)',
                  backgroundSize: '200% 200%',
                  backgroundPosition: `${progress * 100}% ${progress * 100}%`
                }}
              />
           </div>
        </div>

        {/* RIGHT: TEXT (z-index 10) */}
        <div className="hud-column text-layer">
          <div className="hud-subtitle font-mono">
            ACT IV // MISSION READY
          </div>
          
          <h1 className="hud-title">
            {data.title}
          </h1>
          
          <p className="hud-body mb-8 font-mono text-sm opacity-60">
            {data.body}
          </p>
          
          <div className="hud-meta mb-12 font-mono text-[11px] space-y-2">
            {hudItems.map((item, i) => {
              const start = i * 0.1;
              const op = Math.max(0, Math.min(1, (progress - start) / 0.1));
              return (
                <div 
                  key={i} 
                  className="flex items-center gap-3 transition-opacity duration-500"
                  style={{ opacity: op }}
                >
                  <span className="w-1.5 h-1.5 bg-[#B4FFC8]" />
                  {item}
                </div>
              );
            })}
            <div className="mt-6 pt-4 border-t border-white/5 text-[#B4FFC8] font-bold">
              {data.close}
            </div>
          </div>

          <button 
            onClick={handlePreOrder} 
            className="cta-button pointer-events-auto group relative overflow-hidden"
            style={{ border: '1px solid #B4FFC8', color: '#B4FFC8' }}
          >
            <span className="relative z-10">[ REQUEST OEM INTEGRATION ]</span>
            <div className="absolute inset-0 bg-[#B4FFC8] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <style>{`.cta-button:hover span { color: #050505; }`}</style>
          </button>
        </div>

      </div>
    </section>
  );
};

export default DeploymentModule;

