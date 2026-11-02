"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { PRODUCTS } from "@/lib/catalog";
import ProductCard from "../ProductCard";
import { ChapterLabel } from "../ui/primitives";

// Chapter 01: pinned horizontal gallery on desktop; native swipe with snap on touch/mobile.
export default function Collection() {
  const root = useRef(null);
  const track = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const dist = () => track.current.scrollWidth - window.innerWidth;
        const tween = gsap.to(track.current, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
        });
        // Each card drifts at its own depth inside the moving track.
        gsap.utils.toArray(".c-card").forEach((el, i) => {
          gsap.fromTo(el, { yPercent: i % 2 ? 8 : -6 }, { yPercent: i % 2 ? -8 : 6, ease: "none", scrollTrigger: { trigger: el, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        });
        gsap.to(".c-progress", { scaleX: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + dist(), scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="collection" ref={root} className="relative overflow-hidden bg-pearl py-24 md:flex md:h-screen md:items-center md:py-0" aria-labelledby="col-h">
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory items-center gap-6 overflow-x-auto px-[var(--gutter)] md:snap-none md:gap-[6vw] md:overflow-visible">
        <div className="w-[80vw] shrink-0 snap-start md:w-[34vw]">
          <ChapterLabel n="01" title="The Collection" />
          <h2 id="col-h" className="display mt-8 text-[18vw] md:text-[9vw]">
            The <span className="display-i text-amethyst">Lavender</span> Hour
          </h2>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink-soft">
            Nine pieces cut for the minute between dusk and night. Silks that move like breath; tailoring with a pulse.
          </p>
          <p className="label-sm mt-8 hidden text-plum/50 md:block">Scroll to travel →</p>
          <p className="label-sm mt-8 text-plum/50 md:hidden">Swipe →</p>
        </div>
        {PRODUCTS.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            index={i}
            className={`c-card w-[72vw] shrink-0 snap-center sm:w-[46vw] md:w-[24vw] ${i % 3 === 1 ? "md:w-[30vw]" : ""}`}
            aspect={i % 3 === 1 ? "aspect-[4/5]" : "aspect-[3/4]"}
          />
        ))}
        <div className="w-[10vw] shrink-0" aria-hidden />
      </div>
      <div className="absolute bottom-10 left-[var(--gutter)] right-[var(--gutter)] hidden h-px bg-plum/10 md:block" aria-hidden>
        <div className="c-progress h-full origin-left scale-x-0 bg-amethyst" />
      </div>
    </section>
  );
}
