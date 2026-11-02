"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { byId, PRODUCTS } from "@/lib/catalog";
import ProductCard from "../ProductCard";
import SilkFilm from "../ui/SilkFilm";
import Dial from "../ui/Dial";
import { ChapterLabel, Spark } from "../ui/primitives";

// Chapter 01: a continuous editorial strip. On desktop it is pinned and travels sideways with
// scroll — giant outline type drifts behind at a slower speed, panels unmask as they enter, images
// counter-drift inside their frames, and the whole strip leans with scroll velocity.
// On touch/mobile it's a native swipe row with snap.

// Panel sizes are capped by viewport height so every panel fits the pinned screen on landscape tablets.
const CARD_W = { s: "w-[62vw] sm:w-[38vw] md:w-[min(30vw,36svh)] lg:w-[min(18vw,36svh)]", m: "w-[70vw] sm:w-[44vw] md:w-[min(36vw,42svh)] lg:w-[min(22vw,42svh)]", l: "w-[78vw] sm:w-[50vw] md:w-[min(42vw,46svh)] lg:w-[min(26vw,46svh)]" };
const ALIGN = { top: "md:self-start md:mt-[11svh]", mid: "md:self-center", bottom: "md:self-end md:mb-[15svh]" };

function Panel({ children, className = "", align = "mid" }) {
  return (
    <div className={`c-panel shrink-0 snap-center ${ALIGN[align]} ${className}`}>
      <div className="c-skew h-full origin-bottom">{children}</div>
    </div>
  );
}

function Card({ id, size = "m", align = "mid", tilt = 0, aspect = "aspect-[3/4]" }) {
  const p = byId(id);
  return (
    <Panel align={align} className={CARD_W[size]}>
      <div className="c-reveal" style={{ rotate: `${tilt}deg` }}>
        <ProductCard product={p} index={PRODUCTS.indexOf(p)} aspect={aspect} />
      </div>
    </Panel>
  );
}

// Model in an arch frame — the hero's cut-outs reappear as editorial plates.
function Arch({ src, w, h, look, name, dark = false, align = "mid" }) {
  return (
    <Panel align={align} className="w-[72vw] sm:w-[46vw] md:w-[min(34vw,40svh)] lg:w-[min(24vw,40svh)]">
      <figure>
        <div className={`c-reveal relative aspect-[3/4.4] overflow-hidden rounded-t-full ${dark ? "bg-gradient-to-b from-plum-2 to-plum" : "bg-gradient-to-b from-white via-mist to-lavender/70"}`}>
          <div className={`absolute inset-x-[12%] top-[10%] aspect-square rounded-full blur-2xl ${dark ? "bg-amethyst/50" : "bg-white/80"}`} aria-hidden />
          <div className="c-px absolute inset-x-[-8%] bottom-0 top-[6%]">
            <Image src={src} alt={`${name} — look ${look}`} width={w} height={h} sizes="(max-width: 768px) 70vw, 24vw" className="mx-auto h-full w-auto object-contain object-bottom" />
          </div>
          <span className="label-sm absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/70 px-2.5 py-1 text-[10px] text-plum/60 backdrop-blur">Stock placeholder</span>
        </div>
        <figcaption className="mt-4 flex items-baseline justify-between gap-3">
          <span className="label-sm text-amethyst">Look {look}</span>
          <span className="display-i text-[22px] sm:text-[26px]">{name}</span>
        </figcaption>
      </figure>
    </Panel>
  );
}

function Quote() {
  return (
    <Panel className="w-[78vw] sm:w-[52vw] md:w-[min(40vw,60svh)] lg:w-[min(28vw,56svh)]">
      <div className="c-reveal relative">
        <span className="display-i absolute -left-2 -top-16 text-[160px] leading-none text-lavender/50" aria-hidden>“</span>
        <p className="label text-amethyst">On the cut</p>
        <p className="display-i mt-5 text-[11vw] leading-[0.95] sm:text-[6vw] lg:text-[min(4vw,7svh)]">Silk that moves like breath; tailoring with a pulse.</p>
        <p className="mt-6 max-w-xs text-[14px] leading-relaxed text-ink-soft">Every bias seam is cut by hand so the fabric falls with the body, never against it.</p>
      </div>
    </Panel>
  );
}

