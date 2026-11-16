"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { MOODS } from "@/lib/catalog";
import { useApp } from "@/lib/store";

// Section colour without hard cuts. Every [data-chapter] paints its own colour, fading in from the
// previous chapter's colour across its top padding — so neighbours blend, but a section's text always
// sits on its own ground (a single shared, scroll-blended backdrop left dark sections half-light while
// both were on screen). Sections marked [data-tint] stay transparent over this fixed layer, which
// hovering a mood retints.
const FIRST_FROM = "#7557B0"; // the hero above the first chapter ends in amethyst (.hx2-ground)

export default function Backdrop() {
  const el = useRef(null);
  const { mood } = useApp();

  useEffect(() => {
    const chapters = [...document.querySelectorAll("[data-chapter]")];
    const paint = () =>
      chapters.forEach((c, i) => {
        if (c.hasAttribute("data-tint")) return;
        const from = i ? chapters[i - 1].dataset.chapter : FIRST_FROM;
        const to = c.dataset.chapter;
        const fade = Math.min(140, (parseFloat(getComputedStyle(c).paddingTop) || 0) * 0.85);
        c.style.background = from === to || fade < 8 ? to : `linear-gradient(${from} 0px, ${to} ${fade}px)`;
      });
    paint();
    window.addEventListener("resize", paint); // padding is responsive
    return () => {
      window.removeEventListener("resize", paint);
      chapters.forEach((c) => (c.style.background = ""));
    };
  }, []);

  useEffect(() => {
    const tint = MOODS.find((m) => m.id === mood)?.tint;
    gsap.to(el.current, { backgroundColor: tint ?? "#FFFFFF", duration: 1.1, ease: "power2.out", overwrite: "auto" });
  }, [mood]);

  return <div ref={el} className="pointer-events-none fixed inset-0 -z-10" style={{ backgroundColor: "#FFFFFF" }} aria-hidden />;
}
