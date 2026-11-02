"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Mask reveals for any element with data-reveal="wipe" | "iris" | "curtain".
const FROM = {
  wipe: "inset(0 100% 0 0)",
  iris: "circle(0% at 50% 50%)",
  curtain: "inset(0 50% 0 50%)",
};
const TO = { wipe: "inset(0 0% 0 0)", iris: "circle(75% at 50% 50%)", curtain: "inset(0 0% 0 0%)" };

export default function Reveals() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray("[data-reveal]").forEach((el) => {
        const k = el.dataset.reveal;
        gsap.fromTo(el, { clipPath: FROM[k] }, { clipPath: TO[k], duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 82%" } });
      });
    });
    // Pinned sections change page height after fonts/media settle.
    const t = setTimeout(() => ScrollTrigger.refresh(), 800);
    return () => {
      clearTimeout(t);
      mm.revert();
    };
  }, []);
  return null;
}