function FabricStudy() {
  return (
    <Panel className="w-[70vw] sm:w-[44vw] md:w-[min(34vw,52svh)] lg:w-[min(26vw,52svh)]">
      <div className="c-reveal">
        <div className="relative aspect-square overflow-hidden rounded-full ring-1 ring-lavender/60">
          <SilkFilm className="absolute inset-0" />
          <span className="label-sm absolute inset-x-0 bottom-[14%] text-center text-plum/70">Fabric study 01</span>
        </div>
        <p className="mt-5 text-center">
          <span className="display text-[24px]">Silk charmeuse</span>
          <span className="label-sm mt-1 block text-plum/50">Generative placeholder · macro film to come</span>
        </p>
      </div>
    </Panel>
  );
}

function Duo({ a, b }) {
  return (
    <Panel className="w-[44vw] sm:w-[28vw] md:w-[min(20vw,21svh)] lg:w-[min(13vw,21svh)]">
      <div className="c-reveal flex flex-col gap-4">
        <ProductCard product={byId(a)} aspect="aspect-[4/5]" />
        <ProductCard product={byId(b)} aspect="aspect-[4/5]" />
      </div>
    </Panel>
  );
}

// Closing panel: a slowly turning text ring around a link into the dressing room.
function EndCTA() {
  return (
    <Panel className="w-[72vw] sm:w-[44vw] md:w-[min(32vw,50svh)] lg:w-[min(24vw,50svh)]">
      <Link href="/dressing-room" className="c-reveal group relative mx-auto grid aspect-square w-full max-w-[340px] place-items-center" data-cursor="Try on">
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full motion-safe:animate-[spin_24s_linear_infinite]" aria-hidden>
          <defs><path id="ring" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" /></defs>
          <text className="fill-plum" style={{ fontSize: 12.5, letterSpacing: "0.32em", textTransform: "uppercase", fontFamily: "var(--font-jost)" }}>
            <textPath href="#ring">Try every piece on ✦ Your avatar, your size ✦ </textPath>
          </text>
        </svg>
        <span className="ai-glow grid h-[52%] w-[52%] place-items-center rounded-full bg-plum text-pearl transition-transform duration-700 ease-[var(--ease-film)] group-hover:scale-110">
          <span className="text-center">
            <Spark className="mx-auto h-5 w-5" />
            <span className="label-sm mt-2 block">Dressing room</span>
            <span className="mt-1 block text-[22px]">→</span>
          </span>
        </span>
      </Link>
    </Panel>
  );
}

// Per-letter spans for the entrance; the word itself stays readable to screen readers via the h2 label.
const Letters = ({ text }) =>
  text.split("").map((c, i) => (
    <span key={i} className="c-char inline-block will-change-transform" aria-hidden>
      {c}
    </span>
  ));

const FACTS = [
  ["Season", "01"],
  ["Pieces", String(PRODUCTS.length).padStart(2, "0")],
  ["Made", "By hand"],
  ["Fabrics", "Silk · Organza · Wool"],
];

