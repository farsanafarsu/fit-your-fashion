"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { gsap } from "gsap";

// "The Lavender Hour" as a clock. setProgress(0→1) runs dusk → night: the hands sweep from
// 18:47 to 19:59, the sky darkens, the sun sets below the horizon, the moon and stars rise.
// Driven imperatively (no React re-render per scroll frame).
const START = 18 * 60 + 47;
const SPAN = 72; // minutes
const C = 200; // centre
const skyTop = gsap.utils.interpolate("#F3D9EC", "#1E1530");
const skyMid = gsap.utils.interpolate("#D9C7F0", "#2A1F44");
const skyLow = gsap.utils.interpolate("#B9A3DB", "#3A2B5C");
const ringInk = gsap.utils.interpolate("#6E4FA8", "#C9B6E4");
const lerp = (a, b, t) => a + (b - a) * t;
const pad = (n) => String(n).padStart(2, "0");
// Rounded so server and browser trig produce identical markup (avoids hydration mismatches).
const rd = (n) => Math.round(n * 100) / 100;

const Dial = forwardRef(function Dial({ className = "", idPrefix = "d" }, ref) {
  const r = {
    minute: useRef(null), hour: useRef(null), s1: useRef(null), s2: useRef(null), s3: useRef(null),
    sun: useRef(null), moon: useRef(null), shade: useRef(null), stars: useRef(null), time: useRef(null), phase: useRef(null), ring: useRef(null),
  };

  useImperativeHandle(ref, () => ({
    setProgress(p) {
      const t = Math.max(0, Math.min(1, p));
      const mins = START + Math.round(t * SPAN);
      const h = Math.floor(mins / 60), m = mins % 60;
      r.minute.current?.setAttribute("transform", `rotate(${(m / 60) * 360} ${C} ${C})`);
      r.hour.current?.setAttribute("transform", `rotate(${((h % 12) + m / 60) * 30} ${C} ${C})`);
      r.s1.current?.setAttribute("stop-color", skyTop(t));
      r.s2.current?.setAttribute("stop-color", skyMid(t));
      r.s3.current?.setAttribute("stop-color", skyLow(t));
      r.shade.current?.setAttribute("fill", skyTop(t)); // crescent shadow matches the sky behind it
      // sun sinks below the horizon in the first two-thirds; moon rises in the last two-thirds
      const ts = Math.min(1, t / 0.66), tm = Math.max(0, (t - 0.34) / 0.66);
      r.sun.current?.setAttribute("transform", `translate(${lerp(150, 172, ts)} ${lerp(196, 268, ts)})`);
      r.moon.current?.setAttribute("transform", `translate(${lerp(262, 244, tm)} ${lerp(268, 158, tm)})`);
      if (r.stars.current) r.stars.current.style.opacity = String(Math.max(0, (t - 0.45) / 0.55));
      if (r.ring.current) r.ring.current.style.color = ringInk(t);
      if (r.time.current) r.time.current.textContent = `${pad(h)}:${pad(m)}`;
      if (r.phase.current) r.phase.current.textContent = t < 0.34 ? "Dusk" : t < 0.7 ? "The lavender hour" : "Night";
    },
  }));

  const sky = `${idPrefix}-sky`, clip = `${idPrefix}-clip`, above = `${idPrefix}-above`;
  return (
    <div className={className}>
      <svg viewBox="0 0 400 400" className="block h-auto w-full overflow-visible" role="img" aria-label="A clock running from dusk to night as you travel the collection">
        <defs>
          <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
            <stop ref={r.s1} offset="0" stopColor="#F3D9EC" />
            <stop ref={r.s2} offset=".55" stopColor="#D9C7F0" />
            <stop ref={r.s3} offset="1" stopColor="#B9A3DB" />
          </linearGradient>
          <clipPath id={clip}><circle cx={C} cy={C} r="128" /></clipPath>
          <clipPath id={above}><rect x="0" y="0" width="400" height="236" /></clipPath>
        </defs>

        {/* sky disc with horizon */}
        <g clipPath={`url(#${clip})`}>
          <rect x="60" y="60" width="280" height="280" fill={`url(#${sky})`} />
          <g ref={r.stars} style={{ opacity: 0 }} fill="#FAF8FD">
            {[[130, 120, 1.6], [180, 98, 1.1], [228, 126, 1.4], [268, 104, 1], [150, 160, 0.9], [290, 150, 1.3], [205, 150, 0.8], [110, 186, 1]].map(([x, y, s], i) => (
              <circle key={i} cx={x} cy={y} r={s} />
            ))}
          </g>
          <g clipPath={`url(#${above})`}>
            <g ref={r.sun} transform="translate(150 196)">
              <circle r="30" fill="#FFE9DA" opacity=".35" />
              <circle r="17" fill="#FFF4EC" />
            </g>
          </g>
          <g ref={r.moon} transform="translate(262 268)">
            <circle r="14" fill="#FAF8FD" />
            <circle ref={r.shade} r="13" cx="6" cy="-4" fill="#F3D9EC" />
          </g>
          {/* water below the horizon reflects the sky, darker */}
          <rect x="60" y="236" width="280" height="110" fill="#1E1530" opacity=".18" />
          <line x1="60" y1="236" x2="340" y2="236" stroke="#FAF8FD" strokeOpacity=".6" strokeWidth="1" />
        </g>

        {/* ring, ticks, numerals */}
        <g ref={r.ring} style={{ color: "#6E4FA8" }}>
          <circle cx={C} cy={C} r="196" fill="none" stroke="currentColor" strokeOpacity=".22" />
          <circle cx={C} cy={C} r="136" fill="none" stroke="currentColor" strokeOpacity=".35" />
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
            const r1 = big ? 166 : 176, r2 = 186;
            return <line key={i} x1={rd(C + Math.sin(a) * r1)} y1={rd(C - Math.cos(a) * r1)} x2={rd(C + Math.sin(a) * r2)} y2={rd(C - Math.cos(a) * r2)} stroke="currentColor" strokeOpacity={big ? 0.9 : 0.35} strokeWidth={big ? 1.6 : 1} />;
          })}
          {[["XII", 0], ["III", 90], ["VI", 180], ["IX", 270]].map(([n, deg]) => {
            const a = (deg / 180) * Math.PI;
            return (
              <text key={n} x={rd(C + Math.sin(a) * 151)} y={rd(C - Math.cos(a) * 151 + 6)} textAnchor="middle" fill="currentColor" style={{ fontFamily: "var(--font-bodoni)", fontSize: 17, fontStyle: "italic" }}>
                {n}
              </text>
            );
          })}
        </g>

        {/* hands */}
        <g ref={r.hour} transform={`rotate(${(6 + 47 / 60) * 30} ${C} ${C})`}>
          <path d={`M${C - 3} ${C + 14} L${C} ${C - 78} L${C + 3} ${C + 14} Z`} fill="#1E1530" />
        </g>
        <g ref={r.minute} transform={`rotate(${(47 / 60) * 360} ${C} ${C})`}>
          <path d={`M${C - 1.6} ${C + 20} L${C} ${C - 118} L${C + 1.6} ${C + 20} Z`} fill="#6E4FA8" />
          <circle cx={C} cy={C - 118} r="3" fill="#6E4FA8" />
        </g>
        <circle cx={C} cy={C} r="5.5" fill="#1E1530" />
        <circle cx={C} cy={C} r="2" fill="#FAF8FD" />
      </svg>
      <div className="mt-3 flex items-baseline justify-center gap-3 text-center">
        <span ref={r.time} className="display tabular-nums text-[clamp(22px,2.6vw,40px)] leading-none">18:47</span>
        <span ref={r.phase} className="label-sm text-amethyst">Dusk</span>
      </div>
    </div>
  );
});

export default Dial;
