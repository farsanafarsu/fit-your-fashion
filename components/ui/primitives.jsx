"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// Animated four-point "spark" — the mark for every AI element.
export function Spark({ className = "h-4 w-4", animate = true }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} ${animate ? "spark" : ""}`} aria-hidden>
      <defs>
        <linearGradient id="spark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C9B6E4" />
          <stop offset=".5" stopColor="#BFE3F5" />
          <stop offset="1" stopColor="#6E4FA8" />
        </linearGradient>
      </defs>
      <path d="M12 1.5c.6 5.2 2.3 8.6 10.5 10.5-8.2 1.9-9.9 5.3-10.5 10.5-.6-5.2-2.3-8.6-10.5-10.5C9.7 10.1 11.4 6.7 12 1.5Z" fill="url(#spark-g)" />
    </svg>
  );
}

// Pulls toward the pointer while hovered.
export function Magnetic({ children, strength = 0.35, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * strength);
      yTo((e.clientY - r.top - r.height / 2) * strength);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return <span ref={ref} className={`inline-block ${className}`}>{children}</span>;
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ✦◇+/";
// Text that scrambles into place on hover (and once on mount if `onMount`).
export function Scramble({ text, className = "", onMount = false }) {
  const [out, setOut] = useState(text);
  const raf = useRef(0);
  const run = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    cancelAnimationFrame(raf.current);
    let frame = 0;
    const total = text.length * 2 + 8;
    const step = () => {
      frame++;
      setOut(
        text
          .split("")
          .map((c, i) => (c === " " ? " " : i < (frame - 6) / 2 ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join("")
      );
      if (frame < total) raf.current = requestAnimationFrame(step);
      else setOut(text);
    };
    step();
  };
  useEffect(() => {
    if (onMount) run();
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return (
    <span className={className} onPointerEnter={run} onFocus={run} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  );
}

export function Button({ children, variant = "solid", className = "", as: Tag = "button", ai = false, ...rest }) {
  const styles = {
    solid: "bg-plum text-pearl hover:bg-amethyst",
    light: "bg-pearl text-plum hover:bg-white",
    ghost: "border border-current/40 hover:border-current bg-transparent",
    glass: "bg-white/10 text-white backdrop-blur-md border border-white/30 hover:bg-white/20",
  };
  return (
    <Magnetic>
      <Tag
        className={`label inline-flex items-center gap-3 rounded-full px-7 py-4 transition-colors duration-500 ${styles[variant]} ${ai ? "ai-glow" : ""} ${className}`}
        {...rest}
      >
        {ai && <Spark className="h-4 w-4" />}
        {children}
      </Tag>
    </Magnetic>
  );
}

export function PlaceholderTag({ children = "Placeholder", className = "" }) {
  return (
    <span className={`label-sm pointer-events-none absolute z-10 rounded-full border border-current/30 bg-white/50 px-2.5 py-1 text-[10px] text-plum/70 backdrop-blur ${className}`}>
      {children}
    </span>
  );
}

export function ChapterLabel({ n, title, dark = false }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${dark ? "text-lavender" : "text-amethyst"}`}>
      <span className="label whitespace-nowrap">Chapter {n}</span>
      <span className="h-px w-8 bg-current opacity-50 sm:w-12" />
      <span className="label whitespace-nowrap">{title}</span>
    </div>
  );
}
