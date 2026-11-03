"use client";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { byId, formatPrice } from "@/lib/catalog";
import { predictSize } from "@/lib/sizing";
import { useApp } from "@/lib/store";
import { useLenis } from "../SmoothScroll";
import { Spark } from "../ui/primitives";

// Full-bleed editorial split: each look is a diptych of two campaign frames edge to edge, a slow
// camera push on both, curtain wipes between looks and one quiet line of controls. Garments that
// are in the catalogue carry a hotspot with the visitor's predicted size. Scroll drives the looks
// while the hero is pinned. PLACEHOLDER imagery: Unsplash stock until the campaign shoot
// (see public/products/CREDITS.md and public/editorial/CREDITS.md).
const LOOKS = [
  {
    id: "moonlit", name: "Moonlit Evening", line: "Shimmer cut on the bias, for the hour after dusk.",
    title: ["Wear the future.", "Before it’s yours."],
    ask: "Dinner date in London in January",
    frames: [
      { src: "/products/aurora-gown.webp", pos: "50% 0%", product: "aurora-gown", spot: [50, 40], alt: "Model in a shimmering violet gown with a high slit" },
      { src: "/editorial/silver-gown.webp", pos: "50% 6%", alt: "Model in a silver evening gown in a dim restaurant" },
    ],
  },
  {
    id: "soft-power", name: "Soft Power", line: "Wide trousers, sharp shoulders, nothing to prove.",
    title: ["Power, softly.", "Tailored to you."],
    ask: "A pitch meeting, I want to look powerful",
    frames: [
      { src: "/products/vesper-trouser.webp", pos: "50% 0%", product: "vesper-trouser", spot: [50, 47], alt: "Model in a white shirt and black wide-leg trousers" },
      { src: "/products/nocturne-blazer.webp", pos: "50% 18%", product: "nocturne-blazer", spot: [56, 57], alt: "Model in an oversized black blazer and sunglasses" },
    ],
  },
  {
    id: "bridal", name: "Bridal Lavender", line: "Silk drape and heirloom colour for the ceremony.",
    title: ["Heirlooms, reborn.", "For your forever."],
    ask: "I have a wedding in Kochi in December, I love lavender",
    frames: [
      { src: "/products/mist-drape.webp", pos: "50% 4%", product: "mist-drape", spot: [60, 44], alt: "Model in a magenta and black silk saree" },
      { src: "/products/halo-cape.webp", pos: "50% 22%", product: "halo-cape", spot: [38, 40], alt: "Bride holding a long sheer veil in a forest" },
    ],
  },
  {
    id: "off-duty", name: "Off-Duty Muse", line: "A liquid slip and soft knit, worn like a secret.",
    title: ["Ease, worn well.", "Like a secret."],
    ask: "Something off-duty for a weekend in Bangalore",
    frames: [
      { src: "/products/lune-slip.webp", pos: "50% 40%", product: "lune-slip", spot: [52, 44], alt: "Model in a black satin slip dress against stone" },
      { src: "/products/cloud-knit.webp", pos: "50% 22%", alt: "Model in a grey knit sweater among dark trees" },
    ],
  },
];
const AUTOPLAY_MS = 7000;
const SCROLL_PER_LOOK = 0.55; // viewport heights of scrolling spent on each look while the hero is pinned
const ease = [0.22, 1, 0.36, 1];
const curtain = [0.76, 0, 0.24, 1];
const pad = (n) => String(n).padStart(2, "0");

