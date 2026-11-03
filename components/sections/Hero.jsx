"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useApp } from "@/lib/store";
import { Spark } from "../ui/primitives";

// A muse, sketched in an arched frame, with her look laid out around her like a flat lay — the gown,
// a cropped jacket, the ornaments, heels and a clutch. Scroll pins the hero and dresses her piece by
// piece: each one flies off the flat lay and settles onto her, and its step lights up beside her.
const STEPS = [
  { n: "01", title: "The gown", line: "Lavender silk, cut on the bias to your measurements." },
  { n: "02", title: "The jacket", line: "A cropped tuxedo, worn on the shoulders." },
  { n: "03", title: "The ornaments", line: "Pearls, drop earrings and a crystal comb." },
  { n: "04", title: "The finish", line: "Satin heels and a mirror clutch." },
];
const SCROLL_LENGTH = 2; // viewport heights of scrolling while she is dressed
const ARCH = "rounded-t-[999px] rounded-b-[28px]";

// Where each piece waits on the flat lay, in the arch's 200×300 drawing units (centre of the piece),
// and when it lands as a fraction of the pinned scroll. Labels sit under each group on the flat lay.
const PIECES = [
  { k: "gown", step: 0, at: [-78, 40], rotation: -10, scale: 0.5, land: 0.1 },
  { k: "jacket", step: 1, at: [252, 18], rotation: 12, scale: 0.6, land: 0.3 },
  { k: "comb", step: 2, at: [222, 92], rotation: -18, scale: 2, land: 0.47 },
  { k: "necklace", step: 2, at: [252, 102], rotation: 8, scale: 2, land: 0.5 },
  { k: "earrings", step: 2, at: [282, 92], rotation: 0, scale: 2.4, land: 0.53 },
  { k: "bracelet", step: 2, at: [268, 128], rotation: 20, scale: 2.4, land: 0.56 },
  { k: "clutch", step: 3, at: [232, 186], rotation: -14, scale: 2, land: 0.66 },
  { k: "heels", step: 3, at: [272, 196], rotation: -22, scale: 1.5, land: 0.7 },
];
const LABELS = [
  { text: "THE GOWN", at: [-78, 106] },
  { text: "THE JACKET", at: [252, 56] },
  { text: "THE ORNAMENTS", at: [254, 150] },
  { text: "THE FINISH", at: [252, 216] },
];

const SKIN = "#f6eee9";
const GOLD = "#e2c27d";
const INK = { stroke: "var(--color-plum)", strokeWidth: 0.8, strokeLinejoin: "round", strokeLinecap: "round" };
// pearls strung along the neckline curve
const PEARLS = Array.from({ length: 11 }, (_, n) => {
  const t = n / 10, u = 1 - t;
  return [u * u * 92 + 2 * u * t * 100 + t * t * 108, u * u * 59 + 2 * u * t * 73 + t * t * 59];
});

// The muse: a fashion croquis, hand on hip, faceless, hair in a sleek bun.
function Muse() {
  return (
    <svg viewBox="0 0 200 300" className="absolute inset-0 h-full w-full" aria-hidden>
      <ellipse cx="100" cy="290" rx="34" ry="4" fill="var(--color-plum)" opacity=".35" />
      <path
        d="M96 44L95 55Q86 58 79 62Q75 65 75 72L72 104L74 142Q74 150 77 151Q79 150 79 143L79 106L82 78Q85 92 89 103Q88 116 85 132Q84 170 89 206L92 272L87 284H97L97 272L99 206L100 168L101 206L104 272L103 284H113L109 272L111 206Q116 170 115 132Q113 118 111 104Q112 92 118 78L128 97L116 116Q112 120 113 124L117 125L137 103L125 66Q121 59 105 55L104 44Z"
        fill={SKIN} {...INK}
      />
      <ellipse cx="100" cy="33" rx="9.5" ry="12" fill={SKIN} {...INK} />
      <path d="M90.5 36Q88 21 100 20.5Q112 21 109.5 36Q109 27 100 26Q91 27 90.5 36Z" fill="var(--color-plum)" />
      <circle cx="100" cy="14.5" r="6.5" fill="var(--color-plum)" />
      {/* collarbones and a hint of the knee, sketch-light */}
      <path d="M90 60Q95 62 99 61M101 61Q105 62 110 60M91 206q2 2 6 1M103 207q4 1 6-1" fill="none" {...INK} strokeWidth=".5" opacity=".6" />
    </svg>
  );
}

