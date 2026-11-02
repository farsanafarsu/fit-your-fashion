"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { byId, PRODUCTS } from "@/lib/catalog";
import ProductCard from "../ProductCard";
import SilkFilm from "../ui/SilkFilm";
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

export default function Collection() {
  const root = useRef(null);
  const track = useRef(null);

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
              const s = clamp(self.getVelocity() / -320);
              if (Math.abs(s) > Math.abs(proxy.s)) {
                proxy.s = s;
                gsap.to(proxy, { s: 0, duration: 0.9, ease: "power3", overwrite: true, onUpdate: () => skew(proxy.s) });
              }
            },
          },
        });

        // Giant outline type drifts at a third of the strip's speed.
        gsap.to(".c-bg", { x: () => -dist() * 0.35, ease: "none", scrollTrigger: st });
        gsap.to(".c-progress", { scaleX: 1, ease: "none", scrollTrigger: { ...st, scrub: true } });

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
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div>
      {/* own wrapper: GSAP inserts its pin-spacer here, outside React's sibling list */}
      <section id="collection" ref={root} className="relative overflow-hidden bg-pearl py-20 md:flex md:h-screen md:items-center md:py-0" aria-labelledby="col-h">
        {/* drifting outline type behind the strip (CSS marquee on touch, scroll-linked on desktop) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-visible" aria-hidden>
          <div className="c-bg flex whitespace-nowrap max-md:animate-[pan_50s_linear_infinite] motion-reduce:animate-none">
            {[0, 1].map((k) => (
              <span key={k} className="display pr-[6vw] text-[44vw] leading-none text-transparent md:text-[26vw]" style={{ WebkitTextStroke: "1px rgba(110,79,168,.16)" }}>
                The Lavender Hour — Season 01 —
              </span>
            ))}
          </div>
        </div>

        <div ref={track} className="no-scrollbar relative flex snap-x snap-mandatory scroll-px-[var(--gutter)] items-center gap-6 overflow-x-auto overscroll-x-contain px-[var(--gutter)] pb-6 sm:gap-8 md:h-full md:gap-[5vw] md:pb-0 md:motion-safe:snap-none md:motion-safe:overflow-visible" /* reduced motion: stays a swipe row, no pin */>
          <div className="w-[84vw] shrink-0 snap-start sm:w-[60vw] md:w-[44vw] lg:w-[34vw]">
            <ChapterLabel n="01" title="The Collection" />
            <h2 id="col-h" className="display mt-8 text-[17vw] sm:text-[12vw] md:text-[10vw] lg:text-[9vw]">
              The <span className="display-i text-amethyst">Lavender</span> Hour
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink-soft">
              {PRODUCTS.length} pieces cut for the minute between dusk and night. Silks that move like breath; tailoring with a pulse.
            </p>
            <p className="label-sm mt-8 hidden items-center gap-3 text-plum/50 md:flex">
              Scroll to travel <span className="inline-block h-px w-10 bg-plum/30" /> →
            </p>
            <p className="label-sm mt-8 text-plum/50 md:hidden">Swipe →</p>
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

        <div className="absolute bottom-8 left-[var(--gutter)] right-[var(--gutter)] hidden h-px bg-plum/10 md:block" aria-hidden>
          <div className="c-progress h-full origin-left scale-x-0 bg-amethyst" />
        </div>
      </section>
    </div>
  );
}
