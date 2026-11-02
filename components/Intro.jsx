"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useLenis } from "./SmoothScroll";

const NAME = "FIT YOUR FASHION";

// 2–3s opening: letters arrive through a lavender light leak, then the curtain lifts.
export default function Intro({ onDone }) {
  const root = useRef(null);
  const [gone, setGone] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (gone) lenis?.start();
    else lenis?.stop();
  }, [lenis, gone]);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("fyf:intro") === "1"; } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen) {
      setGone(true);
      onDone?.();
      return;
    }
    const q = gsap.utils.selector(root);
    const finish = () => {
      try { sessionStorage.setItem("fyf:intro", "1"); } catch {}
      setGone(true);
    };
    const tl = gsap.timeline({ onComplete: finish });
    if (reduce) {
      tl.set(q(".ch"), { opacity: 1 }).to(root.current, { opacity: 0, duration: 0.6, delay: 0.8, onStart: () => onDone?.() });
    } else {
      tl.fromTo(q(".leak"), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.4, ease: "sine.out", stagger: 0.15 }, 0)
        .fromTo(q(".ch"), { yPercent: 110, opacity: 0, filter: "blur(12px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "expo.out", stagger: 0.06 }, 0.2)
        .fromTo(q(".tag"), { opacity: 0, letterSpacing: "0.6em" }, { opacity: 1, letterSpacing: "0.32em", duration: 1, ease: "expo.out" }, 1.1)
        .to(q(".ch"), { yPercent: -40, opacity: 0, duration: 0.6, ease: "power3.in", stagger: 0.02 }, 2.05)
        .add(() => onDone?.(), 2.25)
        .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, 2.2);
    }
    const skip = (e) => {
      if (e.type === "keydown" && e.key !== "Escape" && e.key !== "Enter") return;
      tl.progress(1);
    };
    window.addEventListener("keydown", skip);
    root.current?.addEventListener("click", skip);
    return () => {
      tl.kill();
      window.removeEventListener("keydown", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[250] grid place-items-center overflow-hidden bg-pearl" style={{ clipPath: "inset(0 0 0% 0)" }} role="presentation" data-cursor="Skip">
      <div className="leak absolute -left-[20%] top-[10%] h-[70vmax] w-[70vmax] rounded-full bg-lavender/70 blur-[120px]" style={{ animation: "haze 6s ease-in-out infinite" }} />
      <div className="leak absolute -right-[15%] bottom-[-20%] h-[60vmax] w-[60vmax] rounded-full bg-[#f5d9ef]/70 blur-[120px]" />
      <div className="leak absolute left-[40%] top-[-20%] h-[40vmax] w-[40vmax] rounded-full bg-[#bfe3f5]/50 blur-[100px]" />
      <div className="relative z-10 text-center text-plum">
        <h1 className="display flex flex-wrap justify-center overflow-hidden px-4 text-[13vw] leading-none sm:text-[9vw]" aria-label={NAME}>
          {NAME.split("").map((c, i) => (
            <span key={i} className="ch inline-block opacity-0" aria-hidden>
              {c === " " ? " " : c}
            </span>
          ))}
        </h1>
        <p className="tag label mt-6 text-amethyst opacity-0">A fashion film in chapters</p>
      </div>
      <span className="label-sm absolute bottom-6 text-plum/50">Click or press Esc to skip</span>
    </div>
  );
}
