"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useLenis } from "./SmoothScroll";
const NAME = "FIT YOUR FASHION";

// Line-art garments for the opening rail, each drawn on a 100×140 hanger with the hook at (50, 2).
const HANGER = "M50 2c5 0 7 3 7 6c0 4-4 5-7 7v5M50 20L12 34H88Z";
const GARMENTS = [
  { name: "dress", fill: "var(--color-lavender)", d: "M38 32Q50 40 62 32L70 35L64 60Q60 67 62 72L82 132Q50 140 18 132L38 72Q40 67 36 60L30 35Z", detail: "M36 72Q50 77 64 72" },
  { name: "blazer", fill: "var(--color-plum)", d: "M34 32L50 52L66 32L86 39L92 114L76 116L72 70L72 128H28L28 70L24 116L8 114L14 39Z", detail: "M50 52L43 84M50 52L57 84M50 92v.5M50 104v.5" },
  { name: "blouse", fill: "var(--color-mist)", d: "M38 32Q50 42 62 32L88 43L80 64L70 58L72 120H28L30 58L20 64L12 43Z", detail: "M50 40v78" },
  { name: "skirt", fill: "var(--color-amethyst)", d: "M28 36H72L90 128Q50 136 10 128Z", detail: "M40 36L31 129M50 36V132M60 36L69 129" },
  { name: "trench", fill: "var(--color-lavender)", d: "M34 32L50 48L66 32L84 39L90 104L76 106L74 70L76 136H24L26 70L24 106L10 104L16 39Z", detail: "M26 84H74M50 48V136" },
];

// Module state lives for one page load: the opening plays on every load/refresh, but not again when
// the visitor navigates back to the homepage inside the site.
let playedThisLoad = false;

