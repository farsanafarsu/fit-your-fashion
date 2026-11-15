"use client";
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import { gsap } from "gsap";

// Hand-signed brand signature. The script's outlines are inked while a mask sweeps left → right like
// a pen, the ink then fills in and a flourish underlines it. trigger: "view" (writes when scrolled
// into view) or "manual" (the parent calls ref.play(), which resolves when the signing ends).
const Signature = forwardRef(function Signature({ text = "Fit Your Fashion", className = "", trigger = "view", duration = 1.9, strokeWidth = 1.1, flourish = true }, ref) {
  const uid = useId().replace(/:/g, "");
  const svg = useRef(null);
  const ink = useRef(null);
  const swash = useRef(null);
  const pen = useRef(null);
  const tl = useRef(null);
  const pending = useRef(null); // play() requested before the font had loaded
  const [geo, setGeo] = useState(null); // { box, swash } measured from the real glyphs

  // Fit the viewBox to the loaded script glyphs and draw the flourish under them.
  useEffect(() => {
    let live = true;
    const measure = () => {
      if (!live || !ink.current) return;
      const b = ink.current.getBBox();
      const x0 = b.x + b.width * 0.06, x1 = b.x + b.width * 0.99, y = b.y + b.height * 0.86;
      const d = `M ${x0} ${y} C ${x0 + b.width * 0.32} ${y + b.height * 0.2}, ${x0 + b.width * 0.62} ${y - b.height * 0.02}, ${x1} ${y - b.height * 0.24}`;
      const pad = b.height * 0.12;
      setGeo({ box: `${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height * 1.2 + pad * 2}`, swash: d });
    };
    // next/font renames the family, so load whatever the element actually resolves to
    const family = getComputedStyle(ink.current).fontFamily;
    document.fonts.load(`120px ${family}`).catch(() => {}).finally(() => document.fonts.ready.then(measure));
    return () => { live = false; };
  }, [text]);

  // Build the signing timeline once the geometry is known.
  useEffect(() => {
    if (!geo) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sw = swash.current;
    const swLen = sw ? sw.getTotalLength() : 0;
    const t = gsap.timeline({ paused: true });
    t.set(ink.current, { strokeDasharray: 1400, strokeDashoffset: 1400, fillOpacity: 0 })
      .set(pen.current, { attr: { width: 0 } });
    if (sw) t.set(sw, { strokeDasharray: swLen, strokeDashoffset: swLen });
    if (reduce) {
      t.set(pen.current, { attr: { width: 1 } }).set(ink.current, { strokeDashoffset: 0, fillOpacity: 1 });
      if (sw) t.set(sw, { strokeDashoffset: 0 });
    } else {
      t.to(pen.current, { attr: { width: 1 }, duration, ease: "power1.inOut" }, 0)
        .to(ink.current, { strokeDashoffset: 0, duration: duration * 1.05, ease: "power1.inOut" }, 0)
        .to(ink.current, { fillOpacity: 1, duration: 0.9, ease: "power2.out" }, duration * 0.55);
      if (sw) t.to(sw, { strokeDashoffset: 0, duration: 0.75, ease: "power2.inOut" }, duration * 0.85);
    }
    tl.current = t;
    if (pending.current) { t.eventCallback("onComplete", pending.current); t.play(0); pending.current = null; }

    let io;
    if (trigger === "view") {
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { t.play(0); io.disconnect(); } }, { threshold: 0.5 });
      io.observe(svg.current);
    }
    return () => { io?.disconnect(); t.kill(); };
  }, [geo, trigger, duration]);

  useImperativeHandle(ref, () => ({
    play: () => new Promise((res) => {
      if (tl.current) { tl.current.eventCallback("onComplete", res); tl.current.play(0); }
      else pending.current = res;
    }),
    finish: () => tl.current?.progress(1),
  }), []);

  return (
    <svg ref={svg} viewBox={geo?.box ?? "0 -110 760 160"} className={`overflow-visible ${className}`} role="img" aria-label={text} style={{ visibility: geo ? "visible" : "hidden" }}>
      <defs>
        <clipPath id={`pen${uid}`} clipPathUnits="objectBoundingBox">
          <rect ref={pen} x="0" y="-0.5" width="0" height="2" />
        </clipPath>
      </defs>
      <g clipPath={`url(#pen${uid})`}>
        <text ref={ink} x="0" y="0" fontSize="120" fill="currentColor" stroke="currentColor" strokeWidth={strokeWidth} style={{ fontFamily: "var(--font-script), cursive", fillOpacity: 0 }}>
          {text}
        </text>
        {flourish && geo && <path ref={swash} d={geo.swash} fill="none" stroke="currentColor" strokeWidth={strokeWidth * 1.6} strokeLinecap="round" />}
      </g>
    </svg>
  );
});

export default Signature;
