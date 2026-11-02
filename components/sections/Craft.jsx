"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { byId } from "@/lib/catalog";
import { SHAPES } from "../ui/GarmentArt";
import { PlaceholderTag } from "../ui/primitives";

const FRAMES = [
  { k: "I", title: "The thread", text: "Mulberry silk and Chanderi, chosen by hand for how they hold light." },
  { k: "II", title: "The hand", text: "Each bias seam is cut, pinned and finished by a single maker." },
  { k: "III", title: "The hour", text: "A piece is ready when it moves like it has always existed." },
];

// Brand story: pinned, each frame cuts to the next (zoom + crossfade) while three
// parallax planes — set, fabric, model — move at different depths.
export default function Craft() {
  const root = useRef(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const frames = gsap.utils.toArray(".cr-frame");
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "+=" + window.innerHeight * 2.4, pin: true, scrub: 1 } });
        frames.forEach((f, i) => {
          if (i === 0) return;
          tl.to(frames[i - 1], { opacity: 0, scale: 1.08, duration: 1 }, i)
            .fromTo(f, { opacity: 0, scale: 0.94, clipPath: "circle(8% at 50% 50%)" }, { opacity: 1, scale: 1, clipPath: "circle(80% at 50% 50%)", duration: 1, ease: "power2.inOut" }, i);
        });
        tl.to(".cr-bg", { yPercent: -6, ease: "none", duration: frames.length }, 0)
          .to(".cr-mid", { yPercent: -18, rotate: -3, ease: "none", duration: frames.length }, 0)
          .to(".cr-fg", { yPercent: -32, ease: "none", duration: frames.length }, 0);
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const gown = byId("aurora-gown");
  return (
    <div>
      {/* own wrapper: GSAP inserts its pin-spacer here, outside React's sibling list */}
    <section id="story" ref={root} data-chapter="#1E1530" className="on-dark relative h-screen overflow-hidden motion-reduce:h-auto motion-reduce:py-32 text-pearl" aria-labelledby="cr-h">
      {/* background set */}
      <div className="cr-bg absolute inset-[-10%] [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)] bg-[radial-gradient(ellipse_at_30%_40%,#3a2b5c,transparent_60%),radial-gradient(ellipse_at_80%_70%,#2a1f44,#1e1530)]" aria-hidden>
        <div className="absolute left-[8%] top-0 h-full w-px bg-gradient-to-b from-transparent via-lavender/30 to-transparent" />
        <div className="absolute left-[62%] top-0 h-full w-px bg-gradient-to-b from-transparent via-lavender/20 to-transparent" />
      </div>
      {/* mid: drifting fabric */}
      <svg className="cr-mid absolute -right-[10%] top-[10%] h-[90%] w-[70%] opacity-60" viewBox="0 0 400 400" aria-hidden>
        <defs>
          <linearGradient id="silk" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E9DFF5" stopOpacity=".7" /><stop offset=".5" stopColor="#C9B6E4" stopOpacity=".15" /><stop offset="1" stopColor="#6E4FA8" stopOpacity=".6" />
          </linearGradient>
        </defs>
        <path d="M20 60 C120 0 180 140 260 80 S380 40 390 120 C360 220 260 180 200 260 S60 380 10 330 C40 240 0 160 20 60Z" fill="url(#silk)" />
      </svg>
      {/* foreground: model */}
      <svg className="cr-fg absolute bottom-[-18%] left-[28%] h-[80%] -translate-x-1/2 opacity-40 sm:h-[95%] md:left-[30%] md:opacity-100" viewBox="0 0 300 400" aria-hidden>
        <path d={SHAPES.gown} fill={gown.colour} opacity=".9" />
        <ellipse cx="150" cy="30" rx="20" ry="25" fill="#C99A7A" opacity=".9" />
      </svg>
      <PlaceholderTag className="bottom-4 right-4 text-plum">Craft film stills placeholder</PlaceholderTag>

      <div className="relative z-10 mx-auto flex h-full max-w-[1500px] items-center px-[var(--gutter)]">
        <div className="ml-auto w-full max-w-xl">
          <p className="label text-lavender">The Atelier</p>
          <h2 id="cr-h" className="sr-only">Craftsmanship</h2>
          <div className="relative mt-6 h-[56svh] motion-reduce:h-auto sm:mt-8 sm:h-[46vh]">
            {FRAMES.map((f, i) => (
              <div key={f.k} className={`cr-frame absolute inset-0 motion-reduce:relative motion-reduce:mb-12 ${i ? "opacity-0 motion-reduce:opacity-100" : ""}`}>
                <span className="display-i text-[22vw] leading-none text-lavender/30 sm:text-[14vw] lg:text-[10vw]">{f.k}</span>
                <h3 className="display -mt-[0.4em] text-[15vw] sm:text-[10vw] lg:text-[6vw]">{f.title}</h3>
                <p className="mt-6 max-w-sm text-[16px] leading-relaxed text-mist/80">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
