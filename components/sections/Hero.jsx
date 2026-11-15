"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap"; // ScrollTrigger is registered once in SmoothScroll
import { useApp } from "@/lib/store";
import { Spark } from "../ui/primitives";

// Streetwear-scale poster hero: a full-width extended wordmark under a lavender dusk sky, a "New
// Arrival" pill, a slow rail of floating garments, and below it a winged statue rising out of
// lavender-lit mountains. Layers drift apart on scroll.
// PLACEHOLDER imagery: Unsplash stock (see public/hero/CREDITS.md).
const RAIL = [
  { src: "/hero/look-ivory-coat.webp", w: 401, h: 640, name: "Ivory Long Coat" },
  { src: "/hero/look-noir-blazer.webp", w: 396, h: 575, name: "Noir Blazer Dress" },
  { src: "/hero/look-ivory-suit.webp", w: 492, h: 640, name: "Cocoon Jacket" },
  { src: "/hero/look-midnight-embellished.webp", w: 404, h: 640, name: "Starlit Embellished Set" },
  { src: "/hero/look-sand-suit.webp", w: 664, h: 640, name: "Sand Power Suit" },
  { src: "/hero/look-slate-suit.webp", w: 330, h: 640, name: "Slate Wool Wrap" },
];
const WORD = "FIT YOUR FASHION";

function Garment({ g, hidden }) {
  return (
    <a
      href="#shop"
      className="group/g relative flex shrink-0 flex-col items-center px-[clamp(14px,2.2vw,36px)]"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      data-cursor="Shop"
    >
      <Image
        src={g.src}
        alt={hidden ? "" : g.name}
        width={g.w}
        height={g.h}
        sizes="240px"
        className="h-[clamp(120px,19svh,210px)] w-auto transition-transform duration-500 ease-[var(--ease-film)] group-hover/g:-translate-y-2"
      />
      {/* soft floor shadow (a gradient, not a filter: these move every frame) */}
      <span className="mt-1 h-3 w-3/4 rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,8,20,.55),transparent)]" aria-hidden />
      <span className="label-sm pointer-events-none absolute -bottom-5 whitespace-nowrap text-[9.5px] text-white/0 transition-colors duration-300 group-hover/g:text-white/80">
        {g.name}
      </span>
    </a>
  );
}

