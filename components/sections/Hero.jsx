"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap"; // ScrollTrigger is registered once in SmoothScroll

// Boutique hero: block wordmark and calls to action on the left, a lavender boutique scene (arch,
// rail of gowns, plinths) on the right. The scene is one image whose edges are masked away so it
// sits in the CSS ground (.hb-ground / .hb-art in globals.css). Text is live; nothing is pinned.
export default function Hero({ ready }) {
  const root = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) return;
        // held back under the preloader, then the copy rises and the scene settles in
        gsap.set(".hb-in", { opacity: 0, y: 26 });
        gsap.set(".hb-art", { opacity: 0, scale: 1.06 });
        if (!ready) return;
        gsap.timeline({ defaults: { ease: "expo.out" } })
          .to(".hb-art", { opacity: 1, scale: 1, duration: 1.8 }, 0)
          .to(".hb-in", { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.15);
        // light depth on scroll: transforms only
        gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } })
          .to(".hb-copy", { y: -70, ease: "none" }, 0)
          .to(".hb-artwrap", { y: 50, ease: "none" }, 0);
      });
    }, root);
    return () => ctx.revert();
  }, [ready]);

  return (
    <section
      ref={root}
      data-hero
      className="hb-ground on-dark relative isolate h-[100svh] min-h-[640px] overflow-hidden text-white"
      aria-label="Fit Your Fashion — new season"
    >
      {/* ── The boutique scene ──────────────────────────── */}
      <div className="hb-artwrap pointer-events-none absolute bottom-0 left-1/2 -z-10 aspect-[890/801] w-[118vw] -translate-x-1/2 md:left-auto md:right-0 md:w-[min(61vw,104svh)] md:translate-x-0">
        <Image
          src="/hero/boutique.webp"
          alt="A rail of lavender gowns, a coat and a blazer under a glowing arch, with bags, heels and perfume on plinths"
          fill
          priority
          sizes="(max-width: 767px) 118vw, 61vw"
          className="hb-art object-cover"
        />
      </div>

      {/* ── Copy ────────────────────────────────────────── */}
      <div className="hb-copy relative flex h-full flex-col px-[var(--gutter)] pt-[calc(97px+2.5svh)] md:justify-center md:pb-[14svh] md:pl-[max(var(--gutter),7.4vw)] md:pt-[97px]">
        <p className="hb-in label flex items-center gap-4 text-[10px] tracking-[0.36em] text-white/90 md:text-[12px]">
          La boutique des dames <span className="h-px w-10 bg-white/70 md:w-14" aria-hidden />
        </p>
        <h1 className="hb-in mt-[1.6svh] font-[family-name:var(--font-wide)] font-extrabold uppercase leading-[0.86] md:mt-[3svh]">
          <span className="block text-[25vw] tracking-[-0.02em] md:text-[min(11.4vw,22svh)]">Fit</span>
          <span className="mt-[0.5svh] block text-[6.3vw] tracking-[0.01em] md:text-[min(2.52vw,4.9svh)]">Your Fashion</span>
        </h1>
        <p className="hb-in display mt-[1svh] text-[9.6vw] leading-[1.05] md:mt-[1.2svh] md:text-[min(3.9vw,7.6svh)]">Wear the Future</p>
        <p className="hb-in mt-[0.8svh] text-[14px] text-white/90 md:mt-[1.4svh] md:text-[clamp(15px,1.3vw,20px)]">Timeless styles for the modern woman.</p>

        <div className="hb-in mt-[2.2svh] flex flex-wrap items-center gap-x-7 gap-y-3 md:mt-[4svh]">
          <a href="#shop" className="rounded-full bg-white px-7 py-3.5 text-[14px] font-semibold text-amethyst shadow-[0_18px_40px_-18px_rgba(60,30,110,.7)] transition-colors hover:bg-plum hover:text-white md:px-8 md:py-4 md:text-[15px]" data-cursor="Shop">
            Shop New Arrivals <span className="ml-2" aria-hidden>→</span>
          </a>
          <a href="#looks" className="group/l flex items-center gap-3 text-[14px] text-white md:text-[15px]" data-cursor="View">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/80 transition-colors group-hover/l:bg-white group-hover/l:text-amethyst md:h-12 md:w-12" aria-hidden>
              <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
            View Lookbook
          </a>
        </div>
      </div>
    </section>
  );
}
