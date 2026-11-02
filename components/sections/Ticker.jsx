"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Spark } from "../ui/primitives";

const WORDS = ["Silk charmeuse", "Organza", "Grain de poudre", "Chanderi & tulle", "Crepe de chine", "Plissé georgette", "Cashmere-silk", "Freshwater pearl"];

// Continuous fabric ticker between chapters. Never stops; scrolling down pushes it forward,
// scrolling up reverses it, and fast scrolling briefly speeds it up.
export default function Ticker() {
  const root = useRef(null);
  const row = useRef(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const loop = gsap.to(row.current, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
      let dir = 1;
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          dir = self.direction;
          const boost = Math.min(4, Math.abs(self.getVelocity()) / 700);
          gsap.to(loop, { timeScale: dir * (1 + boost), duration: 0.25, overwrite: true });
          gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25, ease: "power2.out" });
        },
      });
      return () => {
        st.kill();
        loop.kill();
      };
    });
    return () => mm.revert();
  }, []);

  const items = [...WORDS, ...WORDS];
  return (
    <div ref={root} className="relative overflow-hidden border-y border-plum/10 bg-pearl py-5 sm:py-7" aria-label="Fabrics in this collection">
      <div ref={row} className="flex w-max items-center">
        {items.map((w, i) => (
          <span key={i} className="flex shrink-0 items-center" aria-hidden={i >= WORDS.length}>
            <span className={`display px-6 text-[34px] leading-none sm:px-10 sm:text-[56px] ${i % 2 ? "display-i text-amethyst" : "text-plum"}`}>{w}</span>
            <Spark className="h-5 w-5 shrink-0 sm:h-7 sm:w-7" animate={false} />
          </span>
        ))}
      </div>
    </div>
  );
}