export default function Hero({ ready }) {
  const root = useRef(null);
  const { askStylist } = useApp();

  // Hold everything back under the preloader, then assemble: wordmark letters rise, the rail glides
  // in, the statue climbs out from behind the mountains. Scroll pulls the layers apart.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) {
          gsap.set(".hx-in", { opacity: 1 });
          return;
        }
        gsap.set(".hx-char", { yPercent: 115 });
        gsap.set(".hx-in", { opacity: 0 });
        gsap.set(".hx-angel", { yPercent: 38 });
        gsap.set(".hx-range", { yPercent: 18 });
        gsap.set(".hx-rail", { x: 160 });
        if (!ready) return;

        gsap.timeline({ defaults: { ease: "expo.out" } })
          .to(".hx-char", { yPercent: 0, duration: 1.2, stagger: 0.035 }, 0)
          .to(".hx-range", { yPercent: 0, opacity: 1, duration: 1.6 }, 0.1)
          .to(".hx-angel", { yPercent: 0, opacity: 1, duration: 2.2 }, 0.3)
          .fromTo(".hx-quote", { y: 14 }, { y: 0, opacity: 1, duration: 1.1 }, 0.55)
          .to(".hx-pill", { opacity: 1, duration: 0.8 }, 0.7)
          .to(".hx-rail", { x: 0, opacity: 1, duration: 1.6 }, 0.75)
          .to(".hx-corner", { opacity: 1, duration: 0.8, stagger: 0.1 }, 1.1);

        // depth on scroll: transforms only, scrubbed, no pin
        gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } })
          .to(".hx-word", { yPercent: -45, ease: "none" }, 0)
          .to(".hx-rail-wrap", { y: -90, ease: "none" }, 0)
          .to(".hx-angel-wrap", { y: -70, ease: "none" }, 0)
          .to(".hx-range-wrap", { y: 40, ease: "none" }, 0);
      });
    }, root);
    return () => ctx.revert();
  }, [ready]);

  return (
    <section
      ref={root}
      data-hero
      className="on-dark relative isolate flex h-[100svh] min-h-[680px] flex-col overflow-hidden text-white"
      aria-label="Fit Your Fashion — Season 01"
    >
      {/* ── Lavender dusk: amethyst overhead, a lavender glow at the horizon, plum below ── */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#3b2a63_0%,#55408a_24%,#7660ae_44%,#9580c6_60%,#7a63b2_72%,#4a3778_86%,#1e1530_100%)]" aria-hidden />
      <div className="hx-stars absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-[70%] bg-[radial-gradient(ellipse_45%_50%_at_50%_68%,rgba(233,223,245,.45),transparent_70%)]" aria-hidden />

      {/* ── Wordmark + pill + rail (below the 97px header) ─ */}
      <div className="relative z-30 flex flex-col items-center pt-[calc(97px+2.2svh)]">
        <h1 className="hx-word w-full overflow-hidden text-center font-[family-name:var(--font-wide)] font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-[#eef3f8]">
          <span className="sr-only">Fit Your Fashion</span>
          {/* one line on wide screens; phones wrap to FIT YOUR / FASHION so the type stays big */}
          <span aria-hidden className="block text-[12.5vw] sm:whitespace-nowrap sm:text-[min(7.6vw,15svh)]">
            {WORD.split(" ").map((w, wi) => (
              <span key={wi}>
                {wi > 0 && " "}
                <span className="inline-block overflow-hidden pb-[0.04em] align-top">
                  {[...w].map((c, ci) => (
                    <span key={ci} className="hx-char inline-block">{c}</span>
                  ))}
                </span>
              </span>
            ))}
          </span>
        </h1>

        {/* the quiet serif line against the loud wordmark */}
        <p className="hx-quote hx-in display-i mt-[1.2svh] px-6 text-center text-[clamp(19px,2.3vw,32px)] leading-tight text-mist">
          Wear the future <span className="text-lavender">—</span> cut to fit only you.
        </p>

        <a
          href="#shop"
          className="hx-pill hx-in mt-[2svh] rounded-full border-2 border-white/85 px-6 py-2 text-[14px] font-semibold tracking-[0.01em] text-white transition-colors hover:bg-white hover:text-plum sm:text-[15px]"
          data-cursor="Shop"
        >
          New Arrival
        </a>

        {/* garment rail: three copies (one set is narrower than a wide screen); sliding by a third loops */}
        <div className="hx-rail-wrap mt-[2.6svh] w-full">
          <div className="hx-rail hx-in group/rail overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)]">
            <div className="hx-marquee flex w-max items-end pb-6 group-hover/rail:[animation-play-state:paused]">
              {[...RAIL, ...RAIL, ...RAIL].map((g, n) => <Garment key={n} g={g} hidden={n >= RAIL.length} />)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Statue scene: the angel rising out of the mountains ─ */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[47svh] min-h-[320px]" aria-hidden>
        <div className="hx-angel-wrap absolute bottom-[4%] left-1/2 z-10 h-[80%] -translate-x-1/2">
          <Image src="/hero/angel.webp" alt="" width={468} height={941} priority sizes="(max-width: 640px) 60vw, 26vw" className="hx-angel hx-in h-full w-auto" />
        </div>
        <div className="hx-range-wrap absolute inset-x-0 -bottom-[2%] z-20 h-[46%] sm:h-[52%]">
          <Image src="/hero/range.webp" alt="" fill priority sizes="100vw" className="hx-range hx-in object-cover object-top" />
        </div>
        <div className="absolute inset-x-0 bottom-0 z-20 h-[24%] bg-gradient-to-t from-plum to-transparent" />
      </div>

      {/* ── Corners ─────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 z-40 flex items-end justify-between px-[var(--gutter)] pb-[max(1.1rem,env(safe-area-inset-bottom))] md:pb-7">
        <p className="hx-corner hx-in label-sm hidden items-center gap-2 text-white/75 sm:flex">
          <Spark className="h-3 w-3" animate={false} /> Season 01 · The Lavender Hour
        </p>
        <button
          onClick={() => askStylist("Style me a look from the new arrivals")}
          className="hx-corner hx-in label-sm ml-auto flex items-center gap-2 rounded-full border border-white/30 bg-plum/55 px-4 py-2.5 text-white/90 transition-colors hover:bg-white hover:text-plum"
          data-cursor="Ask"
        >
          <Spark className="h-3 w-3" /> Style me with AI
        </button>
      </div>
      <p className="hx-corner hx-in label-sm absolute bottom-1 left-1/2 z-40 hidden -translate-x-1/2 text-[8.5px] text-white/30 md:block">Placeholder imagery · Unsplash</p>
    </section>
  );
}
