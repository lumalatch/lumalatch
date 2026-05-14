import React, { useMemo } from 'react';
import { FORENSIC_CONTENT } from '../content/Forensic_Cotent';

export const SynthesisModule: React.FC<{ progress: number }> = ({ progress }) => {
  const data = FORENSIC_CONTENT.SYMPHONY.ACT_II;

  // Typewriter effect logic
  const bodyText = data.body;
  const revealedChars = Math.floor(progress * bodyText.length * 1.5);
  const typewriterText = bodyText.substring(0, revealedChars);

  // Fiber Assembly Data
  const threads = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: (i / 24) * 200 - 100,
      delay: i * 0.02,
      offset: (i % 2 === 0 ? 1 : -1) * 10,
    }));
  }, []);

  return (
    <section className="module synthesis bg-void relative overflow-hidden">
      <div className="catwalk perspective-container">
        
        {/* LEFT: VISUAL (z-index 1) */}
        <div className="visual-column visual-layer">
          <svg
            className="synthesis-assembly w-full h-full"
            viewBox="-100 -100 200 200"
            style={{
              transform: `perspective(1000px) rotateX(20deg) scale(${0.8 + progress * 0.4})`,
            }}
          >
            <defs>
              <linearGradient id="thread-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#B4FFC8" stopOpacity="0" />
                <stop offset="50%" stopColor="#B4FFC8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#B4FFC8" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Fiber Threads */}
            {threads.map((t) => {
              // Threads enter viewport (dashoffset)
              // Twist (rotation)
              // Interlock (convergence)
              const twist = progress * 720;
              const converge = progress * 40;
              const pathY = 150 * (1 - progress);

              return (
                <g key={t.id} transform={`translate(${t.x}, 0) rotate(${twist + t.id * 10})`}>
                  <path
                    d={`M 0,${-100 + pathY} L 0,${100 - pathY}`}
                    stroke="url(#thread-grad)"
                    strokeWidth="0.5"
                    style={{
                      strokeDasharray: '200',
                      strokeDashoffset: (1 - progress) * 200,
                    }}
                  />
                  {/* Herringbone pattern V-shards forming */}
                  {progress > 0.5 && (
                    <path
                      d="M -2,-2 L 0,0 L 2,-2"
                      fill="none"
                      stroke="#B4FFC8"
                      strokeWidth="0.5"
                      opacity={(progress - 0.5) * 2}
                      transform={`translate(0, ${Math.sin(progress * 10 + t.id) * 20})`}
                    />
                  )}
                </g>
              );
            })}

            {/* Central Weave Core */}
            <rect
              x="-40"
              y="-60"
              width="80"
              height="120"
              fill="none"
              stroke="#B4FFC8"
              strokeWidth="0.2"
              opacity={progress * 0.3}
              style={{
                strokeDasharray: '400',
                strokeDashoffset: (1 - progress) * 400,
              }}
            />
          </svg>
        </div>

        {/* RIGHT: TEXT (z-index 10) */}
        <div className="hud-column text-layer">
          <div className="hud-subtitle font-mono">
            ACT II // STRUCTURE: 8-SHAFT HERRINGBONE
          </div>
          
          <h1 className="hud-title">
            {data.title}
          </h1>
          
          <div className="hud-body h-[100px] font-mono text-sm leading-relaxed border-l border-white/10 pl-4">
            {typewriterText}
            <span className="animate-pulse inline-block w-2 h-4 bg-[#B4FFC8] ml-1 align-middle" />
          </div>
          
          <div className="hud-meta">
            <div className="grid grid-cols-2 gap-2 uppercase tracking-tighter">
              <div>MATERIAL: NYLON 6-6</div>
              <div>ALBEDO: 0.05</div>
              <div>ROUGHNESS: 0.8</div>
              <div>TYPE: TWILL WEAVE</div>
            </div>
            <div className="mt-4 text-[#B4FFC8] font-bold">
              {data.close}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SynthesisModule;