export default function Collection() {
  const root = useRef(null);
  const track = useRef(null);
  const dial = useRef(null); // docked dial (desktop, pinned)
  const dialFlow = useRef(null); // in-flow dial (phones, reduced motion)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const dist = () => track.current.scrollWidth - window.innerWidth;
        const st = { trigger: root.current, start: "top top", end: () => "+=" + dist(), scrub: 1, invalidateOnRefresh: true };

        // Lean with scroll velocity, then settle — makes the strip feel continuous rather than stepped.
        const skew = gsap.quickSetter(".c-skew", "skewX", "deg");
        const clamp = gsap.utils.clamp(-7, 7);
        const proxy = { s: 0 };
        const tween = gsap.to(track.current, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            ...st,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              dial.current?.setProgress(self.progress);
              const s = clamp(self.getVelocity() / -320);
              if (Math.abs(s) > Math.abs(proxy.s)) {
                proxy.s = s;
                gsap.to(proxy, { s: 0, duration: 0.9, ease: "power3", overwrite: true, onUpdate: () => skew(proxy.s) });
              }
            },
          },
        });

        // The dial starts large beside the title, then shrinks into the bottom-right corner and keeps
        // time for the rest of the journey (it replaces a progress bar).
        const d = root.current.querySelector(".c-dial");
        gsap.fromTo(
          d,
          { scale: 1, y: 0 },
          {
            scale: () => (window.innerWidth < 1024 ? 0.34 : 0.27),
            y: () => window.innerHeight / 2 - d.offsetHeight / 2 - 22,
            ease: "power2.inOut",
            scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + window.innerWidth * 0.75, scrub: 1, invalidateOnRefresh: true },
          }
        );
        // the title block leaves a touch faster than the strip, so the opener "lifts off"
        gsap.to(".c-opener-copy", { xPercent: -14, opacity: 0.2, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + window.innerWidth * 0.8, scrub: true } });

        // Giant outline type drifts at a third of the strip's speed.
        gsap.to(".c-bg", { x: () => -dist() * 0.35, ease: "none", scrollTrigger: st });

        gsap.utils.toArray(".c-panel").forEach((el, i) => {
          // depth: panels float at different rates
          gsap.fromTo(el, { yPercent: i % 2 ? 4 : -3 }, { yPercent: i % 2 ? -4 : 3, ease: "none", scrollTrigger: { trigger: el, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
          // entrance: unmask from the bottom as the panel enters from the right
          const r = el.querySelector(".c-reveal");
          if (r) gsap.fromTo(r, { clipPath: "inset(100% 0% 0% 0%)", y: 40 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, ease: "power2.out", scrollTrigger: { trigger: el, containerAnimation: tween, start: "left 98%", end: "left 62%", scrub: true } });
          // counter-drift of the model inside its arch
          const px = el.querySelector(".c-px");
          if (px) gsap.fromTo(px, { xPercent: 8 }, { xPercent: -8, ease: "none", scrollTrigger: { trigger: el, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        });
      });

      // Opener entrance (every size): letters rise in, "Lavender" unmasks, the dial turns in.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 72%", once: true } });
        tl.from(".c-char", { yPercent: 118, rotate: 7, opacity: 0, duration: 1.3, ease: "expo.out", stagger: 0.035 })
          .from(".c-word", { clipPath: "inset(0 100% 0 0)", duration: 1.6, ease: "expo.inOut" }, 0.15)
          .from(".c-fact", { y: 24, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.07 }, 0.5)
          .from(".c-dial-in", { opacity: 0, rotate: -40, scale: 0.86, duration: 1.8, ease: "expo.out" }, 0.1);
      });
    }, root);

    // Phones / reduced motion: the in-flow dial follows the swipe row instead.
    const t = track.current;
    const onSwipe = () => dialFlow.current?.setProgress(t.scrollLeft / Math.max(1, t.scrollWidth - t.clientWidth));
    t.addEventListener("scroll", onSwipe, { passive: true });
    return () => {
      t.removeEventListener("scroll", onSwipe);
      ctx.revert();
    };
  }, []);

  return (
    <div>
      {/* own wrapper: GSAP inserts its pin-spacer here, outside React's sibling list */}
      <section id="collection" ref={root} data-chapter="#FAF8FD" className="relative overflow-hidden py-20 md:flex md:h-screen md:items-center md:py-0" aria-labelledby="col-h">
        {/* drifting outline type behind the strip (CSS marquee on touch, scroll-linked on desktop) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden items-center overflow-visible md:flex" aria-hidden>
          <div className="c-bg flex whitespace-nowrap pl-[100vw]">
            {[0, 1].map((k) => (
              <span key={k} className="display pr-[6vw] text-[44vw] leading-none text-transparent md:text-[26vw]" style={{ WebkitTextStroke: "1px rgba(110,79,168,.16)" }}>
                The Lavender Hour — Season 01 —
              </span>
            ))}
          </div>
        </div>

        <div className="c-dial pointer-events-none absolute right-[var(--gutter)] top-1/2 z-20 hidden w-[min(40vw,66svh)] origin-bottom-right -translate-y-1/2 md:motion-safe:block">
          <Dial ref={dial} idPrefix="dd" className="c-dial-in" />
        </div>

        <div ref={track} className="no-scrollbar relative flex snap-x snap-mandatory scroll-px-[var(--gutter)] items-center gap-6 overflow-x-auto overscroll-x-contain px-[var(--gutter)] pb-6 sm:gap-8 md:h-full md:gap-[5vw] md:pb-0 md:motion-safe:snap-none md:motion-safe:overflow-visible" /* reduced motion: stays a swipe row, no pin */>
          {/* Opener: full first screen on desktop (title left, dial right — the docked dial lives outside the track) */}
          <div className="c-opener relative w-[86vw] shrink-0 snap-start sm:w-[72vw] md:w-[calc(100vw-var(--gutter)*2)] md:motion-safe:pr-[min(44vw,74svh)]">
            <div className="c-opener-copy max-w-[760px]">
              <ChapterLabel n="01" title="The Collection" />
              <h2 id="col-h" aria-label="The Lavender Hour" className="display mt-6 text-[19vw] leading-[0.84] sm:text-[14vw] md:mt-8 md:text-[min(10.5vw,17svh)]">
                <span className="block overflow-hidden pb-[0.04em]"><Letters text="The" /></span>
                <span className="block overflow-hidden pb-[0.12em] pl-[0.35em]">
                  <span className="c-word lav-fill display-i inline-block pr-[0.06em]" aria-hidden>Lavender</span>
                </span>
                <span className="block overflow-hidden pb-[0.04em]"><Letters text="Hour" /></span>
              </h2>
              <p className="c-fact mt-7 max-w-md text-[15px] leading-relaxed text-ink-soft md:text-[16px]">
                Cut for the minute between dusk and night. Silks that move like breath; tailoring with a pulse. Travel the collection and watch the hour turn.
              </p>
              <dl className="mt-8 grid max-w-xl grid-cols-3 border-t border-plum/10 sm:grid-cols-[0.6fr_0.6fr_0.9fr_1.7fr]">
                {FACTS.map(([k, v]) => (
                  <div key={k} className={`c-fact border-b border-plum/10 py-4 pr-4 sm:border-b-0 ${k === "Fabrics" ? "col-span-3 sm:col-span-1" : ""}`}>
                    <dt className="label-sm text-plum/50">{k}</dt>
                    <dd className="display mt-1.5 whitespace-nowrap text-[19px] leading-tight sm:text-[21px]">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="c-fact label-sm mt-8 hidden items-center gap-3 text-plum/50 md:motion-safe:flex">
                Scroll to travel the hour
                <span className="relative inline-block h-px w-14 overflow-hidden bg-plum/20">
                  <span className="absolute inset-y-0 left-0 w-1/2 bg-amethyst motion-safe:animate-[cue_1.8s_ease-in-out_infinite]" />
                </span>
              </p>
              <p className="label-sm mt-8 text-plum/50 md:motion-safe:hidden">Swipe to travel the hour →</p>
            </div>
            {/* in-flow dial: phones and reduced motion */}
            <div className="mt-10 md:motion-safe:hidden">
              <Dial ref={dialFlow} idPrefix="dm" className="c-dial-in mx-auto w-[min(78vw,420px)]" />
            </div>
          </div>

          <Arch src="/models/ivory-coat.webp" w={611} h={1500} look="01" name="Ivory Tailoring" align="bottom" />
          <Card id="aurora-gown" size="m" align="top" tilt={-1.5} />
          <Card id="halo-cape" size="l" align="bottom" aspect="aspect-[4/5]" />
          <Quote />
          <Card id="nocturne-blazer" size="s" align="top" tilt={2} />
          <FabricStudy />
          <Arch src="/models/midnight-embellished.webp" w={642} h={1470} look="03" name="Moonlit Evening" dark align="top" />
          <Card id="vesper-trouser" size="m" align="bottom" />
          <Duo a="lune-slip" b="mist-drape" />
          <Card id="cloud-knit" size="l" align="top" tilt={-1} aspect="aspect-[4/5]" />
          <Arch src="/models/sand-suit.webp" w={789} h={1500} look="02" name="Soft Power" align="bottom" />
          <Card id="orbit-skirt" size="m" align="top" />
          <Card id="pearl-collar" size="s" align="bottom" tilt={1.5} />
          <EndCTA />
          <div className="w-[6vw] shrink-0" aria-hidden />
        </div>

      </section>
    </div>
  );
}
