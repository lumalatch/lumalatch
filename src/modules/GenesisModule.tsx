import { useMemo, useEffect, useState } from 'react';
import { FORENSIC_CONTENT } from '../content/Forensic_Cotent';

type Props = {
  progress: number;
};

export default function GenesisModule({ progress }: Props) {
  const data = FORENSIC_CONTENT.SYMPHONY.ACT_I;
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

  const shards = useMemo(() => {
    const count = 140; // 120-160 range
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 40 + Math.random() * 60;
      return {
        id: i,
        angle,
        radius,
        speed: 0.2 + Math.random() * 0.8,
        scale: 0.3 + Math.random() * 0.7,
        rot: Math.random() * 360,
        offset: Math.random() * 20,
      };
    });
  }, []);

  // Split narrative into fragments
  const fragments = useMemo(() => [
    "Strontium aluminate ($SrAl_{2}O_{4}$) crystallizes in zero-G vacuum.",
    "Photonic emission initiates at 520.4nm.",
    "Light is not applied. It is grown."
  ], []);

  const converge = 1 - progress;
  const orbitSpeed = 1 + progress * 2;

  return (
    <section className="module genesis bg-void relative overflow-hidden">
      <div className="catwalk perspective-container">

        {/* LEFT: VISUAL (z-index 1) */}
        <div className="visual-column visual-layer">
          <svg
            className="genesis-svg-enhanced w-full h-full"
            viewBox="-150 -150 300 300"
            style={{
              transform: `
                perspective(1000px) 
                rotateX(${(mousePos.y - 0.5) * 10}deg) 
                rotateY(${(mousePos.x - 0.5) * 10}deg)
                scale(${1 + progress * 0.2})
              `,
            }}
          >
            <defs>
              <filter id="crystal-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <radialGradient id="emerald-core">
                <stop offset="0%" stopColor="#B4FFC8" stopOpacity={0.8 * progress} />
                <stop offset="100%" stopColor="#B4FFC8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Core Emitter */}
            <circle
              cx="0"
              cy="0"
              r={4 + progress * 12}
              fill="url(#emerald-core)"
              className="crystal-pulse"
            />

            {/* Orbiting Shards */}
            {shards.map((s) => {
              const currentAngle = s.angle + progress * orbitSpeed * s.speed;
              // Parallax response to mouse
              const mx = (mousePos.x - 0.5) * s.offset;
              const my = (mousePos.y - 0.5) * s.offset;
              
              const tx = Math.cos(currentAngle) * s.radius * converge + mx;
              const ty = Math.sin(currentAngle) * s.radius * converge + my;

              return (
                <g
                  key={s.id}
                  transform={`translate(${tx}, ${ty}) rotate(${s.rot + progress * 360 * s.speed}) scale(${s.scale})`}
                  style={{ opacity: 0.1 + progress * 0.7 }}
                >
                  <polygon
                    points="0,-3 1.5,1.5 -1.5,1.5"
                    fill="#B4FFC8"
                    filter="url(#crystal-glow)"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* RIGHT: TEXT (z-index 10) */}
        <div className="hud-column text-layer">
          <div className="hud-subtitle font-mono">
            ACT I // EXCITATION: 365nm
          </div>

          <h1 className="hud-title">
            {data.title}
          </h1>

          <div className="hud-body h-[120px] flex flex-col justify-center">
            {fragments.map((f, i) => {
              const start = i * 0.3;
              const end = start + 0.3;
              const fOpacity = Math.max(0, Math.min(1, (progress - start) / 0.1));
              const fShift = (1 - fOpacity) * 10;

              return (
                <div 
                  key={i} 
                  className="mb-2 transition-all duration-500"
                  style={{ 
                    opacity: fOpacity,
                    transform: `translateX(${fShift}px)`
                  }}
                >
                  {f}
                </div>
              );
            })}
          </div>

          <div className="hud-meta">
            <div className="grid grid-cols-2 gap-2">
              <div>EMISSION: 520.4nm</div>
              <div>LUMINANCE: 300mcd/m²</div>
              <div>SCALE: 0.1mm</div>
              <div>STATE: CRYSTALLINE</div>
            </div>
            <div className="mt-4 text-[#B4FFC8] border-l border-[#B4FFC8] pl-3 italic">
              {data.close}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}