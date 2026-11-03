"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useApp } from "@/lib/store";
import { Spark } from "../ui/primitives";

// One couture piece floats centre stage in an arched frame, drifting with the pointer. Scroll pins the
// hero and the piece comes apart into the layers it was made from — measurements, the AI-drafted
// pattern, bias-cut silk, the finished gown — while the steps light up beside it. PLACEHOLDER imagery:
// Unsplash stock until the campaign shoot (see public/products/CREDITS.md).
const STEPS = [
  { n: "01", title: "Your measurements", line: "Twelve points from a two-minute scan." },
  { n: "02", title: "Pattern, drafted by AI", line: "Graded to your body, not a size chart." },
  { n: "03", title: "Silk, cut on the bias", line: "So it moves the way you do." },
  { n: "04", title: "Finished in your size", line: "Hand-finished in the atelier." },
];
const SCROLL_LENGTH = 1.6; // viewport heights of scrolling while the piece unfolds
const ARCH = "rounded-t-[999px] rounded-b-[28px]";

// Bottom layer: a dress form on a measuring grid.
function Measurements() {
  const lines = [[108, "Bust 86"], [150, "Waist 68"], [196, "Hip 94"]];
  return (
    <svg viewBox="0 0 200 300" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <pattern id="h-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0V16" fill="none" stroke="var(--color-lavender)" strokeOpacity=".14" strokeWidth=".6" />
        </pattern>
      </defs>
      <rect width="200" height="300" fill="url(#h-grid)" />
      <path d="M88 50Q100 44 112 50L114 64Q140 70 146 84L140 112Q132 130 124 150Q140 175 146 200L140 270H60L54 200Q60 175 76 150Q68 130 60 112L54 84Q60 70 86 64Z" fill="var(--color-lavender)" fillOpacity=".08" stroke="var(--color-lavender)" strokeWidth="1" />
      {lines.map(([y, t]) => (
        <g key={t}>
          <path d={`M30 ${y}H170`} stroke="var(--color-pearl)" strokeWidth=".8" strokeDasharray="3 3" />
          <circle cx="30" cy={y} r="2" fill="var(--color-pearl)" />
          <circle cx="170" cy={y} r="2" fill="var(--color-pearl)" />
          <text x="172" y={y - 5} textAnchor="end" fill="var(--color-pearl)" fontSize="8" letterSpacing="1">{t.toUpperCase()}</text>
        </g>
      ))}
    </svg>
  );
}

// Second layer: the pattern pieces, with seam allowances, notches and a grainline.
function Pattern() {
  const pieces = ["M60 44L90 40Q100 52 110 40L140 44L146 74L136 110H64L54 74Z", "M64 122H136L160 278H40Z"];
  return (
    <svg viewBox="0 0 200 300" className="absolute inset-0 h-full w-full" aria-hidden>
      {pieces.map((d) => (
        <g key={d}>
          <path d={d} fill="var(--color-lavender)" fillOpacity=".06" stroke="var(--color-lavender)" strokeWidth="1.2" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="var(--color-lavender)" strokeOpacity=".5" strokeWidth=".7" strokeDasharray="2 3" transform="translate(100 160) scale(.92) translate(-100 -160)" />
        </g>
      ))}
      <path d="M64 92h6M130 92h6M52 200h6M142 200h6" stroke="var(--color-pearl)" strokeWidth="1" />
      <path d="M100 150V256M96 156l4-6 4 6M96 250l4 6 4-6" fill="none" stroke="var(--color-pearl)" strokeWidth=".8" />
      <text x="100" y="80" textAnchor="middle" fill="var(--color-pearl)" fontSize="7" letterSpacing="1.4">FRONT BODICE ×1</text>
      <text x="100" y="212" textAnchor="middle" fill="var(--color-pearl)" fontSize="7" letterSpacing="1.4" transform="rotate(-90 100 212) translate(0 -8)">GRAIN</text>
    </svg>
  );
}

