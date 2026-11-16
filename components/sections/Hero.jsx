"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap"; // ScrollTrigger is registered once in SmoothScroll
import { formatPrice } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { Spark } from "../ui/primitives";

// Scroll-film hero. The page pins for three screens while one take plays:
//   1. a block wordmark beside a rail of garments
//   2. the ivory coat lifts off the rail, swings to centre stage and the model steps into it
//   3. ELEGANCE rises behind her
//   4. the word clears and the rest of the rail returns as shoppable cards around her
// The coat image is a crop of the model photo (top 18.4%, 64.87% tall), so it lands on her exactly.
// Positions live in CSS variables (.hx2 in globals.css), so nothing is measured and resizing is free.
// PLACEHOLDER imagery: Unsplash stock (see public/hero/CREDITS.md).
const COAT = { src: "/hero/look-ivory-coat.webp", w: 401, h: 640, name: "Ivory Long Coat" };
const MODEL = { src: "/models/ivory-coat.webp", w: 611, h: 1500 };
// k: height on the rail relative to the coat. Card positions are for the last beat.
const RAIL = [
  { src: "/hero/look-ivory-suit.webp", w: 492, h: 640, name: "Cocoon Jacket", k: 0.72, card: "left-[4vw] top-[17svh] md:left-[13vw] md:top-[20svh]" },
  { src: "/hero/look-noir-blazer.webp", w: 396, h: 575, name: "Noir Blazer Dress", k: 0.8, card: "right-[4vw] top-[17svh] md:right-[13vw] md:top-[20svh]" },
  { src: "/hero/look-sand-suit.webp", w: 664, h: 640, name: "Sand Power Suit", k: 0.58, card: "left-[4vw] bottom-[11svh] md:left-[17vw] md:bottom-[9svh]" },
  { src: "/hero/look-slate-suit.webp", w: 330, h: 640, name: "Slate Wool Wrap", k: 0.95, card: "right-[4vw] bottom-[11svh] md:right-[17vw] md:bottom-[9svh]" },
];
const WORD = "Elegance";

