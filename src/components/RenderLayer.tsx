import React, { useEffect, useState } from 'react';
import { ScrollCore } from '../core/ScrollCore';
import { MODULE_STACK } from '../core/SceneRegistry';
import GenesisModule from '../modules/GenesisModule';
import { FORENSIC_CONTENT } from '../content/Forensic_Cotent';

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

export const RenderLayer: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [trackHeight, setTrackHeight] = useState(0);

  useEffect(() => {
    // DO NOT REPLACE ScrollCore, just use it
    const cleanupScroll = ScrollCore.init();

    let velocity = 0;
    let lastScrollY = window.scrollY;
    let rAF: number;

    const updateTrackHeight = () => {
      const track = document.getElementById('cinematic-scroll-track');
      if (track) {
        setTrackHeight(track.offsetHeight);
      }
    };
    updateTrackHeight();
    window.addEventListener('resize', updateTrackHeight);

    const tick = () => {
      const currentScrollY = window.scrollY;
      const track = document.getElementById('cinematic-scroll-track');
      const th = track ? track.offsetHeight : (window.innerHeight * 5);

      const t = th > 0 ? currentScrollY / th : 0;
      setProgress(t);

      const delta = currentScrollY - lastScrollY;

      velocity += (delta - velocity) * 0.1;
      lastScrollY = currentScrollY;

      // Interaction variables
      document.documentElement.style.setProperty('--scroll-vel-skew', `${Math.max(-5, Math.min(5, velocity * 0.05))}deg`);
      document.documentElement.style.setProperty('--scroll-vel-blur', `${Math.abs(velocity * 0.02)}px`);

      rAF = requestAnimationFrame(tick);
    };
    rAF = requestAnimationFrame(tick);

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cleanupScroll();
      cancelAnimationFrame(rAF);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateTrackHeight);
    };
  }, []);

  const t = progress;
  const isPinned = t < 1.0;
  const safeTrackHeight = trackHeight || (typeof window !== 'undefined' ? window.innerHeight * 5 : 5000);

  return (
    <>
      <div
        id="cinematic-root"
        className="w-full h-[100vh] pointer-events-none overflow-hidden bg-[#050505] z-10"
        style={{
          position: isPinned ? 'fixed' : 'absolute',
          top: isPinned ? 0 : safeTrackHeight,
          left: 0
        }}
      >
        {/* METADATA READOUT */}
        <div id="metadata-readout" className="absolute top-8 left-8 font-mono text-[10px] text-[#B4FFC8] opacity-50 z-50">
          LUMA_LATCH // STATE: {t.toFixed(4)}
        </div>

        {/* BACKGROUND FIELD */}
        <div className="absolute-center cam-bg">
          <div className="bg-grid-field" />
        </div>

        {/* SCENE REGISTRY MOUNTING POINT (z-index: 100 to stay above obstructions) */}
        <div className="scenes-container absolute inset-0 w-full h-full z-[100] pointer-events-auto">
          {MODULE_STACK.map(scene => {
            const SceneComponent = scene.Component;
            const [start, end] = scene.range;
            const localProgress = clamp((t - start) / (end - start), 0, 1);

            // Ensure smooth transition between scenes
            // Visibility is active if within range; choreography handles the actual fading
            const isVisible = t >= (start - 0.05) && (scene.id === 'deployment' ? true : t <= (end + 0.05));

            return (
              <div
                key={scene.id}
                className={`scene-wrapper scene-wrapper-${scene.id}`}
                style={{
                  opacity: isVisible ? 1 : 0,
                  visibility: isVisible ? 'visible' : 'hidden',
                  pointerEvents: isVisible ? 'auto' : 'none',
                  position: 'absolute',
                  inset: 0
                }}
              >
                <SceneComponent progress={localProgress} />
              </div>
            );

          })}
        </div>

        {/* FOREGROUND DEPTH OBSTRUCTIONS (z-index: 40) */}
        <div className="absolute-center cam-fg z-[40]">
          <div className="obstruction-bar top-obstruct" />
          <div className="obstruction-bar bottom-obstruct" />
        </div>

        {/* GLOBAL OPTICAL EFFECTS (z-index: 50+) */}
        <div className="absolute-center fx-fog z-[50]" />
        <div className="absolute-center fx-vignette z-[55]" />
        <div className="absolute-center fx-noise z-[60]" />
      </div>

      {/* TRANSITION PROTOCOL (t = 1.0) */}
      <div
        id="standard-flow"
        className="w-full bg-[#0A0A0A] text-white font-inter z-20"
        style={{
          position: 'absolute',
          top: safeTrackHeight + (typeof window !== 'undefined' ? window.innerHeight : 1000),
          left: 0,
          minHeight: '100vh',
          padding: '10vh 15vw'
        }}
      >
        <nav className="mb-24 flex gap-8 text-sm uppercase tracking-widest opacity-60 flex-wrap">
          <span>TECHNICAL MANIFEST</span>
          <span>EFFICACY</span>
          <span>FAQ</span>
          <span>PARTNERSHIPS</span>
          <span>CONTACT</span>
        </nav>

        <div className="mb-24">
          <h2 className="text-3xl mb-12 font-light">EFFICACY REPORTS</h2>
          {Object.values(FORENSIC_CONTENT.EFFICACY_REPORTS).map(report => (
            <div key={report.id} className="mb-12 border-l border-[#B4FFC8] pl-6 opacity-80">
              <h3 className="text-xl mb-4 text-[#B4FFC8]">{report.title}</h3>
              <p className="mb-2"><strong>Hypothesis:</strong> {report.hypothesis}</p>
              <p className="mb-2"><strong>Method:</strong> {report.method}</p>
              <p className="mb-2"><strong>Result:</strong> {report.result}</p>
              <p className="mb-4 text-sm opacity-70">{report.conclusion}</p>
              <p className="font-mono text-xs text-[#B4FFC8]">{report.close}</p>
            </div>
          ))}
        </div>

        <div className="mb-24">
          <h2 className="text-3xl mb-12 font-light">STRATEGIC RECOMMENDATIONS</h2>
          {Object.values(FORENSIC_CONTENT.STRATEGIC_RECOMMENDATIONS).map(rec => (
            <div key={rec.id} className="mb-12 opacity-80">
              <h3 className="text-xl mb-4 text-[#B4FFC8]">{rec.title}</h3>
              <p className="mb-4 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: rec.body }} />
              <p className="font-mono text-xs opacity-60 mb-2">{rec.dataToken}</p>
              <p className="font-mono text-xs text-[#B4FFC8]">{rec.close}</p>
            </div>
          ))}
        </div>

        <div className="mb-24">
          <h2 className="text-3xl mb-12 font-light">CLINICAL FAQ</h2>
          {Object.values(FORENSIC_CONTENT.CLINICAL_FAQ).map(faq => (
            <div key={faq.id} className="mb-8 opacity-80">
              <h3 className="text-lg mb-2 text-[#B4FFC8]">{faq.question}</h3>
              <ul className="list-disc pl-5 mb-4 text-sm">
                {faq.answer.map((ans, i) => (
                  <li key={i} className="mb-1">{ans}</li>
                ))}
              </ul>
              <p className="text-sm opacity-70 mb-2">{faq.synthesis}</p>
              <p className="font-mono text-xs text-[#B4FFC8]">{faq.close}</p>
            </div>
          ))}
        </div>

        <footer className="mt-32 pt-8 pb-16 border-t border-white/10 opacity-50 text-xs text-center font-mono">
          {FORENSIC_CONTENT.TRANSITION_PROTOCOL.close}
        </footer>
      </div>
    </>
  );
};