export default function Hero({ ready }) {
  const root = useRef(null);
  const { askStylist } = useApp();

  // Pin and unfold on scroll. Created on mount (before later pinned sections) so their start
  // positions account for this pin's spacer.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const w = () => root.current.querySelector(".h-stack").offsetWidth;
        // spread of the layers perpendicular to the tilted plane, bottom layer first
        const spread = [-0.72, -0.24, 0.24, 0.72];
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => "+=" + window.innerHeight * SCROLL_LENGTH,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        tl.to(".h-copy", { opacity: 0, y: -30, duration: 0.25 }, 0)
          .to(".h-cue", { opacity: 0, duration: 0.1 }, 0)
          .to(".h-stack", { rotateX: 56, rotateZ: -26, scale: 0.74, duration: 0.4, ease: "power2.inOut" }, 0)
          .to(".h-shadow", { scaleX: 1.5, opacity: 0.35, duration: 0.4 }, 0)
          .to(".h-word", { xPercent: -14, duration: 1 }, 0)
          .to(".h-ring", { opacity: 0, scale: 0.6, duration: 0.2 }, 0)
          .fromTo(".h-inside", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25 }, 0.2);
        root.current.querySelectorAll(".h-layer").forEach((el, k) => {
          tl.to(el, { z: () => w() * spread[k], duration: 0.45, ease: "power2.out" }, 0.25);
        });
        tl.fromTo(".h-step", { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.15, stagger: 0.12 }, 0.32)
          .to({}, { duration: 0.12 }); // hold the open stack before the page moves on
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // Arrival after the intro curtain: the piece rises into place, the headline lifts through its line
  // masks, the rest follows. Then the piece leans toward the pointer.
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) {
          gsap.set(".h-in, .h-fade, .h-line", { opacity: 1, y: 0, yPercent: 0 });
          return;
        }
        gsap.timeline()
          .fromTo(".h-in", { opacity: 0, y: 90, rotateX: 24 }, { opacity: 1, y: 0, rotateX: 0, duration: 1.3, ease: "expo.out" }, 0)
          .fromTo(".h-word", { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power2.out" }, 0)
          .fromTo(".h-line", { yPercent: 110 }, { yPercent: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.08 }, 0.15)
          .fromTo(".h-fade", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.06 }, 0.45);

        if (window.matchMedia("(pointer: fine)").matches) {
          const rx = gsap.quickTo(".h-tilt", "rotateX", { duration: 1.2, ease: "power3" });
          const ry = gsap.quickTo(".h-tilt", "rotateY", { duration: 1.2, ease: "power3" });
          const gx = gsap.quickTo(".h-glow", "x", { duration: 1.6, ease: "power3" });
          const gy = gsap.quickTo(".h-glow", "y", { duration: 1.6, ease: "power3" });
          const move = (e) => {
            const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
            ry(nx * 16);
            rx(-ny * 10);
            gx(nx * 60);
            gy(ny * 40);
          };
          root.current.addEventListener("pointermove", move);
          return () => root.current?.removeEventListener("pointermove", move);
        }
      });
    }, root);
    return () => ctx.revert();
  }, [ready]);

  const layer = `h-layer absolute inset-0 overflow-hidden ${ARCH} shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)]`;
  return (
    <div>
      {/* own wrapper: GSAP inserts its pin-spacer here, outside React's sibling list */}
      <section ref={root} data-hero className="on-dark relative h-[100svh] min-h-[640px] overflow-hidden bg-plum text-pearl" aria-label="Season 01">
        {/* light: a lavender bloom that follows the pointer, a floor fade, grain */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="h-glow absolute left-1/2 top-[56%] h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,182,228,.32),rgba(110,79,168,.12)_45%,transparent_70%)]" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#120c1f] to-transparent" />
        </div>
        <div className="grain pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        {/* the word behind everything, outlined, sliding with scroll */}
        <p className="h-word display pointer-events-none absolute left-0 top-[56%] -translate-y-1/2 whitespace-nowrap pl-[4vw] text-[30vw] leading-none text-transparent opacity-0 [-webkit-text-stroke:1px_rgba(201,182,228,.28)] md:text-[24vw]" aria-hidden>
          Couture · Couture
        </p>

        {/* ── The piece ───────────────────────────────────── */}
        <div className="h-in absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 opacity-0 [perspective:1600px] md:top-[56%]">
          <div className="h-tilt [transform-style:preserve-3d]">
            <div className="motion-safe:animate-[float-y_6s_ease-in-out_infinite] [transform-style:preserve-3d]">
              <div className={`h-stack relative aspect-[2/3] w-[min(52vw,34svh)] [transform-style:preserve-3d] md:w-[clamp(220px,min(24vw,42svh),380px)]`}>
                <div className={`${layer} border border-lavender/25 bg-plum-2`}><Measurements /></div>
                <div className={`${layer} border border-lavender/30 bg-[#2f2350]/80`}><Pattern /></div>
                <div className={layer} style={{ background: "repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0 2px,transparent 2px 9px),linear-gradient(135deg,#6e4fa8,#c9b6e4 38%,#8d6fc4 52%,#e9dff5 68%,#6e4fa8)" }}>
                  <span className="label-sm absolute bottom-[14%] left-1/2 -translate-x-1/2 rotate-[-45deg] text-[9px] text-plum/70">Bias grain 45°</span>
                </div>
                <div className={layer}>
                  <Image src="/products/aurora-gown.webp" alt="Model in a shimmering violet gown with a high slit" fill priority sizes="(max-width: 768px) 52vw, 380px" className="object-cover" style={{ objectPosition: "50% 0%" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-plum/50 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
          {/* floor shadow */}
          <div className="h-shadow absolute -bottom-12 left-1/2 h-8 w-[80%] -translate-x-1/2 rounded-[50%] bg-black/70 opacity-60 blur-xl" aria-hidden />
          {/* spinning badge on the arch's shoulder */}
          <svg viewBox="0 0 120 120" className="h-ring absolute -right-12 -top-6 h-24 w-24 text-lavender motion-safe:animate-[spin_18s_linear_infinite] md:-right-16 md:h-28 md:w-28" aria-hidden>
            <defs><path id="h-ring" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" /></defs>
            <text fill="currentColor" fontSize="10" letterSpacing="2.6"><textPath href="#h-ring">AI FITTED · MADE TO MEASURE ·</textPath></text>
          </svg>
        </div>

        {/* ── Opening copy ────────────────────────────────── */}
        <div className="h-copy absolute inset-x-0 top-[112px] z-20 px-[var(--gutter)] md:bottom-14 md:top-auto md:w-[min(44vw,560px)]">
          <p className="h-fade label-sm flex items-center gap-2 text-lavender opacity-0"><Spark className="h-3 w-3" animate={false} /> Season 01 · The Lavender Hour</p>
          <h1 className="mt-4 md:mt-5">
            {["Couture,", "cut for you."].map((t, k) => (
              <span key={t} className={`block overflow-hidden text-[13vw] leading-[0.9] md:text-[min(6.4vw,12svh)] ${k ? "display-i pb-[0.1em] text-lavender" : "display"}`}>
                <span className="h-line inline-block opacity-0">{t}</span>
              </span>
            ))}
          </h1>
          <p className="h-fade mt-4 hidden max-w-[36ch] text-[14.5px] leading-relaxed text-pearl/70 opacity-0 md:block">
            Every piece is drafted by AI from your measurements, then hand-finished in silk. Scroll to see one come together.
          </p>
          <div className="h-fade mt-6 hidden items-center gap-6 opacity-0 md:flex">
            <a href="#shop" className="group flex items-center gap-4" data-cursor="Shop">
              <span className="label">Explore collection</span>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-lavender text-plum transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-45deg]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </a>
            <button onClick={() => askStylist("Dinner date in London in January")} className="label ai-glow flex items-center gap-2 rounded-full bg-white/10 px-6 py-4 backdrop-blur-md transition-colors hover:bg-white/20" data-cursor="Ask">
              <Spark className="h-3.5 w-3.5" /> Style me
            </button>
          </div>
        </div>

        {/* phone actions sit under the piece */}
        <div className="h-copy absolute inset-x-0 bottom-0 z-20 flex gap-2 px-[var(--gutter)] pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden">
          <a href="#shop" className="h-fade label flex-1 rounded-full bg-pearl py-4 text-center text-plum opacity-0">Shop now</a>
          <button onClick={() => askStylist("Dinner date in London in January")} className="h-fade label ai-glow flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 py-4 opacity-0 backdrop-blur-md">
            <Spark className="h-3.5 w-3.5" /> Style me
          </button>
        </div>

        <div className="h-cue h-fade absolute bottom-10 right-[var(--gutter)] z-20 hidden items-center gap-3 opacity-0 md:flex" aria-hidden>
          <span className="label-sm text-pearl/60">Scroll to unfold</span>
          <span className="relative h-10 w-px overflow-hidden bg-white/15"><span className="absolute inset-x-0 top-0 h-1/2 bg-lavender motion-safe:animate-[float-y_1.6s_ease-in-out_infinite]" /></span>
        </div>
        <p className="h-fade label-sm absolute bottom-3 left-1/2 z-20 hidden -translate-x-1/2 text-[9px] text-pearl/35 opacity-0 md:block">Placeholder imagery · Unsplash</p>

        {/* ── Inside the piece (revealed by scroll) ───────── */}
        <div className="h-inside pointer-events-none absolute inset-x-0 top-[112px] z-20 px-[var(--gutter)] opacity-0 md:bottom-14 md:top-auto md:w-[min(34vw,460px)]" aria-hidden>
          <p className="label-sm text-lavender">Inside every piece</p>
          <p className="display mt-3 text-[10vw] leading-[0.92] md:text-[min(4.6vw,9svh)]">Made layer<br /><span className="display-i text-lavender">by layer.</span></p>
        </div>
        <ol className="pointer-events-none absolute inset-x-0 bottom-6 z-20 grid grid-cols-2 gap-x-4 gap-y-3 px-[var(--gutter)] md:inset-x-auto md:bottom-auto md:right-[var(--gutter)] md:top-1/2 md:w-[min(26vw,320px)] md:-translate-y-1/2 md:flex md:flex-col-reverse md:gap-7" aria-label="How each piece is made">
          {STEPS.map((s) => (
            <li key={s.n} className="h-step border-t border-white/15 pt-3 opacity-0">
              <p className="label-sm text-lavender">{s.n}</p>
              <p className="display mt-1 text-[17px] leading-tight md:text-[24px]">{s.title}</p>
              <p className="mt-1 hidden text-[13px] text-pearl/60 md:block">{s.line}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
