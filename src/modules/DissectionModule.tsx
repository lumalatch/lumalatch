import React from 'react';
import { FORENSIC_CONTENT } from '../content/Forensic_Cotent';

export const DissectionModule: React.FC<{ progress: number }> = ({ progress }) => {
  const content = FORENSIC_CONTENT.DISSECTION;
  const layers = [content.LAYER_01, content.LAYER_02, content.LAYER_03, content.LAYER_04];

  // Stability: Side-by-side layout (Static HUD approach)
  const textFade = 0.2 + progress * 0.8;
  const textLift = 15 * (1 - progress);

  return (
    <section className="module dissection bg-void relative">
      <div className="catwalk perspective-container">
        
        {/* LEFT: VISUAL (Exploded Layer Stack) */}
        <div className="visual-column visual-layer flex flex-col gap-4" style={{ opacity: 0.6 + progress * 0.4 }}>
           {layers.map((_, i) => (
             <div 
               key={`visual-${i}`}
               className="w-full h-8 border border-[#B4FFC8]/20 bg-[#B4FFC8]/5 relative overflow-hidden"
               style={{
                 transform: `translateX(${(i - 1.5) * progress * 40}px) skewX(-15deg)`,
                 opacity: 0.5 + progress * 0.5
               }}
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B4FFC8]/10 to-transparent animate-pulse" />
             </div>
           ))}
        </div>

        {/* RIGHT: TEXT (HUD) */}
        <div className="hud-column text-layer overflow-y-auto max-h-[80vh] pr-4" style={{ 
          opacity: textFade,
          transform: `translateY(${textLift}px)`
        }}>
          <div className="hud-subtitle">
            PHASE 4 // STRUCTURAL DISSECTION
          </div>
          
          <h1 className="hud-title mb-8">DISSECTION</h1>

          <div className="flex flex-col gap-8">
            {layers.map((layer, index) => (
              <div key={index} className="border-l border-[#B4FFC8] pl-6 opacity-80">
                <h3 className="text-[#B4FFC8] text-sm tracking-widest uppercase mb-2">{layer.title}</h3>
                <p className="text-xs leading-relaxed opacity-70 mb-2" dangerouslySetInnerHTML={{ __html: layer.body }} />
                <div className="font-mono text-[9px] opacity-40">{layer.spec}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default DissectionModule;