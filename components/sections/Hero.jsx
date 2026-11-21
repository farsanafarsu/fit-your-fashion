"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap"; // ScrollTrigger is registered once in SmoothScroll
import { useLenis } from "../SmoothScroll";

// Boutique hero with a scroll film. The page pins for three screens:
//   1. copy on the left, the boutique scene on the right
//   2. the caped lavender gown (a cut-out copy of the one on the rack) lifts off, swings and glides to centre stage
//   3. the scene recedes, an arch lights up, and a model steps into the gown
//   4. a card offers the look
// The gown starts exactly over its twin on the rack (offsets of the scene box x the percentages below,
// from the crop that boutique-gown.webp was cut from), and lands over the same gown on the model (it is the
// same dress: collar at ~14% of her height, hem at ~97%). Nothing is hard-coded in pixels: resizing re-measures.
// PLACEHOLDER imagery (see public/hero/CREDITS.md).
const COAT_AT = { left: 46.52, top: 16.85, width: 26.4, height: 58.68 }; // % of the scene box
const MODEL = { src: "/hero/model-gown.webp", w: 504, h: 1204 };
const SPOT_AT = { left: 59.7, top: 28.5 }; // the "watch her wear it" hotspot, % of the scene box (on the gown's cape)
// pearls that catch the light: [left %, top %, delay s, duration s]
const SPARKS = [[53, 24, 0, 3.6], [66, 22, 1.1, 4.2], [72, 44, 2.2, 3.4], [51, 57, 0.6, 4.6], [60, 15, 1.8, 3.8], [81, 31, 2.9, 4.4], [31, 38, 1.4, 3.9], [86, 62, 0.3, 4.8], [44, 70, 2.5, 3.5]];
const STEPS = ["On the rack", "Her gown", "On her"];
// [label, icon path]: sparkle, hanger, delivery box
const TRUST = [
  ["AI-predicted sizing", "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"],
  ["Virtual try-on", "M12 6a2 2 0 1 1 2 2c-1 .6-2 1.2-2 2.2M12 10.2 3 17h18z"],
  ["Free shipping above ₹2,999", "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-.1M17 19a1.5 1.5 0 1 0 0-.1"],
];

