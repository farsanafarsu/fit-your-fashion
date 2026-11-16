"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap"; // ScrollTrigger is registered once in SmoothScroll
import { byId, formatPrice } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { PlaceholderTag } from "../ui/primitives";

// Accessories, played as the second scroll-film: LUXURY IN DETAILS with the pieces turning in the air,
// then the word clears and the shelf arrives beside the model.
// Only the Pearl Constellation Collar exists in the catalogue today. The heel, bag and earrings are
// drawn PLACEHOLDERS: give an item a `src` (transparent WebP/PNG cut-out) and it replaces the drawing.
const collar = byId("pearl-collar");
const ITEMS = [
  { id: "heel", art: "heel", name: "Evening Heel", note: "Satin · Lavender" },
  { id: "bag", art: "bag", name: "Top-Handle Bag", note: "Calf leather · Amethyst" },
  { id: collar.id, product: collar, name: collar.name, note: collar.fabric },
  { id: "earrings", art: "earrings", name: "Drop Earrings", note: "Freshwater pearl" },
];

function Defs() {
  return (
    <defs>
      <linearGradient id="ax-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#E9DFF5" />
        <stop offset=".45" stopColor="#C9B6E4" />
        <stop offset="1" stopColor="#6E4FA8" />
      </linearGradient>
      <linearGradient id="ax-d" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8C6FC4" />
        <stop offset="1" stopColor="#4F3785" />
      </linearGradient>
      <radialGradient id="ax-p" cx=".35" cy=".3" r=".8">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset=".6" stopColor="#EDE5F8" />
        <stop offset="1" stopColor="#B9A3DB" />
      </radialGradient>
    </defs>
  );
}

