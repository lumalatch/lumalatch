import React, { useState, useEffect } from 'react';
import { FORENSIC_CONTENT } from '../content/Forensic_Cotent';

export const OcclusionModule: React.FC<{ progress: number }> = ({ progress }) => {
  const data = FORENSIC_CONTENT.SYMPHONY.ACT_III;
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Moving shadow/light beam position
  const lightX = progress * 100;

  return (
    <section className="module occlusion bg-void relative overflow-hidden">
      <div className="catwalk perspective-container">
        
        {/* LEFT: VISUAL (z-index 1) */}
        <div className="visual-column visual-layer">
           <div className="v-gap-inspection relative w-full h-[300px] flex items-center justify-center">
             {/* Trapped Light beneath weave */}
             <div className="absolute inset-0 bg-[#B4FFC8] opacity-[0.03]" />
             
             {/* V-Gap Aperture */}
             <svg className="w-[200px] h-[200px]" viewBox="-50 -50 100 100">
               <defs>
                 <radialGradient id="aperture-glow">
                   <stop offset="0%" stopColor="#B4FFC8" stopOpacity={0.8 * progress} />
                   <stop offset="100%" stopColor="#B4FFC8" stopOpacity="0" />
                 </radialGradient>
               </defs>
               
               {/* Aperture light bleed */}
               <path 
                 d="M -30,-40 L 0,0 L 30,-40" 
                 fill="none" 
                 stroke="url(#aperture-glow)" 
                 strokeWidth="4" 
                 strokeLinecap="round"
                 style={{ 
                   filter: 'blur(2px)',
                   transform: `scale(${1 + progress * 0.2})` 
                 }}
               />

               {/* Shadow System - Blocking light except at V */}
               <path 
                  d="M -100,-100 L 100,-100 L 100,100 L -100,100 Z M -30,-40 L 0,0 L 30,-40 L -30,-40 Z" 
                  fill="#050505" 
                  fillRule="evenodd"
                  opacity={0.9}
               />
             </svg>

             {/* Dynamic Light Beam */}
             <div 
               className="absolute w-[2px] h-full bg-[#B4FFC8] opacity-20"
               style={{ 
                 left: `${lightX}%`,
                 filter: 'blur(15px)',
                 boxShadow: '0 0 50px #B4FFC8'
               }}
             />
           </div>
        </div>

        {/* RIGHT: TEXT (z-index 10) */}
        <div className="hud-column text-layer">
          <div className="hud-subtitle font-mono">
            ACT III // LAW: CAGED
          </div>
          
          <h1 className="hud-title">
            {data.title}
          </h1>
          
          {/* Narrative Reveal via Light Pass */}
          <div className="relative">
            <p 
              className="hud-body font-mono text-sm leading-relaxed" 
              style={{
                maskImage: `linear-gradient(to right, transparent ${lightX - 20}%, white ${lightX}%, transparent ${lightX + 20}%)`,
                WebkitMaskImage: `linear-gradient(to right, transparent ${lightX - 20}%, white ${lightX}%, transparent ${lightX + 20}%)`,
                transition: 'none'
              }}
              dangerouslySetInnerHTML={{ __html: data.body }}
            />
            {/* Background trace of text for "shadow" feel */}
            <p 
              className="hud-body font-mono text-sm leading-relaxed absolute top-0 left-0 opacity-[0.05] pointer-events-none"
              dangerouslySetInnerHTML={{ __html: data.body }}
            />
          </div>
          
          <div className="hud-meta">
            <div className="grid grid-cols-2 gap-2 uppercase">
              <div>EMISSION: 520.4nm</div>
              <div>OUTPUT: 300mcd/m²</div>
              <div>LAW: CAGED</div>
              <div>SHADOW: #050505</div>
            </div>
            <div className="mt-4 text-[#B4FFC8] border-l border-[#B4FFC8] pl-3 italic">
              {data.close}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default OcclusionModule;

