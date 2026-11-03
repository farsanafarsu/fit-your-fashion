"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useLenis } from "./SmoothScroll";
import Signature from "./ui/Signature";

const NAME = "FIT YOUR FASHION";

// Opening (first visit per session, ~4.5s): a lavender point opens into concentric circle wipes —
// plum, lavender, pearl — the wordmark rises and the brand signature writes itself beneath it. Once
// the page has loaded, the wordmark glides into the header logo's place while the curtain lifts.
export default function Intro({ onDone }) {
  const root = useRef(null);
  const sig = useRef(null);
  const [gone, setGone] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (gone) lenis?.start();
    else lenis?.stop();
  }, [lenis, gone]);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("fyf:intro") === "1"; } catch {}
    if (seen) {
      setGone(true);
      onDone?.();
      return;
    }
    const q = gsap.utils.selector(root);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      try { sessionStorage.setItem("fyf:intro", "1"); } catch {}
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
      sig.current?.finish();
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
      gsap.set(q(".ch, .tag"), { opacity: 1 });
      sig.current?.finish();
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
        .add(() => sig.current?.play(), 2.4)
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
          <Signature ref={sig} trigger="manual" className="fade-out -mt-1 h-[30vw] w-auto -rotate-[4deg] text-amethyst sm:h-[min(15vw,200px)]" />
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