// Drawn stand-ins, in the palette. Each is its own <svg> so it can float and turn independently.
export function AccessoryArt({ kind, className = "" }) {
  if (kind === "heel")
    return (
      <svg viewBox="0 0 220 150" className={className} aria-hidden>
        <Defs />
        {/* stiletto */}
        <path d="M34 62c5 22 6 50 5 80h7c2-26 8-50 20-66Z" fill="url(#ax-d)" />
        {/* upper and sole in one sweep */}
        <path d="M22 30c14-10 34-4 44 14 14 26 46 50 92 62 22 6 44 10 50 22 3 8-3 14-14 14h-58c-24 0-40-12-58-34-12-15-24-26-40-30-12-3-22-22-16-48Z" fill="url(#ax-g)" />
        {/* the opening of the shoe */}
        <path d="M40 42c10 2 18 12 26 26 12 20 36 36 70 46-30-2-56-12-74-32-10-12-20-26-22-40Z" fill="#4F3785" opacity=".55" />
        <path d="M150 104c24 6 48 10 56 22" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (kind === "bag")
    return (
      <svg viewBox="0 0 180 180" className={className} aria-hidden>
        <Defs />
        <path d="M58 78c0-70 64-70 64 0" fill="none" stroke="url(#ax-d)" strokeWidth="7" strokeLinecap="round" />
        <path d="M30 76h120c6 0 10 4 11 10l9 66c1 10-5 16-15 16H25c-10 0-16-6-15-16l9-66c1-6 5-10 11-10Z" fill="url(#ax-g)" />
        <path d="M22 80h136c4 0 7 3 6 8-4 20-34 34-74 34S20 108 16 88c-1-5 2-8 6-8Z" fill="url(#ax-d)" opacity=".85" />
        <rect x="80" y="110" width="20" height="22" rx="5" fill="url(#ax-p)" stroke="#6E4FA8" strokeWidth="1.5" />
        <path d="M30 150c30 8 90 8 120 0" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 150 180" className={className} aria-hidden>
      <Defs />
      {[[42, 0], [108, 14]].map(([x, dy]) => (
        <g key={x} transform={`translate(0 ${dy})`}>
          <circle cx={x} cy="20" r="9" fill="url(#ax-p)" stroke="#B9A3DB" />
          <path d={`M${x} 29v30`} stroke="#8C6FC4" strokeWidth="2" />
          <circle cx={x} cy="68" r="6" fill="url(#ax-g)" />
          <path d={`M${x} 74v14`} stroke="#8C6FC4" strokeWidth="2" />
          <path d={`M${x} 86c-18 22-24 40-24 50a24 24 0 0 0 48 0c0-10-6-28-24-50Z`} fill="url(#ax-p)" stroke="#B9A3DB" />
          <ellipse cx={x - 8} cy="128" rx="5" ry="9" fill="#fff" opacity=".8" />
        </g>
      ))}
    </svg>
  );
}

function Piece({ item, className = "", sizes = "220px" }) {
  if (item.product)
    return (
      <span className={`relative block overflow-hidden rounded-[999px] ring-1 ring-white/70 ${className}`}>
        <Image src={item.product.photo.src} alt="" fill sizes={sizes} className="object-cover" style={{ objectPosition: item.product.photo.focus }} />
      </span>
    );
  if (item.src) return <Image src={item.src} alt="" width={item.w ?? 600} height={item.h ?? 600} sizes={sizes} className={`object-contain ${className}`} />;
  return <AccessoryArt kind={item.art} className={className} />;
}

export default function Accessories() {
  const root = useRef(null);
  const { addToBag, askStylist } = useApp();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) {
          // calm version: straight to the shelf
          gsap.set(".ax-air", { autoAlpha: 0 });
          gsap.set([".ax-head", ".ax-model", ".ax-card"], { opacity: 1 });
          return;
        }
        gsap.set(".ax-model", { xPercent: -24 });
        gsap.set(".ax-head", { y: 30 });
        gsap.set(".ax-card", { y: 60, scale: 0.92 });

        // the word assembles as the section comes into view
        gsap.from(".ax-l", { yPercent: 112, duration: 1.1, stagger: 0.05, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 55%" } });

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: { trigger: root.current, start: "top top", end: () => "+=" + window.innerHeight * 2.4, pin: true, scrub: 0.7, invalidateOnRefresh: true },
        });
        tl
          // the pieces turn over the word, each at its own depth
          .to(".ax-f1", { rotate: 200, yPercent: -30, xPercent: 26, duration: 2.4, ease: "none" }, 0)
          .to(".ax-f2", { rotate: -150, yPercent: 34, xPercent: -30, duration: 2.4, ease: "none" }, 0)
          .to(".ax-f3", { rotate: 24, yPercent: -60, duration: 2.4, ease: "none" }, 0)
          .to(".ax-f4", { rotate: -40, yPercent: 46, xPercent: 18, duration: 2.4, ease: "none" }, 0)
          .to(".ax-wordwrap", { scale: 1.08, duration: 2.4, ease: "none" }, 0)
          // the word clears, the pieces leave
          .to(".ax-wordwrap", { yPercent: -60, opacity: 0, duration: 1 }, 1.7)
          .to(".ax-float", { opacity: 0, scale: 0.6, duration: 0.8, stagger: 0.06 }, 1.8)
          // the shelf arrives
          .to(".ax-model", { xPercent: 0, opacity: 1, duration: 1.1, ease: "power3.out" }, 2.3)
          .to(".ax-head", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 2.5)
          .to(".ax-card", { y: 0, scale: 1, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }, 2.7)
          .to({}, { duration: 0.8 });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div>
      {/* own wrapper: GSAP inserts its pin-spacer here, outside React's sibling list */}
      <section
        ref={root}
        id="accessories"
        data-chapter="#F3EEF9"
        className="relative isolate h-[100svh] min-h-[620px] overflow-hidden"
        aria-labelledby="ax-h"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_48%,#ffffff_0%,rgba(250,248,253,.6)_45%,transparent_75%)]" aria-hidden />

        {/* ── LUXURY IN DETAILS, pieces in the air ─────────── */}
        <div className="ax-air pointer-events-none absolute inset-0 z-10" aria-hidden>
          <div className="ax-wordwrap absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
            <p className="block-word ax-word overflow-hidden pb-[0.08em] whitespace-nowrap text-[16vw] md:text-[min(17vw,40svh)]">
              {[..."Luxury"].map((c, i) => <span key={i} className="ax-l inline-block">{c}</span>)}
            </p>
            <p className="block-word mt-[0.6svh] text-[6.2vw] tracking-[0.02em] text-amethyst md:text-[min(4.6vw,10svh)]">In details</p>
          </div>
          <div className="ax-float ax-f1 absolute left-[30%] top-[38%] w-[34vw] md:left-[36%] md:top-[30%] md:w-[19vw]">
            <div className="float-a"><Piece item={ITEMS[0]} className="w-full -rotate-[18deg] drop-shadow-[0_26px_26px_rgba(110,79,168,.35)]" /></div>
          </div>
          <div className="ax-float ax-f2 absolute left-[50%] top-[50%] w-[30vw] md:left-[50%] md:top-[44%] md:w-[16vw]">
            <div className="float-b"><Piece item={ITEMS[0]} className="w-full -scale-x-100 rotate-[28deg] drop-shadow-[0_26px_26px_rgba(110,79,168,.35)]" /></div>
          </div>
          <div className="ax-float ax-f3 absolute left-[8%] top-[20%] w-[22vw] md:left-[14%] md:top-[14%] md:w-[11vw]">
            <div className="float-c"><Piece item={ITEMS[1]} className="w-full rotate-[10deg] drop-shadow-[0_22px_22px_rgba(110,79,168,.3)]" /></div>
          </div>
          <div className="ax-float ax-f4 absolute right-[8%] top-[66%] w-[17vw] md:right-[14%] md:top-[58%] md:w-[8vw]">
            <div className="float-a"><Piece item={ITEMS[3]} className="w-full -rotate-[8deg] drop-shadow-[0_22px_22px_rgba(110,79,168,.3)]" /></div>
          </div>
        </div>

        {/* ── The shelf ────────────────────────────────────── */}
        <div className="relative z-20 mx-auto flex h-full max-w-[1500px] items-stretch px-[var(--gutter)]">
          <div className="ax-model relative hidden w-[40%] shrink-0 opacity-0 md:block">
            <Image src="/models/sand-suit.webp" alt="Model in the Sand Power Suit" width={789} height={1500} sizes="40vw" className="absolute bottom-0 left-1/2 h-[90%] w-auto max-w-none -translate-x-1/2 drop-shadow-[0_30px_40px_rgba(30,21,48,.18)]" />
            <PlaceholderTag className="bottom-5 left-0">Placeholder imagery</PlaceholderTag>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center pb-[3svh] pt-[max(9svh,72px)] md:pl-[3vw]">
            <div className="ax-head text-center opacity-0">
              <div className="flex items-center justify-center gap-5 text-plum/25">
                <span className="h-px w-10 bg-current sm:w-20" />
                <h2 id="ax-h" className="display text-[clamp(38px,6.6svh,68px)] tracking-[0.04em] text-plum">Accessories</h2>
                <span className="h-px w-10 bg-current sm:w-20" />
              </div>
              <p className="display-i mt-1 text-[clamp(15px,2.3svh,20px)] text-ink-soft">The beauty is in the detail</p>
            </div>

            <ul className="mx-auto mt-[3.4svh] grid w-full max-w-[640px] grid-cols-2 gap-x-[clamp(12px,2vw,28px)] gap-y-[2.4svh]">
              {ITEMS.map((it) => (
                <li key={it.id} className="ax-card opacity-0">
                  <div className="group/a relative rounded-[22px] bg-white p-3 shadow-[0_18px_44px_-26px_rgba(30,21,48,.45)] sm:p-4">
                    <div className="grid h-[clamp(96px,19svh,190px)] place-items-center rounded-2xl bg-pearl">
                      <Piece
                        item={it}
                        sizes="260px"
                        className={`transition-transform duration-500 ease-[var(--ease-film)] group-hover/a:-translate-y-1.5 group-hover/a:scale-105 ${it.product ? "h-[82%] w-[82%]" : "h-[78%] w-auto max-w-[78%]"}`}
                      />
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="display truncate text-[clamp(16px,2.5svh,22px)] leading-tight">{it.name}</p>
                        <p className="label-sm mt-1 truncate text-[9.5px] text-plum/50">{it.product ? <span title="Placeholder price">{formatPrice()}</span> : "Coming soon"}</p>
                      </div>
                      {it.product ? (
                        <button
                          onClick={() => addToBag(it.id)}
                          aria-label={`Add ${it.name} to bag`}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-plum text-[17px] leading-none text-pearl transition-colors hover:bg-amethyst"
                          data-cursor="Add"
                        >
                          +
                        </button>
                      ) : (
                        <button
                          onClick={() => askStylist(`Suggest a ${it.name.toLowerCase()} to finish my look`)}
                          aria-label={`Ask the stylist about a ${it.name.toLowerCase()}`}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-plum/20 text-[15px] leading-none text-plum transition-colors hover:border-plum"
                          data-cursor="Ask"
                        >
                          ✦
                        </button>
                      )}
                    </div>
                    {!it.product && <PlaceholderTag className="left-5 top-5 sm:left-6 sm:top-6">Placeholder</PlaceholderTag>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