// The shoppable point on a garment: pulses until opened, then shows the piece in the visitor's size.
function Hotspot({ id, spot: [x, y] }) {
  const { body, returnHistory, addToBag, bag } = useApp();
  const [open, setOpen] = useState(false);
  const p = byId(id);
  const fit = predictSize(p, body, returnHistory);
  const inBag = bag.some((b) => b.id === p.id);
  return (
    <div className="absolute z-20 hidden sm:block" style={{ left: `${x}%`, top: `${y}%` }} onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)} onPointerLeave={() => setOpen(false)}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Shop ${p.name}`} className="relative -ml-5 -mt-5 grid h-10 w-10 place-items-center" data-cursor="Shop">
        <span className="absolute inset-1 rounded-full border border-white/70 motion-safe:animate-ping" aria-hidden />
        <span className="relative h-3 w-3 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,.18)]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.35, ease }}
            className={`absolute top-1/2 w-[232px] -translate-y-1/2 rounded-2xl bg-pearl/95 p-3.5 text-plum shadow-[0_24px_60px_-20px_rgba(0,0,0,.6)] backdrop-blur-xl ${x > 55 ? "right-6" : "left-6"}`}
          >
            <p className="label-sm text-amethyst">In this look</p>
            <p className="display mt-1 text-[21px] leading-tight">{p.name}</p>
            <p className="mt-1 text-[12px] text-ink-soft">{p.fabric} · {formatPrice()}</p>
            <p className="label-sm mt-2.5 flex items-center gap-1.5 text-amethyst"><Spark className="h-3 w-3" animate={false} /> Your size {fit.size} · {Math.round(fit.confidence * 100)}%</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => addToBag(p.id, fit.size)} className="label-sm flex-1 rounded-full bg-plum py-2.5 text-pearl hover:bg-amethyst">{inBag ? "In bag ✓" : "Add"}</button>
              <Link href={`/dressing-room?look=${p.id}`} className="label-sm flex-1 rounded-full border border-plum/20 py-2.5 text-center hover:border-plum">Try on</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// One half of the diptych. New looks wipe up over the old one; the photo settles from a push-in.
function Frame({ f, dir, delay, priority, className }) {
  return (
    <motion.div
      className={`absolute inset-0 overflow-hidden ${className}`}
      initial={{ clipPath: dir > 0 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }}
      animate={{ clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 1.25, ease: curtain, delay } }}
      exit={{ opacity: 1, transition: { duration: 1.3 + delay } }}
    >
      <motion.div className="absolute inset-0" initial={{ scale: 1.2 }} animate={{ scale: 1.04, transition: { duration: 7, ease: [0.16, 1, 0.3, 1], delay } }}>
        <Image src={f.src} alt={f.alt} fill priority={priority} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" style={{ objectPosition: f.pos }} />
      </motion.div>
      {f.product && <Hotspot id={f.product} spot={f.spot} />}
    </motion.div>
  );
}

export default function Hero({ ready }) {
  const root = useRef(null);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false); // scroll drives the looks (motion allowed)
  const [progress, setProgress] = useState(0); // progress within the current look's scroll stretch
  const touch = useRef(null);
  const pin = useRef(null);
  const idx = useRef(0);
  const lenis = useLenis();
  const { askStylist } = useApp();
  const reduce = useReducedMotion();
  const look = LOOKS[i];

  const show = useCallback((n) => {
    if (n === idx.current) return;
    setDir(n > idx.current ? 1 : -1);
    idx.current = n;
    setI(n);
  }, []);

  // While pinned, controls scroll to the look's stretch so the page and the carousel never disagree.
  const goTo = useCallback(
    (n) => {
      const st = pin.current;
      if (!st) return show((n + LOOKS.length) % LOOKS.length);
      const clamped = Math.max(0, Math.min(LOOKS.length, n)); // n === length → continue past the hero
      // land just inside the look's stretch (the very top for the first look, past the pin for "next" on the last)
      const at = clamped > 0 && clamped < LOOKS.length ? clamped + 0.12 : clamped;
      const y = st.start + ((st.end - st.start) * at) / LOOKS.length;
      if (lenis) lenis.scrollTo(y, { duration: 1.2 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    },
    [lenis, show]
  );
  const go = useCallback((d) => goTo(idx.current + d), [goTo]);

  // Pin the hero and map scroll to looks. Created on mount (before later pinned sections) so their
  // start positions account for this pin's spacer.
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: () => "+=" + window.innerHeight * SCROLL_PER_LOOK * LOOKS.length,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const raw = self.progress * LOOKS.length;
          show(Math.min(LOOKS.length - 1, Math.floor(raw)));
          setProgress(Math.min(1, raw - Math.min(LOOKS.length - 1, Math.floor(raw))));
        },
      });
      pin.current = st;
      setPinned(true);
      return () => {
        pin.current = null;
        setPinned(false);
        st.kill();
      };
    });
    return () => mm.revert();
  }, [show]);

  // Autoplay only when scroll isn't driving the looks (reduced motion turns both off).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);
  useEffect(() => {
    if (pinned || !ready || !playing || hover) return;
    const t = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [i, ready, playing, hover, go, pinned]);

  const onKey = (e) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  // Arrival after the intro curtain: the two frames rise, the headline lifts in, the controls follow.
  // Then a slight pointer drift between the halves and the type.
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) {
          gsap.set(".h-fade, .h-arrive", { opacity: 1, y: 0, clipPath: "none" });
          return;
        }
        // (the headline itself rises with framer once `ready`, so it can also swap per look)
        gsap.timeline()
          .fromTo(".h-arrive", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.inOut", stagger: 0.08 }, 0)
          .fromTo(".h-fade", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.05 }, 0.5);

        if (window.matchMedia("(pointer: fine)").matches) {
          const layers = [[".h-left", 10], [".h-right", -10], [".h-type", -14]].map(([s, k]) => ({
            k,
            x: gsap.quickTo(s, "x", { duration: 1.4, ease: "power3" }),
            y: gsap.quickTo(s, "y", { duration: 1.4, ease: "power3" }),
          }));
          const move = (e) => {
            const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
            layers.forEach((l) => { l.x(nx * l.k); l.y(ny * l.k * 0.5); });
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
      <section
        ref={root}
        data-hero
        className="on-dark relative h-[100svh] min-h-[620px] overflow-hidden bg-plum text-pearl"
        aria-roledescription="carousel"
        aria-label="Season 01 looks"
        onKeyDown={onKey}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerLeave={() => setHover(false)}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {/* ── Diptych ─────────────────────────────────────── */}
        {/* starts below the floating header so the nav never sits over a face */}
        <div className="absolute inset-x-0 bottom-0 top-[97px] grid md:grid-cols-2 md:gap-px" aria-live="polite">
          {[0, 1].map((side) => (
            <div key={side} className={`h-arrive relative overflow-hidden bg-plum-2 ${side ? "hidden md:block" : ""}`}>
              {/* oversized so the pointer drift never shows an edge */}
              <div className={`${side ? "h-right" : "h-left"} absolute -inset-4`}>
                <AnimatePresence initial={false}>
                  <Frame key={look.id} f={look.frames[side]} dir={dir} delay={side * 0.12} priority={i === 0} />
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
        {/* hidden preload of the next look so wipes never reveal a blank frame */}
        <div className="hidden" aria-hidden>
          {LOOKS[(i + 1) % LOOKS.length].frames.map((f) => <Image key={f.src} src={f.src} alt="" width={900} height={1350} sizes="50vw" loading="eager" />)}
        </div>

        {/* light: header scrim, cinematic floor fade, vignette, grain */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-x-0 top-[97px] h-32 bg-gradient-to-b from-[#120c1f]/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#120c1f] via-[#120c1f]/60 to-transparent md:h-[58%]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(18,12,31,.45)_100%)]" />
        </div>
        <div className="grain pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        {/* season line under the header (left only: the right half's face can sit near the top) */}
        <div className="h-fade absolute left-[var(--gutter)] top-[117px] z-20 opacity-0">
          <p className="label-sm flex items-center gap-2 text-pearl/80"><Spark className="h-3 w-3" animate={false} /> Season 01 · The Lavender Hour</p>
        </div>
        <p className="h-fade label-sm absolute bottom-3 right-[var(--gutter)] z-20 hidden text-[9px] text-pearl/35 opacity-0 md:block">Placeholder imagery · Unsplash</p>

        {/* ── Type + controls ─────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-[var(--gutter)] pb-[max(1.25rem,env(safe-area-inset-bottom))] md:pb-10">
          {/* each look has its own headline: the old one lifts out through its line masks, the new one rises in */}
          <h1 className="h-type" aria-label={look.title.join(" ")}>
            <AnimatePresence mode="wait">
              <motion.span key={look.id} className="block" initial="hidden" animate={ready ? "shown" : "hidden"} exit="gone" aria-hidden>
                {look.title.map((text, k) => (
                  <span
                    key={k}
                    className={`block overflow-hidden text-[12vw] leading-[0.86] sm:text-[11vw] lg:text-[min(9.4vw,17svh)] ${k ? "display-i pb-[0.12em] text-lavender sm:pl-[1.2em]" : "display pb-[0.05em]"}`}
                  >
                    <motion.span
                      className="inline-block whitespace-nowrap"
                      variants={{
                        hidden: { yPercent: reduce ? 0 : 115, opacity: reduce ? 0 : 1 },
                        shown: { yPercent: 0, opacity: 1, transition: { duration: reduce ? 0.3 : 1.1, ease, delay: reduce ? 0 : 0.1 + k * 0.09 } },
                        gone: { yPercent: reduce ? 0 : -110, opacity: reduce ? 0 : 1, transition: { duration: reduce ? 0.2 : 0.5, ease: curtain, delay: k * 0.05 } },
                      }}
                    >
                      {text}
                    </motion.span>
                  </span>
                ))}
              </motion.span>
            </AnimatePresence>
          </h1>

          <div className="mt-5 flex flex-col gap-5 border-t border-white/15 pt-5 md:mt-7 md:flex-row md:items-end md:justify-between md:gap-10 md:pt-6">
            {/* current look + actions */}
            <div className="h-fade flex flex-col gap-4 opacity-0 sm:flex-row sm:items-center sm:gap-8">
              <div className="min-w-0 sm:w-[300px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={look.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease, delay: 0.35 } }} exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}>
                    <p className="label-sm text-lavender">Look {pad(i + 1)} · {look.name}</p>
                    <p className="mt-1.5 text-[13.5px] leading-snug text-pearl/70">{look.line}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex gap-2">
                <a href="#shop" className="label flex-1 rounded-full bg-pearl px-7 py-4 text-center text-plum transition-colors hover:bg-lavender sm:flex-none" data-cursor="Shop">Shop now</a>
                <button onClick={() => askStylist(look.ask)} className="label ai-glow flex flex-1 items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-4 backdrop-blur-md transition-colors hover:bg-white/20 sm:flex-none" data-cursor="Ask">
                  <Spark className="h-3.5 w-3.5" /> Style me
                </button>
              </div>
            </div>

            {/* look index */}
            <div className="h-fade flex items-center gap-4 opacity-0 md:gap-6">
              <div className="flex min-w-0 flex-1 gap-3 md:w-[clamp(320px,36vw,560px)] md:flex-none" role="tablist" aria-label="Choose a look">
                {LOOKS.map((l, n) => (
                  <button key={l.id} role="tab" aria-selected={n === i} aria-label={l.name} onClick={() => goTo(n)} className="group min-w-0 flex-1 text-left">
                    <span className="relative block h-[2px] overflow-hidden rounded-full bg-white/20">
                      {pinned ? (
                        // scroll-driven: bars fill as you scroll through each look
                        <span className="absolute inset-y-0 left-0 bg-pearl" style={{ width: n < i ? "100%" : n === i ? `${Math.max(6, progress * 100)}%` : "0%" }} />
                      ) : (
                        n === i && (
                          <span
                            key={`${i}-${playing && !hover}`}
                            className="absolute inset-y-0 left-0 bg-pearl"
                            style={{ width: playing && !hover ? undefined : "100%", animation: playing && !hover ? `hero-progress ${AUTOPLAY_MS}ms linear forwards` : "none" }}
                          />
                        )
                      )}
                    </span>
                    <span className={`label-sm mt-2.5 hidden truncate text-[10px] transition-colors md:block ${n === i ? "text-pearl" : "text-pearl/40 group-hover:text-pearl/75"}`}>
                      {pad(n + 1)} {l.name}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex shrink-0 gap-2">
                {!pinned && (
                  <button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause slideshow" : "Play slideshow"} className="grid h-11 w-11 place-items-center rounded-full text-[10px] text-pearl/70 hover:bg-white/10">
                    {playing ? "❚❚" : "▶"}
                  </button>
                )}
                <button onClick={() => go(-1)} aria-label="Previous look" className="grid h-11 w-11 place-items-center rounded-full border border-white/25 transition hover:bg-pearl hover:text-plum" data-cursor="Prev">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <button onClick={() => go(1)} aria-label="Next look" className="grid h-11 w-11 place-items-center rounded-full border border-white/25 transition hover:bg-pearl hover:text-plum" data-cursor="Next">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