// Opening (every page load, ~4.5s): a lavender point opens into concentric circle wipes —
// plum, lavender, pearl — the wordmark rises and a clothes rail swings in beneath it, each garment
// sketching itself in line before it fills with colour. Once
// the page has loaded, the wordmark glides into the header logo's place while the curtain lifts.
export default function Intro({ onDone }) {
  const root = useRef(null);
  const [gone, setGone] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (gone) lenis?.start();
    else lenis?.stop();
  }, [lenis, gone]);

  useEffect(() => {
    if (playedThisLoad) {
      setGone(true);
      onDone?.();
      return;
    }
    const q = gsap.utils.selector(root);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // marked on finish, not start: strict mode re-runs this effect once in development
    const finish = () => {
      playedThisLoad = true;
      setGone(true);
    };
    const loaded = new Promise((r) => {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", r, { once: true });
      setTimeout(r, 6000); // never hold the page hostage to a slow asset
    });
    let exiting = false;
    let intro;

    // The wordmark flies to wherever the header's wordmark actually is, and takes on its colour.
    const exit = () => {
      if (exiting) return;
      exiting = true;
      intro?.progress(1);
      onDone?.();
      const word = q(".word")[0];
      const target = document.querySelector('header a[aria-label="Fit Your Fashion home"] span');
      const a = word.getBoundingClientRect();
      const b = target?.getBoundingClientRect();
      const t = gsap.timeline({ onComplete: finish });
      t.to(q(".fade-out"), { opacity: 0, y: -12, duration: 0.45, ease: "power2.in" }, 0)
        .to(q(".stage"), { clipPath: "inset(0% 0% 100% 0%)", duration: 1.15, ease: "expo.inOut" }, 0.15);
      if (b && b.width) {
        t.to(word, {
          x: b.left + b.width / 2 - (a.left + a.width / 2),
          y: b.top + b.height / 2 - (a.top + a.height / 2),
          scale: b.width / a.width,
          color: getComputedStyle(target).color,
          duration: 1.15,
          ease: "expo.inOut",
        }, 0.1).to(word, { opacity: 0, duration: 0.25 }, 1.2);
      } else t.to(word, { opacity: 0, duration: 0.4 }, 0.2);
    };

    if (reduce) {
      gsap.set(q(".circle"), { scale: 1 });
      gsap.set(q(".ch, .tag, .rail, .garment, .g-fill"), { opacity: 1 });
      gsap.set(q(".rail"), { scaleX: 1 });
      Promise.all([loaded, new Promise((r) => setTimeout(r, 900))]).then(() => {
        onDone?.();
        gsap.to(root.current, { opacity: 0, duration: 0.5, onComplete: finish });
      });
    } else {
      const count = { v: 0 };
      intro = gsap.timeline();
      intro
        .fromTo(q(".dot"), { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, 0.1)
        .to(q(".dot"), { scale: 1.7, opacity: 0.55, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.6)
        .fromTo(q(".c1"), { scale: 0 }, { scale: 1, duration: 1.1, ease: "expo.inOut" }, 0.55)
        .fromTo(q(".c2"), { scale: 0 }, { scale: 1, duration: 1.05, ease: "expo.inOut" }, 1.0)
        .fromTo(q(".c3"), { scale: 0 }, { scale: 1, duration: 1.05, ease: "expo.inOut" }, 1.4)
        .fromTo(q(".ch"), { yPercent: 115, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.035 }, 2.0)
        .fromTo(q(".tag"), { opacity: 0, letterSpacing: "0.8em" }, { opacity: 1, letterSpacing: "0.42em", duration: 1.1, ease: "expo.out" }, 2.4)
        .fromTo(q(".rail"), { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.8, ease: "expo.inOut" }, 2.2)
        // hangers drop onto the rail and swing to rest from the hook
        .fromTo(q(".garment"), { y: -60, rotation: (i) => (i % 2 ? 14 : -14), opacity: 0 },
          { y: 0, rotation: 0, opacity: 1, duration: 1.4, ease: "elastic.out(1, 0.45)", stagger: 0.11 }, 2.5)
        .fromTo(q(".g-line"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: 0.05 }, 2.55)
        .fromTo(q(".g-fill"), { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.out", stagger: 0.11 }, 3.4)
        .to(q(".garment"), { rotation: (i) => (i % 2 ? -2.5 : 2.5), duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: 1, stagger: 0.08 }, 3.9)
        .fromTo(q(".meta"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.4)
        .to(count, { v: 100, duration: 4.4, ease: "power1.inOut", onUpdate: () => { const n = q(".count")[0]; if (n) n.textContent = String(Math.round(count.v)).padStart(3, "0"); } }, 0)
        .addLabel("signed", 4.9);
      // leave once both the signing has finished and the page has loaded
      Promise.all([new Promise((r) => intro.eventCallback("onComplete", r)), loaded]).then(exit);
    }

    const skip = (e) => {
      if (e.type === "keydown" && e.key !== "Escape" && e.key !== "Enter") return;
      if (!reduce) exit();
    };
    window.addEventListener("keydown", skip);
    root.current?.addEventListener("click", skip);
    return () => {
      intro?.kill();
      window.removeEventListener("keydown", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;
  // centred with the `translate` property; GSAP owns `transform` (scale), so the two never fight
  const circle = "circle absolute left-1/2 top-1/2 h-[170vmax] w-[170vmax] -translate-x-1/2 -translate-y-1/2 rounded-full";
  const hidden = { transform: "scale(0)" };
  return (
    <div ref={root} className="fixed inset-0 z-[250] overflow-hidden" role="presentation" data-cursor="Skip">
      {/* curtain: pearl ground + concentric wipes */}
      <div className="stage absolute inset-0 overflow-hidden bg-pearl" style={{ clipPath: "inset(0% 0% 0% 0%)" }}>
        <div className={`${circle} c1 bg-plum`} style={hidden} />
        <div className="dot absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender shadow-[0_0_40px_10px_rgba(201,182,228,.6)]" style={hidden} />
        <div className={`${circle} c2 bg-lavender`} style={hidden} />
        <div className={`${circle} c3 bg-pearl`} style={hidden} />
      </div>

      {/* lockup: wordmark + signature */}
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="relative flex flex-col items-center text-plum">
          <div className="word whitespace-nowrap will-change-transform" aria-hidden>
            <span className="display flex overflow-hidden text-[7vw] tracking-[0.12em] sm:text-[min(5.6vw,72px)] sm:tracking-[0.22em]">
              {NAME.split("").map((c, i) => (
                <span key={i} className="ch inline-block opacity-0">{c === " " ? " " : c}</span>
              ))}
            </span>
          </div>
          <p className="tag fade-out label-sm mt-2 text-[9px] text-amethyst opacity-0 sm:text-[11px]">AI couture atelier</p>
          <div className="fade-out relative mt-8 w-[min(86vw,620px)] sm:mt-10" aria-hidden>
            <div className="rail h-[3px] origin-left rounded-full bg-plum opacity-0" style={{ transform: "scaleX(0)" }} />
            <div className="-mt-[2px] flex justify-between px-[4%]">
              {GARMENTS.map((g) => (
                <svg key={g.name} viewBox="0 0 100 140" className="garment w-[17%] overflow-visible opacity-0" style={{ transformOrigin: "50% 1.4%" }}>
                  <path className="g-fill" d={g.d} fill={g.fill} fillOpacity={g.fill.includes("plum") ? 0.9 : 0.75} opacity="0" />
                  <path className="g-line" d={HANGER} pathLength="1" strokeDasharray="1" fill="none" stroke="var(--color-plum)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <path className="g-line" d={g.d} pathLength="1" strokeDasharray="1" fill="none" stroke="var(--color-plum)" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <path className="g-line" d={g.detail} pathLength="1" strokeDasharray="1" fill="none" stroke={g.fill.includes("plum") ? "var(--color-lavender)" : "var(--color-plum)"} strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="meta fade-out absolute inset-x-0 bottom-6 flex items-end justify-between px-6 text-plum/60 opacity-0 sm:px-10">
        <span className="label-sm flex items-baseline gap-2">
          <span className="count display text-[22px] tabular-nums tracking-normal text-plum">000</span>
          Season 01
        </span>
        <span className="label-sm text-[10px]">Click or press Esc to skip</span>
      </div>
    </div>
  );
}