export default function Hero({ ready }) {
  const root = useRef(null);
  const art = useRef(null);
  const coat = useRef(null);
  const model = useRef(null);
  const spot = useRef(null);
  const steps = useRef([]);
  const pin = useRef(null);
  const lenis = useLenis();

  // the hotspot and the step dots both talk to the pinned film
  const seeOnHer = () => {
    const s = pin.current;
    if (!s) return;
    const y = s.start + (s.end - s.start) * 0.9;
    if (lenis) lenis.scrollTo(y, { duration: 2.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  // The film: one scrubbed, pinned timeline. Built on mount so later pins are measured after this one.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) return; // calm version: the static boutique, nothing pinned

        const a = art.current, c = coat.current, m = model.current;
        // sit the coat over its twin on the rack
        const place = () => {
          Object.assign(c.style, {
            left: `${a.offsetLeft + (a.offsetWidth * COAT_AT.left) / 100}px`,
            top: `${a.offsetTop + (a.offsetHeight * COAT_AT.top) / 100}px`,
            width: `${(a.offsetWidth * COAT_AT.width) / 100}px`,
            height: `${(a.offsetHeight * COAT_AT.height) / 100}px`,
          });
          if (spot.current) {
            spot.current.style.left = `${a.offsetLeft + (a.offsetWidth * SPOT_AT.left) / 100}px`;
            spot.current.style.top = `${a.offsetTop + (a.offsetHeight * SPOT_AT.top) / 100}px`;
          }
        };
        // where she wears it: the rack gown's collar and hem line up with hers
        const landing = () => {
          const mr = m.getBoundingClientRect(), rr = root.current.getBoundingClientRect();
          return { cx: mr.left - rr.left + mr.width / 2, cy: mr.top - rr.top + mr.height * 0.54, h: mr.height * 0.91 };
        };
        place();

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: root.current, start: "top top", end: () => "+=" + window.innerHeight * 3.4, pin: true, scrub: 0.7,
            anticipatePin: 1, invalidateOnRefresh: true, onRefreshInit: place,
            // step dots follow the film: written straight to the DOM, no React render per scroll frame
            onUpdate: (self) => {
              const n = self.progress < 0.1 ? 0 : self.progress < 0.46 ? 1 : 2;
              steps.current.forEach((el, i) => el && (el.dataset.on = i === n ? "1" : "0"));
            },
          },
        });
        tl
          // hand the gown from the scene to its flying copy (explicit from-values so scrolling back restores them)
          .fromTo(".hb-coat", { opacity: 0 }, { opacity: 1, duration: 0.01, ease: "none", immediateRender: false }, 0.01)
          .fromTo(".hb-gownswap", { opacity: 1 }, { opacity: 0, duration: 0.01, ease: "none", immediateRender: false }, 0.01)
          .to(".hb-cue", { autoAlpha: 0, duration: 0.3 }, 0)
          .to(".hb-spot", { autoAlpha: 0, duration: 0.4 }, 0)
          .to(".hb-copy", { xPercent: -14, autoAlpha: 0, duration: 1.1 }, 0.1)
          // 1 → 2: the coat leaves the rack
          .to(".hb-coatswing", { rotation: -9, y: -26, duration: 0.9, ease: "power2.out" }, 0)
          .to(".hb-coatfly", {
            x: () => landing().cx - (c.offsetLeft + c.offsetWidth / 2),
            y: () => landing().cy - (c.offsetTop + c.offsetHeight / 2),
            scale: () => landing().h / c.offsetHeight,
            duration: 2.2,
          }, 0.2)
          .to(".hb-coatswing", { rotation: 6, duration: 1, ease: "power2.inOut" }, 0.9)
          .to(".hb-coatswing", { rotation: 0, y: 0, duration: 0.8, ease: "power2.out" }, 1.9)
          // the boutique steps back
          .to(".hb-artwrap", { autoAlpha: 0.14, scale: 0.93, transformOrigin: "75% 100%", duration: 2 }, 0.3)
          // 3: the arch lights up and she steps into the coat
          .fromTo(".hb-ring", { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 1.3 }, 1.3)
          .to(".hb-model", { opacity: 1, duration: 0.6, ease: "none" }, 2.3)
          .to(".hb-coatfly", { opacity: 0, duration: 0.4, ease: "none" }, 2.7)
          // 4: the look
          .fromTo(".hb-card", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out" }, 3)
          .to({}, { duration: 0.9 }); // hold the last frame before the page moves on
        pin.current = tl.scrollTrigger;
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // Arrival, held back under the preloader: the scene fades up, the copy rises, then the coat appears.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) return;
        gsap.set(".hb-in", { opacity: 0, y: 26 });
        gsap.set(".hb-art, .hb-gownstatic", { opacity: 0 });
        if (!ready) return;
        gsap.timeline({ defaults: { ease: "expo.out" } })
          .to(".hb-art, .hb-gownstatic", { opacity: 1, duration: 1.8 }, 0)
          .to(".hb-in", { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.15);
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
        className="hb-ground on-dark relative isolate h-[100svh] min-h-[640px] overflow-hidden text-white"
        aria-label="Fit Your Fashion — new season"
      >
        {/* ── The boutique scene ──────────────────────────── */}
        <div ref={art} className="hb-artwrap pointer-events-none absolute bottom-0 left-[-9vw] -z-10 aspect-[890/801] w-[118vw] md:left-auto md:right-0 md:w-[min(61vw,104svh)]">
          <Image
            src="/hero/boutique-empty.webp"
            alt="A rail of lavender gowns, a coat and a blazer under a glowing arch, with bags, heels and perfume on plinths"
            fill
            priority
            sizes="(max-width: 767px) 118vw, 61vw"
            className="hb-art object-cover"
          />
          {/* The scene above is the boutique with the caped gown taken off the rack; this puts the gown back
              in its place. On the first bit of scroll the flying copy (.hb-coat) takes over at the same spot,
              so when it lifts away the rack is left with an honest gap, not a second gown. */}
          <div className="hb-gownstatic absolute" style={{ left: `${COAT_AT.left}%`, top: `${COAT_AT.top}%`, width: `${COAT_AT.width}%`, height: `${COAT_AT.height}%` }}>
            {/* inner layer: only the scroll hand-off touches its opacity (the outer one belongs to the arrival
                fade); sharing one property let a refresh mid-page leave the gown hidden when scrolling back */}
            <div className="hb-gownswap relative h-full w-full">
              <Image src="/hero/boutique-gown.webp" alt="" fill priority sizes="300px" className="object-contain" />
            </div>
          </div>
          {/* pearls catching the light (opacity only) */}
          {SPARKS.map(([l, t, d, s], i) => (
            <span key={i} className="hb-twinkle absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_3px_rgba(255,255,255,.85)]" style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${d}s`, animationDuration: `${s}s` }} />
          ))}
        </div>

        {/* the gown that leaves the rack (outer: arrival fade, then flight, then swing) */}
        <div ref={coat} className="hb-coat pointer-events-none absolute z-20 opacity-0" aria-hidden>
          <div className="hb-coatfly h-full w-full">
            <div className="hb-coatswing relative h-full w-full" style={{ transformOrigin: "50% 0%" }}>
              <Image src="/hero/boutique-gown.webp" alt="" fill priority sizes="300px" className="object-contain" />
            </div>
          </div>
        </div>

        {/* ── Centre stage: the arch and the model ────────── */}
        <div className="hb-ring invisible absolute bottom-0 left-1/2 z-10 -ml-[46vw] h-[68svh] w-[92vw] rounded-t-full border-2 border-white/70 shadow-[0_0_80px_rgba(255,255,255,.5),inset_0_0_90px_rgba(255,255,255,.25)] md:-ml-[34svh] md:h-[92svh] md:w-[68svh]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center">
          <div ref={model} className="hb-model relative opacity-0">
            <Image
              src={MODEL.src}
              alt="Model wearing the lavender gown with a hand-beaded pearl cape"
              width={MODEL.w}
              height={MODEL.h}
              sizes="(max-width: 767px) 60vw, 40vw"
              className="h-[62svh] w-auto drop-shadow-[0_26px_34px_rgba(60,30,110,.3)] md:h-[84svh]"
            />
          </div>
        </div>

        {/* ── Copy ────────────────────────────────────────── */}
        <div className="hb-copy relative z-30 flex h-full flex-col px-[var(--gutter)] pt-[calc(97px+2.5svh)] md:justify-center md:pb-[14svh] md:pl-[max(var(--gutter),7.4vw)] md:pt-[97px]">
          <p className="hb-in label flex items-center gap-4 text-[10px] tracking-[0.36em] text-white/90 md:text-[12px]">
            La boutique des dames <span className="h-px w-10 bg-white/70 md:w-14" aria-hidden />
          </p>
          {/* lockup: YOUR FASHION is sized in em so it spans exactly the width of FIT at every size */}
          <h1 className="hb-in mt-[1.6svh] font-[family-name:var(--font-wide)] text-[25vw] font-extrabold uppercase leading-[0.86] md:mt-[3svh] md:text-[min(11.4vw,22svh)]">
            <span className="block tracking-[-0.02em] drop-shadow-[0_10px_30px_rgba(60,30,110,.25)]">Fit</span>
            <span className="mt-[0.08em] block text-[0.19em] leading-none tracking-[0.015em]">Your Fashion</span>
          </h1>
          {/* one loud voice (the lockup), one soft one (the italic line) */}
          <p className="hb-in display-i mt-[2svh] text-[8vw] leading-[1.05] text-mist md:mt-[3svh] md:text-[min(2.9vw,5.6svh)]">Wear the future.</p>
          <p className="hb-in mt-[0.8svh] max-w-[26em] text-[14px] text-white/85 md:mt-[1svh] md:text-[clamp(14px,1.1vw,17px)]">Timeless styles for the modern woman, cut to fit you.</p>

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

          {/* what you get, in one line */}
          <ul className="hb-in mt-[3.6svh] hidden flex-wrap items-center gap-2 text-[12px] text-white md:flex">
            {TRUST.map(([t, d]) => (
              <li key={t} className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 py-1.5 pl-2 pr-3.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-amethyst" aria-hidden>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* hotspot on the gown: opens the film at the moment she's wearing it */}
        {/* (outer: the film fades it out; inner: the arrival fades it in) */}
        <div ref={spot} className="hb-spot absolute z-40 -ml-[18px] -mt-[18px] hidden md:block">
          <button onClick={seeOnHer} className="hb-in flex items-center gap-3" data-cursor="Watch" aria-label="Scroll to see the model wear the gown">
            <span className="relative grid h-9 w-9 place-items-center">
              <span className="absolute inset-0 rounded-full border border-white/85 motion-safe:animate-ping" aria-hidden />
              <span className="h-3 w-3 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,.28)]" />
            </span>
            <span className="label-sm whitespace-nowrap rounded-full bg-white/92 px-3.5 py-2 text-amethyst shadow-[0_12px_30px_-12px_rgba(60,30,110,.7)]">Watch her wear it</span>
          </button>
        </div>

        {/* film steps, following the scroll */}
        {/* right edge, as in the mockup: the active step is bright with a line running down from it */}
        <ol className="hb-in absolute right-[calc(var(--gutter)*0.6)] top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 text-[12px] font-semibold tracking-[0.12em] md:flex" aria-hidden>
          {STEPS.map((s, i) => (
            <li key={s} ref={(el) => (steps.current[i] = el)} data-on={i === 0 ? "1" : "0"} title={s} className="group flex flex-col items-center text-white/45 transition-colors duration-500 data-[on=1]:text-white">
              0{i + 1}
              <span className="mt-0 block h-0 w-px bg-white transition-all duration-500 group-data-[on=1]:mt-2.5 group-data-[on=1]:h-12" />
            </li>
          ))}
        </ol>

        <div className="hb-cue absolute bottom-[max(1.4rem,env(safe-area-inset-bottom))] left-[max(var(--gutter),7.4vw)] z-30 hidden md:block">
          <p className="hb-in label-sm flex items-center gap-3 text-white/90">
            <span className="relative block h-8 w-5 rounded-full border-[1.5px] border-white/80" aria-hidden>
              <span className="hb-wheel absolute left-1/2 top-1.5 h-1.5 w-[3px] -ml-[1.5px] rounded-full bg-white" />
            </span>
            Scroll to dress her
          </p>
        </div>

        {/* ── The look, offered once she's wearing it ─────── */}
        <div className="hb-card invisible absolute inset-x-[var(--gutter)] bottom-[3svh] z-40 rounded-2xl bg-white/92 p-4 text-plum opacity-0 shadow-[0_24px_60px_-20px_rgba(40,20,80,.6)] md:inset-x-auto md:bottom-auto md:right-[6vw] md:top-[38svh] md:w-[290px] md:p-5">
          <p className="label-sm text-amethyst">Look 01 · Season 01</p>
          <p className="display mt-1 text-[24px] leading-tight">The Lavender Pearl-Cape Gown</p>
          <p className="mt-1 text-[13px] text-ink-soft">Satin column gown with a hand-beaded cape. Your size, predicted by AI.</p>
          <div className="mt-3.5 flex gap-2">
            <a href="#shop" className="label-sm flex-1 rounded-full bg-plum py-3 text-center text-pearl transition-colors hover:bg-amethyst" data-cursor="Shop">Shop the look</a>
            <Link href="/dressing-room" className="label-sm flex-1 rounded-full border border-plum/20 py-3 text-center transition-colors hover:border-plum" data-cursor="Try on">Try on</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
