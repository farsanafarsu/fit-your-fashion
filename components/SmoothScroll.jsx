"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// Phone address bars resize the viewport while scrolling; don't re-measure pins for that.
ScrollTrigger.config({ ignoreMobileResize: true });

const LenisCtx = createContext(null);
export const useLenis = () => useContext(LenisCtx);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function SmoothScroll({ children }) {
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    if (prefersReducedMotion()) return; // native scrolling for the calm version
    // lerp 0.1: a longer, silkier glide than 0.13 while still keeping up with fast wheels
    const l = new Lenis({ lerp: 0.1, wheelMultiplier: 1.1, touchMultiplier: 1.6 });
    l.on("scroll", ScrollTrigger.update);
    const tick = (t) => l.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(l);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
    };
  }, []);

  return <LenisCtx.Provider value={lenis}>{children}</LenisCtx.Provider>;
}
