import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ForensicScrollPage() {
  const container = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>(".panel");

      gsap.to(sections, {
        xPercent: -100 * (sections.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: container.current,
          pin: true,
          scrub: 1,
          end: "+=3000",
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={container} style={styles.wrapper}>
      
      {/* PANEL 1 */}
      <section className="panel" style={styles.panelDark}>
        <h1 style={styles.title}>PEAK EXCITATION</h1>
        <p style={styles.metric}>300 mcd/m² · 520nm emission</p>
      </section>

      {/* PANEL 2 */}
      <section className="panel" style={styles.panelMid}>
        <h1 style={styles.title}>STOCHASTIC EROSION</h1>
        <p style={styles.metric}>Decay system active</p>
      </section>

      {/* PANEL 3 */}
      <section className="panel" style={styles.panelDark}>
        <h1 style={styles.title}>SCOTOPIC SHIFT</h1>
        <p style={styles.metric}>Rod-dominant adaptation</p>
      </section>

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    width: "300vw",
    height: "100vh",
    background: "#050505",
    color: "#fff",
    fontFamily: "monospace",
  },

  panel: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingLeft: "10vw",
  },

  panelDark: {
    background: "#050505",
  },

  panelMid: {
    background: "#0a0a0a",
  },

  title: {
    fontSize: "2.5rem",
    letterSpacing: "0.1em",
  },

  metric: {
    marginTop: "1rem",
    opacity: 0.7,
  },
};