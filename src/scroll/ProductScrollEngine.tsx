import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ProductScrollEngine() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>(".scene");

      sections.forEach((section, i) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 80, filter: "blur(10px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              end: "top 30%",
              scrub: true,
            },
          }
        );
      });

      // global pin spine
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "+=4000",
        pin: true,
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} style={styles.wrapper}>

      {/* HERO */}
      <section className="scene" style={styles.hero}>
        <div style={styles.kicker}>LUMA LATCH SYSTEM</div>
        <h1 style={styles.h1}>
          Visibility is not added.<br />
          It is engineered.
        </h1>
        <p style={styles.sub}>
          Photoluminescent restraint architecture for low-light collision environments.
        </p>
      </section>

      {/* MATERIAL SECTION */}
      <section className="scene" style={styles.section}>
        <h2 style={styles.h2}>Material Intelligence</h2>
        <p style={styles.p}>
          Strontium-based emission lattice embedded within automotive-grade weave architecture.
        </p>
      </section>

      {/* PHYSICS SECTION */}
      <section className="scene" style={styles.sectionDark}>
        <h2 style={styles.h2}>Emission Behavior</h2>
        <p style={styles.p}>
          520nm persistent luminescence with hyperbolic decay response curve tuned for scotopic adaptation.
        </p>
      </section>

      {/* SYSTEM SECTION */}
      <section className="scene" style={styles.section}>
        <h2 style={styles.h2}>System Integration</h2>
        <p style={styles.p}>
          OEM-compatible architecture. Drop-in replacement at restraint anchor geometry level.
        </p>
      </section>

      {/* FINAL CTA */}
      <section className="scene" style={styles.cta}>
        <h1 style={styles.h1}>Designed for deployment, not demonstration.</h1>
      </section>

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: "#050505",
    color: "#fff",
    fontFamily: "monospace",
    overflow: "hidden",
  },

  hero: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "10vw",
  },

  section: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "10vw",
    background: "#0a0a0a",
  },

  sectionDark: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "10vw",
    background: "#050505",
  },

  cta: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "10vw",
    background: "#000",
  },

  kicker: {
    letterSpacing: "0.3em",
    opacity: 0.6,
    marginBottom: "2rem",
  },

  h1: {
    fontSize: "4rem",
    lineHeight: 1.1,
  },

  h2: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
  },

  sub: {
    marginTop: "2rem",
    opacity: 0.7,
    maxWidth: "600px",
  },

  p: {
    opacity: 0.75,
    maxWidth: "700px",
    lineHeight: 1.6,
  },
};