// Her look, one group per piece, drawn in place on the figure (GSAP moves them out to the flat lay).
function Look() {
  return (
    <svg viewBox="0 0 200 300" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="h-silk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6e4fa8" />
          <stop offset=".35" stopColor="#c9b6e4" />
          <stop offset=".55" stopColor="#9b7fd0" />
          <stop offset=".72" stopColor="#e9dff5" />
          <stop offset="1" stopColor="#7d5fb8" />
        </linearGradient>
        <linearGradient id="h-mirror" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".5" stopColor="#c9b6e4" />
          <stop offset="1" stopColor="#f4eefb" />
        </linearGradient>
      </defs>

      <g className="h-piece" data-k="gown">
        <path d="M91 77L93 58M109 77L107 58" stroke="#8d6fc4" strokeWidth="1.2" />
        <path d="M86 78Q93 73 100 80Q107 73 114 78Q114 92 111 103Q110 116 116 132Q118 165 114 200Q118 240 136 284Q100 292 64 284Q82 240 86 200Q82 165 84 132Q90 116 89 103Q86 92 86 78Z" fill="url(#h-silk)" {...INK} strokeWidth=".6" />
        <path d="M100 132Q102 200 100 288M92 200Q88 240 80 284M108 205Q112 245 122 286" fill="none" stroke="var(--color-plum)" strokeWidth=".5" opacity=".25" />
        <path d="M104 84Q108 140 106 200Q110 240 124 282" fill="none" stroke="#fff" strokeWidth="1.6" opacity=".35" />
        {/* the slit, showing her leg */}
        <path d="M95 176Q90 230 83 283L95 285Q96 232 97 178Z" fill={SKIN} {...INK} strokeWidth=".6" />
      </g>

      <g className="h-piece" data-k="jacket">
        <path d="M95 55Q82 57 73 62Q67 66 66 76L62 134Q71 138 81 133L84 104L90 122L97 88Z" fill="var(--color-plum-2)" stroke="var(--color-lavender)" strokeWidth=".6" strokeLinejoin="round" />
        <path d="M105 55Q118 57 127 62Q133 66 134 76L138 134Q129 138 119 133L116 104L110 122L103 88Z" fill="var(--color-plum-2)" stroke="var(--color-lavender)" strokeWidth=".6" strokeLinejoin="round" />
        <path d="M95 55L97 88L90 66L93 60ZM105 55L103 88L110 66L107 60Z" fill="var(--color-lavender)" opacity=".9" />
        <path d="M70 82L67 128M130 82L133 128M70 118h9M121 118h9" fill="none" stroke="var(--color-lavender)" strokeWidth=".5" opacity=".45" />
      </g>

      <g className="h-piece" data-k="comb">
        <path d="M93 12Q100 6 107 12" fill="none" stroke={GOLD} strokeWidth="1" />
        {[93.5, 96.5, 100, 103.5, 106.5].map((x, n) => <circle key={x} cx={x} cy={n === 2 ? 7.5 : n % 2 ? 9 : 11.2} r="1" fill="#fff" stroke={GOLD} strokeWidth=".4" />)}
      </g>
      <g className="h-piece" data-k="necklace">
        {PEARLS.map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.25" fill="#fff" stroke="#d9cfe6" strokeWidth=".3" />)}
        <path d="M100 73v2" stroke={GOLD} strokeWidth=".5" />
        <path d="M100 75l2 2.6-2 2.6-2-2.6Z" fill="#6e4fa8" stroke={GOLD} strokeWidth=".5" />
      </g>
      <g className="h-piece" data-k="earrings">
        <path d="M90.4 36.5v3.5M109.6 36.5v3.5" stroke={GOLD} strokeWidth=".5" />
        <circle cx="90.4" cy="41.6" r="1.6" fill="#fff" stroke={GOLD} strokeWidth=".4" />
        <circle cx="109.6" cy="41.6" r="1.6" fill="#fff" stroke={GOLD} strokeWidth=".4" />
      </g>
      <g className="h-piece" data-k="bracelet">
        <ellipse cx="76.5" cy="137" rx="3.4" ry="1.3" fill="none" stroke={GOLD} strokeWidth="1.1" />
      </g>
      <g className="h-piece" data-k="clutch">
        <rect x="70" y="145.5" width="14" height="9" rx="2" fill="url(#h-mirror)" stroke={GOLD} strokeWidth=".5" />
        <path d="M70.5 149h13M77 147.5v3" stroke={GOLD} strokeWidth=".4" />
      </g>
      <g className="h-piece" data-k="heels">
        <path d="M85.5 286Q91 280 98 284.5L98 287Q91 287.5 85.5 287.5ZM102.5 284.5Q109 280 114.5 286L114.5 287.5Q109 287.5 102.5 287Z" fill="#6e4fa8" stroke={GOLD} strokeWidth=".4" />
        <path d="M97 287L97.5 293M103 287L102.5 293" stroke="#6e4fa8" strokeWidth=".9" />
      </g>

      {LABELS.map((l) => (
        <text key={l.text} className="h-label" x={l.at[0]} y={l.at[1]} textAnchor="middle" fill="var(--color-lavender)" fontSize="6" letterSpacing="1.6">{l.text}</text>
      ))}

      {/* sparkle when the look is complete */}
      {[[58, 60, 1], [146, 40, 0.7], [150, 170, 0.9], [48, 210, 0.6], [124, 250, 0.5]].map(([x, y, s]) => (
        <path key={x} className="h-sparkle" d={`M${x} ${y - 7 * s}Q${x + 1} ${y - 1} ${x + 7 * s} ${y}Q${x + 1} ${y + 1} ${x} ${y + 7 * s}Q${x - 1} ${y + 1} ${x - 7 * s} ${y}Q${x - 1} ${y - 1} ${x} ${y - 7 * s}Z`} fill="#fff" opacity="0" />
      ))}
    </svg>
  );
}

export default function Hero({ ready }) {
  const root = useRef(null);
  const { askStylist } = useApp();

  // Pin and dress her on scroll. Created on mount (before later pinned sections) so their start
  // positions account for this pin's spacer.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
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
        tl.to(".h-copy", { opacity: 0, y: -30, duration: 0.12 }, 0)
          .to(".h-cue", { opacity: 0, duration: 0.06 }, 0)
          .to(".h-word", { xPercent: -14, duration: 1 }, 0)
          .fromTo(".h-inside", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.14 }, 0.1)
          .to(".h-label", { opacity: 0, duration: 0.08, stagger: 0.18 }, 0.06);

        const pieces = gsap.utils.toArray(".h-piece", root.current);
        PIECES.forEach((p) => {
          const el = pieces.find((n) => n.dataset.k === p.k);
          const b = el.getBBox();
          tl.fromTo(
            el,
            { x: p.at[0] - (b.x + b.width / 2), y: p.at[1] - (b.y + b.height / 2), rotation: p.rotation, scale: p.scale, transformOrigin: "50% 50%" },
            { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.16, ease: "power3.inOut" },
            p.land
          );
        });
        // each landing flashes the arch, and lights its step
        [0.26, 0.44, 0.67, 0.84].forEach((t, k) => {
          tl.fromTo(".h-flash", { opacity: 0 }, { opacity: 0.3, duration: 0.03, yoyo: true, repeat: 1, immediateRender: false }, t - 0.02);
          tl.fromTo(`.h-step:nth-child(${k + 1})`, { opacity: 0.25 }, { opacity: 1, duration: 0.05 }, t - 0.03);
        });
        tl.fromTo(".h-steps", { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.1 }, 0.12)
          .fromTo(".h-sparkle", { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.06, stagger: 0.015, ease: "back.out(3)" }, 0.88)
          .to(".h-sparkle", { opacity: 0.5, duration: 0.04 }, 0.97)
          .to({}, { duration: 0.05 }); // hold the finished look before the page moves on
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // Arrival after the intro curtain: the arch rises into place, the headline lifts through its line
  // masks, the rest follows. Then the arch leans toward the pointer.
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) {
          gsap.set(".h-in, .h-fade, .h-line", { opacity: 1, y: 0, yPercent: 0 });
          gsap.set(".h-label", { opacity: 0 });
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
            ry(nx * 12);
            rx(-ny * 8);
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

        {/* ── The muse ────────────────────────────────────── */}
        <div className="h-in absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 opacity-0 [perspective:1600px] md:top-[56%]">
          <div className="h-tilt [transform-style:preserve-3d]">
            <div className="motion-safe:animate-[float-y_6s_ease-in-out_infinite]">
              <div className="relative aspect-[2/3] w-[min(52vw,34svh)] md:w-[clamp(220px,min(24vw,42svh),380px)]" role="img" aria-label="Illustration of a woman being dressed in a lavender silk gown, cropped jacket, pearls, heels and a clutch">
                {/* the studio: a lit backdrop inside the arch */}
                <div className={`absolute inset-0 overflow-hidden ${ARCH} border border-lavender/25 bg-[radial-gradient(ellipse_at_50%_38%,#3d2d63,#2a1f44_55%,#1b1330)] shadow-[0_40px_90px_-30px_rgba(0,0,0,.85)]`}>
                  <div className="absolute inset-x-[18%] top-0 h-[70%] bg-[radial-gradient(ellipse_at_50%_0%,rgba(233,223,245,.35),transparent_70%)]" />
                  <Muse />
                  <div className="h-flash absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#fff,transparent_70%)] opacity-0" />
                </div>
                <Look />
              </div>
            </div>
          </div>
          {/* floor shadow */}
          <div className="absolute -bottom-12 left-1/2 h-8 w-[80%] -translate-x-1/2 rounded-[50%] bg-black/70 opacity-60 blur-xl" aria-hidden />
        </div>

        {/* ── Opening copy ────────────────────────────────── */}
        <div className="h-copy absolute inset-x-0 top-[112px] z-20 px-[var(--gutter)] md:bottom-14 md:top-auto md:w-[min(40vw,520px)]">
          <p className="h-fade label-sm flex items-center gap-2 text-lavender opacity-0"><Spark className="h-3 w-3" animate={false} /> Season 01 · The Lavender Hour</p>
          <h1 className="mt-4 md:mt-5">
            {["Couture,", "cut for you."].map((t, k) => (
              <span key={t} className={`block overflow-hidden text-[13vw] leading-[0.9] md:text-[min(6vw,11svh)] ${k ? "display-i pb-[0.1em] text-lavender" : "display"}`}>
                <span className="h-line inline-block opacity-0">{t}</span>
              </span>
            ))}
          </h1>
          <p className="h-fade mt-4 hidden max-w-[34ch] text-[14.5px] leading-relaxed text-pearl/70 opacity-0 md:block">
            Every piece is drafted by AI from your measurements, then styled into a complete look. Scroll to dress her.
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

        {/* phone actions sit under the muse */}
        <div className="h-copy absolute inset-x-0 bottom-0 z-20 flex gap-2 px-[var(--gutter)] pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden">
          <a href="#shop" className="h-fade label flex-1 rounded-full bg-pearl py-4 text-center text-plum opacity-0">Shop now</a>
          <button onClick={() => askStylist("Dinner date in London in January")} className="h-fade label ai-glow flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 py-4 opacity-0 backdrop-blur-md">
            <Spark className="h-3.5 w-3.5" /> Style me
          </button>
        </div>

        <div className="h-cue h-fade absolute bottom-10 right-[var(--gutter)] z-20 hidden items-center gap-3 opacity-0 md:flex" aria-hidden>
          <span className="label-sm text-pearl/60">Scroll to dress her</span>
          <span className="relative h-10 w-px overflow-hidden bg-white/15"><span className="absolute inset-x-0 top-0 h-1/2 bg-lavender motion-safe:animate-[float-y_1.6s_ease-in-out_infinite]" /></span>
        </div>

        {/* ── Styling (revealed by scroll) ────────────────── */}
        <div className="h-inside pointer-events-none absolute inset-x-0 top-[112px] z-20 px-[var(--gutter)] opacity-0 md:bottom-14 md:top-auto md:w-[min(34vw,460px)]" aria-hidden>
          <p className="label-sm text-lavender">The fitting</p>
          <p className="display mt-3 text-[10vw] leading-[0.92] md:text-[min(4.6vw,9svh)]">Styled, layer<br /><span className="display-i text-lavender">by layer.</span></p>
        </div>
        <ol className="h-steps pointer-events-none absolute inset-x-0 bottom-6 z-20 grid grid-cols-2 gap-x-4 gap-y-3 px-[var(--gutter)] opacity-0 md:inset-x-auto md:bottom-auto md:right-[var(--gutter)] md:top-1/2 md:w-[min(24vw,300px)] md:-translate-y-1/2 md:grid-cols-1 md:gap-7" aria-label="The look">
          {STEPS.map((s) => (
            <li key={s.n} className="h-step border-t border-white/15 pt-3">
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
