"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LenisCtx = createContext(null);
export const useLenis = () => useContext(LenisCtx);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function SmoothScroll({ children }) {
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    if (prefersReducedMotion()) return; // native scrolling for the calm version
    const l = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
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
