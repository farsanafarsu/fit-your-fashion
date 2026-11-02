"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MEDIA } from "@/lib/catalog";
import SilkFilm from "../ui/SilkFilm";
import { Button, PlaceholderTag } from "../ui/primitives";

const LINES = ["Wear the future.", "Before it’s yours."];

export default function Hero({ ready }) {
  const root = useRef(null);
  const [portrait, setPortrait] = useState(false);
  const film = MEDIA.heroFilm;

  useEffect(() => {
    const m = window.matchMedia("(orientation: portrait)");
    setPortrait(m.matches);
  }, []);

  // Headline arrives after the intro curtain; on scroll the hero zooms back like a pull-out shot.
  useEffect(() => {
    if (!ready) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ reduce: "(prefers-reduced-motion: reduce)", ok: "(prefers-reduced-motion: no-preference)" }, ({ conditions }) => {
        if (conditions.reduce) {
          gsap.set(".h-word, .h-fade", { opacity: 1, yPercent: 0 });
          return;
        }
        gsap.timeline()
          .fromTo(".h-word", { yPercent: 105, rotate: 4, opacity: 1 }, { yPercent: 0, rotate: 0, duration: 1.4, ease: "expo.out", stagger: 0.09 })
          .fromTo(".h-fade", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.1 }, "-=0.9");
        gsap.to(".h-media", { scale: 1.18, yPercent: 12, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".h-copy", { yPercent: -40, opacity: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "70% top", scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, [ready]);

  const src = portrait ? film.portrait : film.landscape;
  return (
    <section ref={root} className="on-dark relative h-[100svh] min-h-[600px] overflow-hidden bg-plum text-pearl" aria-label="Campaign film">
      <div className="h-media absolute inset-0 origin-center">
        {src ? (
          <video className="h-full w-full object-cover" src={src} poster={film.poster ?? undefined} autoPlay muted loop playsInline preload="metadata">
            <track kind="captions" src={film.captions} srcLang="en" label="English" default />
          </video>
        ) : (
          <SilkFilm />
        )}
      </div>
      <div className="vignette grain absolute inset-0" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-plum/10 to-transparent" aria-hidden />
      {!src && <PlaceholderTag className="right-4 top-24 text-plum">Hero film placeholder · generative stand-in</PlaceholderTag>}

      <div className="h-copy relative z-10 flex h-full flex-col justify-end px-[var(--gutter)] pb-[12vh] sm:pb-[10vh]">
        <p className="h-fade label mb-6 text-mist opacity-0">Season 01 · The Lavender Hour</p>
        <h1 className="display text-[17vw] leading-[0.86] sm:text-[11.5vw] lg:text-[9.6vw]">
          {LINES.map((l, i) => (
            <span key={l} className="block overflow-hidden pb-[0.06em]">
              <span className={`h-word inline-block opacity-0 ${i === 1 ? "display-i text-mist" : ""}`}>{l}</span>
            </span>
          ))}
        </h1>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <span className="h-fade opacity-0">
            <Button as="a" href="/dressing-room" variant="light" ai data-cursor="Enter">
              Enter the AI Dressing Room
            </Button>
          </span>
          <span className="h-fade opacity-0">
            <Button as="a" href="#collection" variant="glass" data-cursor="View">
              Explore the Collection
            </Button>
          </span>
        </div>
      </div>
      <div className="h-fade label-sm absolute bottom-6 right-[var(--gutter)] z-10 hidden items-center gap-3 text-mist/80 opacity-0 sm:flex">
        Scroll <span className="h-8 w-px animate-pulse bg-mist/60" />
      </div>
    </section>
  );
}
