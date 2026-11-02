"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "../SmoothScroll";
import { Button, Spark } from "../ui/primitives";

// Editorial cut-out carousel: giant serif type sits behind two models per look; looks slide
// through with depth. PLACEHOLDER imagery: free Unsplash stock (background removed) until the
// campaign shoot lands — swap the files in /public/models and keep the same shape here.
const LOOKS = [
  {
    id: "ivory",
    name: "Ivory Tailoring",
    line: "Long-line coats and fluid suiting in undyed wool.",
    mood: "soft-power",
    tint: "#EFE8F8",
    front: { src: "/models/ivory-coat.webp", w: 611, h: 1500, alt: "Model in a long ivory coat over wide ivory trousers", credit: "photo-1776273920158-510b171e936f" },
    back: { src: "/models/ivory-suit.webp", w: 515, h: 1500, alt: "Model in a sculpted white jacket and flared white trousers", credit: "photo-1784817552863-e224bc0019e4" },
  },
  {
    id: "sand",
    name: "Soft Power",
    line: "Sand-toned tailoring with an easy, undone shirt.",
    mood: "soft-power",
    tint: "#F1EAF6",
    front: { src: "/models/sand-suit.webp", w: 789, h: 1500, alt: "Model in an oversized sand blazer, white shirt and pleated trousers", credit: "photo-1779406166699-662a041a12a9" },
    back: { src: "/models/slate-suit.webp", w: 626, h: 1500, alt: "Model in a draped slate-grey suit with silver accessories", credit: "photo-1784817552036-84c79ecb2596" },
  },
  {
    id: "midnight",
    name: "Moonlit Evening",
    line: "Embellished midnight suiting, made for after dark.",
    mood: "moonlit",
    tint: "#E6DCF3",
    front: { src: "/models/midnight-embellished.webp", w: 642, h: 1470, alt: "Model in a black suit embroidered with small crystal sprigs and a black cap", credit: "photo-1791291499301-4ea20b8da0c3" },
    back: { src: "/models/noir-blazer.webp", w: 396, h: 1500, alt: "Model in a black blazer dress with sheer socks and loafers", credit: "photo-1779400202112-f1661a4c8637" },
  },
];
const AUTOPLAY_MS = 6500;
const SCROLL_PER_LOOK = 0.85; // viewport heights of scrolling spent on each look while the hero is pinned
const ease = [0.22, 1, 0.36, 1];

