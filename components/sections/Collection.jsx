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
    <div>
      {/* own wrapper: GSAP inserts its pin-spacer here, outside React's sibling list */}
    <section id="collection" ref={root} className="relative overflow-hidden bg-pearl py-24 md:flex md:h-screen md:items-center md:py-0" aria-labelledby="col-h">
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory scroll-px-[var(--gutter)] items-center gap-5 overflow-x-auto overscroll-x-contain px-[var(--gutter)] sm:gap-6 md:snap-none md:gap-[5vw] md:overflow-visible">
        <div className="w-[84vw] shrink-0 snap-start sm:w-[60vw] md:w-[44vw] lg:w-[34vw]">
          <ChapterLabel n="01" title="The Collection" />
          <h2 id="col-h" className="display mt-8 text-[17vw] sm:text-[12vw] md:text-[10vw] lg:text-[9vw]">
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
            /* width capped by viewport height so cards fit when pinned on landscape tablets/phones */
            className={`c-card shrink-0 snap-center ${i % 3 === 1 ? "w-[78vw] sm:w-[50vw] md:w-[min(44vw,50svh)] lg:w-[min(30vw,54svh)]" : "w-[70vw] sm:w-[42vw] md:w-[min(38vw,46svh)] lg:w-[min(24vw,46svh)]"}`}
            aspect={i % 3 === 1 ? "aspect-[4/5]" : "aspect-[3/4]"}
          />
        ))}
        <div className="w-[10vw] shrink-0" aria-hidden />
      </div>
      <div className="absolute bottom-10 left-[var(--gutter)] right-[var(--gutter)] hidden h-px bg-plum/10 md:block" aria-hidden>
        <div className="c-progress h-full origin-left scale-x-0 bg-amethyst" />
      </div>
    </section>
    </div>
  );
}