function Hook({ className = "" }) {
  return (
    <svg viewBox="0 0 40 30" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <path d="M20 12V7.5a4 4 0 1 0-4-4" />
      <path d="M20 12 3 25h34L20 12Z" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero({ ready }) {
  const root = useRef(null);
  const { askStylist } = useApp();

  // The take: one scrubbed, pinned timeline. Built on mount (not when the preloader ends) so the pins
  // further down the page are measured after this one, in page order.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) {
          gsap.set(".hx-elegance", { autoAlpha: 0 }); // calm version: the opening frame, unpinned
          return;
        }
        gsap.set(".hx-e", { yPercent: 110 });
        gsap.set(".hx-card", { y: 44, scale: 0.9 });

        gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + window.innerHeight * 3.2, pin: true, scrub: 0.7, invalidateOnRefresh: true },
        })
          // 1 → 2: the coat leaves the rail
          .to(".hx-coat", { "--lift": -9, duration: 0.9, ease: "power2.out" }, 0)
          .to(".hx-coat", { "--fr": -15, duration: 0.9, ease: "power2.out" }, 0)
          .to(".hx-coat", { "--fx": 0, "--fs": 0, duration: 2.3 }, 0.15)
          .to(".hx-coat", { "--fy": 0, duration: 2.1 }, 0.35)
          .to(".hx-coat", { "--fr": 7, duration: 1 }, 0.9)
          .to(".hx-coat", { "--lift": 0, duration: 1.5 }, 0.9)
          .to(".hx-coat", { "--fr": 0, duration: 0.7, ease: "power2.out" }, 1.9)
          .to(".hx-cue", { autoAlpha: 0, duration: 0.4 }, 0)
          .to(".hx-wordwrap", { xPercent: -18, autoAlpha: 0, duration: 1.2 }, 0.1)
          .to(".hx-railwrap", { x: () => window.innerWidth * 0.22, autoAlpha: 0, duration: 1.3 }, 0.25)
          // she steps into it
          .to(".hx-model", { opacity: 1, duration: 0.5, ease: "none" }, 2.3)
          .to(".hx-coat", { opacity: 0, duration: 0.3, ease: "none" }, 2.8)
          // 3: ELEGANCE
          .to(".hx-kicker", { opacity: 1, duration: 0.5 }, 3)
          .to(".hx-e", { yPercent: 0, duration: 0.9, stagger: 0.06, ease: "power3.out" }, 3)
          // 4: the word clears, the rail comes back as cards
          .to(".hx-elegance", { yPercent: -70, opacity: 0, duration: 1 }, 5.1)
          .to(".hx-figure", { scale: 0.93, duration: 1 }, 5.1)
          .to(".hx-card", { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }, 5.5)
          .to({}, { duration: 0.9 }); // hold the last frame before the page moves on
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // Arrival, held back under the preloader: the wordmark rises, the garments drop onto the rail one by one.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) {
          gsap.set(".hx-in", { opacity: 1 });
          return;
        }
        gsap.set(".hx-char", { yPercent: 112 });
        gsap.set(".hx-in", { opacity: 0 });
        gsap.set(".hx-hang", { y: -46, opacity: 0 });
        if (!ready) return;
        gsap.timeline({ defaults: { ease: "expo.out" } })
          .to(".hx-char", { yPercent: 0, duration: 1.2, stagger: 0.03 }, 0)
          .to(".hx-bar", { opacity: 1, duration: 0.8 }, 0.15)
          .to(".hx-hang", { y: 0, opacity: 1, duration: 1.3, stagger: 0.09 }, 0.3)
          .to(".hx-line", { opacity: 1, duration: 1 }, 0.6)
          .to(".hx-corner", { opacity: 1, duration: 0.8, stagger: 0.1 }, 1);
      });
    }, root);
    return () => ctx.revert();
  }, [ready]);

  return (
    <div>
      {/* own wrapper: GSAP inserts its pin-spacer here, outside React's sibling list */}
      <section
        ref={root}
        data-hero
        className="hx2 on-dark relative isolate h-[100svh] min-h-[600px] overflow-hidden text-white"
        aria-label="Fit Your Fashion — Season 01"
      >
        <div className="hx2-ground absolute inset-0 -z-10" aria-hidden />
        <div className="grain pointer-events-none absolute inset-0 -z-10" aria-hidden />

        {/* ── 1. Wordmark ─────────────────────────────────── */}
        <div className="hx-wordwrap absolute inset-x-0 top-[calc(97px+3svh)] z-30 px-[var(--gutter)] md:inset-x-auto md:left-0 md:top-1/2 md:-translate-y-[46%]">
          <h1 className="block-word text-[#f6f1fc] drop-shadow-[0_10px_30px_rgba(30,21,48,.28)]">
            <span className="sr-only">Fit Your Fashion</span>
            <span aria-hidden className="block overflow-hidden pb-[0.05em] text-[8.4vw] md:text-[min(3.7vw,7.4svh)]">
              {[..."FIT YOUR"].map((c, i) => <span key={i} className="hx-char inline-block whitespace-pre">{c}</span>)}
            </span>
            <span aria-hidden className="block overflow-hidden pb-[0.05em] text-[15.4vw] md:text-[min(8.3vw,17svh)]">
              {[..."FASHION"].map((c, i) => <span key={i} className="hx-char inline-block">{c}</span>)}
            </span>
          </h1>
          <p className="hx-line hx-in label mt-[1.6svh] text-[10px] tracking-[0.42em] text-white/85 md:mt-[2.4svh] md:text-[11px]">
            Wear the future · Cut to fit only you
          </p>
          <a
            href="#shop"
            className="hx-line hx-in mt-[2.2svh] inline-block rounded-full border-2 border-white/85 px-6 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-white hover:text-plum md:mt-[3.4svh] sm:text-[15px]"
            data-cursor="Shop"
          >
            New Arrival
          </a>
        </div>

        {/* ── 3. ELEGANCE, behind the model ───────────────── */}
        <div className="hx-elegance pointer-events-none absolute inset-x-0 top-[27svh] z-10 text-center md:top-[24svh]" aria-hidden>
          <p className="hx-kicker label mb-[1svh] opacity-0 text-[10px] tracking-[0.5em] text-white/85 md:mr-[52vw] md:text-[11px]">A touch of timeless</p>
          <p className="block-word overflow-hidden whitespace-nowrap pb-[0.06em] text-[12vw] text-[#f6f1fc] md:text-[min(12vw,34svh)]">
            {[...WORD].map((c, i) => <span key={i} className="hx-e inline-block">{c}</span>)}
          </p>
        </div>

        {/* ── The figure: model, coat and the rail it starts on ── */}
        <div className="hx-figure hx2-figure absolute bottom-0 left-1/2 z-20 -ml-[calc(var(--mh)*0.20367)] origin-bottom">
          <div className="hx-railwrap absolute inset-0" aria-hidden>
            <div className="hx2-rail absolute inset-0 text-mist">
              {/* the rail: bar, two legs, a soft floor */}
              <div className="hx-bar hx-in absolute left-[-34%] top-[calc(18.4%-3.3svh)] h-[3px] w-[calc(168%+var(--gap)*4)] md:left-[20%] md:w-[calc(114%+var(--gap)*4)] rounded-full bg-gradient-to-r from-white/90 via-mist to-white/60" />
              <div className="hx-bar hx-in absolute left-[-30%] md:left-[24%] top-[calc(18.4%-3.3svh)] h-[calc(var(--mh)*0.66)] w-[3px] rounded-full bg-gradient-to-b from-white/85 to-white/15 md:h-[calc(var(--mh)*0.46)]" />
              <div className="hx-bar hx-in absolute left-[calc(130%+var(--gap)*4)] top-[calc(18.4%-3.3svh)] h-[calc(var(--mh)*0.66)] md:h-[calc(var(--mh)*0.46)] w-[3px] rounded-full bg-gradient-to-b from-white/85 to-white/15" />
              <div className="hx-bar hx-in absolute left-[-40%] top-[calc(18.4%+var(--mh)*0.6)] h-[5svh] md:top-[calc(18.4%+var(--mh)*0.4)] w-[calc(180%+var(--gap)*4)] rounded-[50%] bg-[radial-gradient(closest-side,rgba(30,21,48,.38),transparent)]" />
              {/* the coat's hanger stays behind when it flies */}
              <Hook className="hx-hang absolute left-1/2 top-[calc(18.4%-3.1svh)] -ml-[2svh] h-[3.2svh] w-[4svh]" />
              {RAIL.map((g, n) => (
                <div
                  key={g.src}
                  className="hx-hang absolute top-[18.4%] -translate-x-1/2"
                  style={{ left: `calc(50% + var(--gap) * ${n + 1})`, zIndex: 9 - n, height: `calc(64.87% * var(--rs) * ${g.k})` }}
                >
                  <Hook className="absolute bottom-full left-1/2 -mb-[0.2svh] -ml-[2svh] h-[3.2svh] w-[4svh]" />
                  <Image src={g.src} alt="" width={g.w} height={g.h} sizes="260px" priority className="h-full w-auto max-w-none drop-shadow-[0_14px_14px_rgba(30,21,48,.22)]" />
                </div>
              ))}
            </div>
          </div>

          <Image
            src={MODEL.src}
            alt="Model wearing the Ivory Long Coat"
            width={MODEL.w}
            height={MODEL.h}
            sizes="(max-width: 767px) 60vw, 40vw"
            className="hx-model absolute inset-0 h-full w-full opacity-0 drop-shadow-[0_30px_40px_rgba(30,21,48,.3)]"
          />
          <div
            className="hx-coat hx2-coat absolute left-0 top-[18.4%] z-10 h-[64.87%] w-full will-change-transform"
          >
            <Image src={COAT.src} alt="" width={COAT.w} height={COAT.h} priority sizes="(max-width: 767px) 60vw, 40vw" className="hx-hang h-full w-full" />
          </div>
        </div>

        {/* ── 4. The rail, back as cards ──────────────────── */}
        {RAIL.map((g) => (
          <a
            key={g.name}
            href="#shop"
            className={`hx-card group/c invisible absolute z-30 w-[clamp(104px,26vw,132px)] opacity-0 md:w-[clamp(150px,13.5vw,210px)] ${g.card}`}
            data-cursor="Shop"
          >
            <Image src={g.src} alt={g.name} width={g.w} height={g.h} sizes="200px" className="mx-auto h-[clamp(84px,13svh,170px)] w-auto transition-transform duration-500 ease-[var(--ease-film)] group-hover/c:-translate-y-2 md:h-[clamp(110px,21svh,220px)]" />
            <span className="-mt-3 flex items-center justify-between gap-2 rounded-2xl bg-white/92 px-3 py-2.5 text-plum shadow-[0_18px_40px_-18px_rgba(30,21,48,.6)] md:px-4 md:py-3">
              <span className="min-w-0">
                <span className="display block text-[14px] leading-tight md:truncate md:text-[19px]">{g.name}</span>
                <span className="label-sm mt-0.5 block text-[9px] text-plum/55 md:text-[10px]" title="Placeholder price">{formatPrice()}</span>
              </span>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum text-[15px] leading-none text-pearl transition-colors group-hover/c:bg-amethyst" aria-hidden>+</span>
            </span>
          </a>
        ))}

        {/* ── Corners ─────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 z-40 flex items-end justify-between px-[var(--gutter)] pb-[max(1.1rem,env(safe-area-inset-bottom))] md:pb-7">
          <p className="hx-corner hx-in label-sm hidden items-center gap-2 text-white/80 sm:flex">
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
        <p className="hx-cue absolute hidden sm:block bottom-[max(1.6rem,env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 md:bottom-8">
          <span className="hx-corner hx-in label-sm block text-white/75">Scroll <span className="ml-1 inline-block motion-safe:animate-bounce" aria-hidden>↓</span></span>
        </p>
      </section>
    </div>
  );
}