function Model({ m, role, dir, priority }) {
  // Front model is tall and centre-right; back model smaller and set behind, left of centre.
  const pos =
    role === "front"
      ? "left-[50%] h-[90%] -translate-x-[34%] sm:left-[52%] sm:h-[84%] sm:-translate-x-[18%] lg:h-[92%]"
      : "left-[50%] h-[64%] -translate-x-[92%] sm:left-[48%] sm:h-[66%] sm:-translate-x-[118%] lg:h-[72%]";
  return (
    <motion.div
      className={`absolute bottom-0 ${pos}`}
      style={{ aspectRatio: `${m.w} / ${m.h}` }}
      initial={{ opacity: 0, x: dir * (role === "front" ? 140 : 90), filter: "blur(14px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 1.25, ease, delay: role === "front" ? 0.08 : 0 } }}
      exit={{ opacity: 0, x: -dir * (role === "front" ? 120 : 70), filter: "blur(10px)", transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
    >
      {/* soft floor shadow */}
      <span className="absolute -bottom-2 left-1/2 h-6 w-[90%] -translate-x-1/2 rounded-[50%] bg-plum/25 blur-xl" aria-hidden />
      <Image
        src={m.src}
        alt={m.alt}
        width={m.w}
        height={m.h}
        priority={priority}
        sizes={role === "front" ? "(max-width: 640px) 60vw, 40vw" : "(max-width: 640px) 40vw, 26vw"}
        className={`relative h-full w-full object-contain object-bottom ${role === "back" ? "brightness-[.97] saturate-[.85]" : ""}`}
        draggable={false}
      />
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

  // Keyboard arrows while the hero has focus.
  const onKey = (e) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };

  // Arrival after the intro curtain; pointer parallax; scroll pull-back.
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) {
          gsap.set(".h-word, .h-fade, .h-arrive", { opacity: 1, yPercent: 0, y: 0 });
          return;
        }
        gsap.timeline()
          .fromTo(".h-word", { yPercent: 110, opacity: 1 }, { yPercent: 0, duration: 1.5, ease: "expo.out", stagger: 0.1 })
          .fromTo(".h-arrive", { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 1.6, ease: "expo.out" }, 0.15)
          .fromTo(".h-fade", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08 }, 0.6);


        if (window.matchMedia("(pointer: fine)").matches) {
          const layers = [[".h-type", -10], [".h-back", 14], [".h-front", 26]].map(([s, k]) => ({
            k,
            x: gsap.quickTo(s, "x", { duration: 1.2, ease: "power3" }),
            y: gsap.quickTo(s, "y", { duration: 1.2, ease: "power3" }),
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
      className="relative h-[100svh] min-h-[620px] overflow-hidden text-plum transition-colors duration-[1400ms]"
      style={{ background: `radial-gradient(120% 90% at 60% 40%, #FFFFFF 0%, ${look.tint} 55%, #D9CCEE 100%)` }}
      aria-roledescription="carousel"
      aria-label="Season 01 looks"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onKeyDown={onKey}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      {/* light leaks + editorial grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-[15%] top-[5%] h-[60vmax] w-[60vmax] rounded-full bg-lavender/45 blur-[120px]" style={{ animation: "haze 14s ease-in-out infinite" }} />
        <div className="absolute -right-[10%] bottom-[-25%] h-[55vmax] w-[55vmax] rounded-full bg-[#f5d9ef]/50 blur-[120px]" style={{ animation: "haze 18s ease-in-out infinite reverse" }} />
        {[25, 50, 75].map((x) => <span key={x} className="absolute inset-y-0 hidden w-px bg-plum/[0.06] md:block" style={{ left: `${x}%` }} />)}
      </div>
      <div className="grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      {/* Type behind the models */}
      <h1 className="h-type pointer-events-none absolute inset-x-0 top-[11%] z-10 px-[var(--gutter)] sm:top-[15%]" aria-label="Wear the future. Before it’s yours.">
        <span className="display block overflow-hidden pb-[0.04em] text-[12.5vw] leading-[0.95] sm:text-[12vw] sm:leading-[0.92] lg:text-[10.5vw]" aria-hidden>
          <span className="h-word inline-block opacity-0">Wear the future.</span>
        </span>
        <span className="display-i block overflow-hidden pb-[0.08em] text-right text-[12.5vw] leading-[0.95] text-amethyst sm:text-[12vw] sm:leading-[0.92] lg:text-[10.5vw]" aria-hidden>
          <span className="h-word inline-block opacity-0">Before it’s yours.</span>
        </span>
      </h1>

      {/* Models */}
      {/* h-stage takes the scroll pull-back, h-arrive the entrance — separate so their transforms never fight */}
      <div className="h-stage absolute inset-x-0 bottom-0 top-[17%] z-20 origin-bottom sm:top-[12%]" aria-live="polite">
       <div className="h-arrive absolute inset-0 opacity-0">
        <div className="h-back absolute inset-0">
          <AnimatePresence initial={false} custom={dir}>
            <Model key={look.id + "-b"} m={look.back} role="back" dir={dir} priority={i === 0} />
          </AnimatePresence>
        </div>
        <div className="h-front absolute inset-0">
          <AnimatePresence initial={false} custom={dir}>
            <Model key={look.id + "-f"} m={look.front} role="front" dir={dir} priority={i === 0} />
          </AnimatePresence>
        </div>
       </div>
        {/* preload the next look so slides never pop in */}
        <div className="hidden" aria-hidden>
          {[LOOKS[(i + 1) % LOOKS.length]].flatMap((l) => [l.front, l.back]).map((m) => (
            <Image key={m.src} src={m.src} alt="" width={m.w} height={m.h} sizes="40vw" loading="eager" />
          ))}
        </div>
      </div>

      {/* Outline echo of the italic line passes in front of the models */}
      {/* identical box model to the h1 so the outline sits exactly on the filled line */}
      <p className="h-type pointer-events-none absolute inset-x-0 top-[13%] z-30 hidden px-[var(--gutter)] sm:top-[15%] md:block" aria-hidden>
        <span className="display invisible block overflow-hidden pb-[0.04em] text-[12.5vw] leading-[0.95] sm:text-[12vw] sm:leading-[0.92] lg:text-[10.5vw]">
          <span className="inline-block">Wear the future.</span>
        </span>
        <span className="display-i block overflow-hidden pb-[0.08em] text-right text-[12.5vw] leading-[0.95] text-transparent sm:text-[12vw] sm:leading-[0.92] lg:text-[10.5vw]" style={{ WebkitTextStroke: "1px rgba(110,79,168,.5)" }}>
          <span className="h-word inline-block opacity-0">Before it’s yours.</span>
        </span>
      </p>

      {/* Bottom fade so copy stays legible over the models on small screens */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[34%] bg-gradient-to-t from-pearl via-pearl/80 to-transparent md:h-[28%] md:from-pearl/90 md:via-pearl/30" aria-hidden />

      {/* Copy + CTAs */}
      <div className="absolute inset-x-0 bottom-0 z-40 px-[var(--gutter)] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-8 md:pb-10">
        <div className="flex flex-col-reverse gap-3 sm:gap-5 md:flex-row md:items-end md:justify-between">
          <div className="sm:max-w-[340px] md:max-xl:-m-4 md:max-xl:rounded-2xl md:max-xl:bg-pearl/65 md:max-xl:p-4 md:max-xl:backdrop-blur-md">
            <p className="h-fade label hidden items-center gap-2 text-amethyst opacity-0 sm:flex">
              <Spark className="h-3.5 w-3.5" /> Season 01 · The Lavender Hour
            </p>
            <p className="h-fade mt-3 hidden text-[14px] leading-relaxed text-ink-soft opacity-0 sm:block">
              Couture-grade tailoring, cut by hand and fitted by intelligence. Try every look on your own avatar.
            </p>
            <div className="h-fade flex flex-col gap-2.5 opacity-0 sm:mt-5 sm:flex-row sm:flex-wrap [&_a]:w-full [&>span]:w-full sm:[&_a]:w-auto sm:[&>span]:w-auto">
              <Button as="a" href="/dressing-room" ai className="justify-center" data-cursor="Enter">
                Enter the AI Dressing Room
              </Button>
              <span className="hidden sm:inline-block">
                <Button as="a" href="#collection" variant="ghost" className="justify-center text-plum" data-cursor="View">
                  Explore the Collection
                </Button>
              </span>
            </div>
          </div>

          {/* Look controls */}
          <div className="h-fade flex items-center justify-between gap-4 opacity-0 md:flex-col md:items-end">
            <div className="min-w-0 md:text-right md:max-xl:rounded-2xl md:max-xl:bg-pearl/65 md:max-xl:p-4 md:max-xl:backdrop-blur-md">
              <p className="label-sm text-plum/60">
                Look {String(i + 1).padStart(2, "0")} / {String(LOOKS.length).padStart(2, "0")}
              </p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={look.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease }}>
                  <p className="display mt-1 truncate text-[23px] leading-none sm:text-[32px]">{look.name}</p>
                  <p className="mt-1.5 hidden max-w-[260px] text-[12px] text-ink-soft md:block">{look.line}</p>
                  <a href={`/dressing-room?mood=${look.mood}`} className="label-sm mt-2 hidden items-center gap-1.5 py-1 text-amethyst hover:text-plum md:inline-flex" data-cursor="Style">
                    <Spark className="h-3 w-3" animate={false} /> Style me in this mood →
                  </a>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="mr-1 hidden items-center gap-1.5 sm:flex" role="tablist" aria-label="Choose a look">
                {LOOKS.map((l, n) => (
                  <button key={l.id} role="tab" aria-selected={n === i} aria-label={l.name} onClick={() => goTo(n)} className="group grid h-11 w-9 place-items-center">
                    <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-plum/15">
                      {pinned ? (
                        // scroll-driven: bars fill as you scroll through each look
                        <span className="absolute inset-y-0 left-0 rounded-full bg-amethyst" style={{ width: n < i ? "100%" : n === i ? `${Math.max(8, progress * 100)}%` : "0%" }} />
                      ) : (
                        n === i && (
                          <span
                            key={`${i}-${playing && !hover}`}
                            className="absolute inset-y-0 left-0 rounded-full bg-amethyst"
                            style={{ width: playing && !hover ? undefined : "100%", animation: playing && !hover ? `hero-progress ${AUTOPLAY_MS}ms linear forwards` : "none" }}
                          />
                        )
                      )}
                    </span>
                  </button>
                ))}
              </div>
              {pinned ? (
                <span className="label-sm hidden items-center gap-2 px-2 text-plum/60 lg:flex" aria-hidden>
                  Scroll <span className="block h-6 w-px animate-pulse bg-plum/40" />
                </span>
              ) : (
                <button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause slideshow" : "Play slideshow"} className="grid h-11 w-11 place-items-center rounded-full text-[11px] text-plum/70 hover:bg-white/60">
                  {playing ? "❚❚" : "▶"}
                </button>
              )}
              <button onClick={() => go(-1)} aria-label="Previous look" className="grid h-12 w-12 place-items-center rounded-full border border-plum/20 bg-white/50 backdrop-blur transition hover:bg-plum hover:text-pearl" data-cursor="Prev">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <button onClick={() => go(1)} aria-label="Next look" className="grid h-12 w-12 place-items-center rounded-full bg-plum text-pearl transition hover:bg-amethyst" data-cursor="Next">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <span className="label-sm pointer-events-none absolute right-[var(--gutter)] top-[86px] z-40 hidden rounded-full bg-white/60 px-2.5 py-1 text-[10px] text-plum/60 backdrop-blur sm:block">
        Placeholder · Unsplash stock models
      </span>
    </section>
    </div>
  );
}
