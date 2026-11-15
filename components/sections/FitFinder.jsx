"use client";
import { PRODUCTS } from "@/lib/catalog";
import { bodyFromHeight, predictSize } from "@/lib/sizing";
import { useApp } from "@/lib/store";
import GarmentArt from "../ui/GarmentArt";
import { ChapterLabel, Spark } from "../ui/primitives";

// AI Fit Finder: the same size model the bag and dressing room use, opened up. Edits write straight
// to the shared fit profile, so every size on the site updates as the sliders move.
const FIELDS = [
  ["height", "Height", 145, 190],
  ["bust", "Bust", 74, 112],
  ["waist", "Waist", 56, 96],
  ["hip", "Hip", 82, 120],
];
const HISTORY = [
  ["tight", "Often too tight"],
  ["none", "Usually right"],
  ["loose", "Often too loose"],
];

export default function FitFinder() {
  const { body, setBody, returnHistory, setReturnHistory } = useApp();
  const pieces = PRODUCTS.filter((p) => p.slot !== "accessory");

  return (
    <section id="fit" data-chapter="#1E1530" className="on-dark relative overflow-x-clip py-24 text-pearl md:py-32" aria-labelledby="fit-h">
      <div className="pointer-events-none absolute -right-[20vmax] top-0 h-[60vmax] w-[60vmax] rounded-full bg-amethyst/30 blur-[140px]" aria-hidden />
      <div className="relative mx-auto grid max-w-[1500px] gap-14 px-[var(--gutter)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div>
          <ChapterLabel n="AI" title="Fit Finder" dark />
          <h2 id="fit-h" className="display mt-7 text-[14vw] sm:text-[9vw] lg:text-[5.4vw]">Your size, <span className="display-i text-lavender">before the box.</span></h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-mist/75">
            Four measurements and one honest answer about how things usually fit. The model reads each garment’s cut and ease, then predicts your size piece by piece.
          </p>

          <div className="mt-10 space-y-6">
            {FIELDS.map(([k, label, min, max]) => (
              <label key={k} className="block">
                <span className="flex items-baseline justify-between">
                  <span className="label-sm text-lavender">{label}</span>
                  <span className="display text-[26px] tabular-nums">{body[k]}<span className="ml-1 text-[14px] text-mist/50">cm</span></span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={body[k]}
                  onChange={(e) => {
                    const v = +e.target.value;
                    // height alone re-estimates the rest until the user sets them by hand
                    setBody(k === "height" ? { ...body, ...bodyFromHeight(v) } : { ...body, [k]: v });
                  }}
                  className="mt-2 w-full accent-lavender"
                />
              </label>
            ))}
          </div>

          <fieldset className="mt-9">
            <legend className="label-sm text-lavender">Clothes I return are…</legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {HISTORY.map(([v, t]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={returnHistory === v}
                  onClick={() => setReturnHistory(v)}
                  className={`rounded-2xl border px-3 py-3 text-[13px] transition-colors duration-300 ${returnHistory === v ? "border-lavender bg-lavender text-plum" : "border-white/15 text-mist/80 hover:border-white/40"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="mt-5 text-[12px] text-mist/50">Saved on this device only. Size chart is a placeholder until final grading.</p>
        </div>

        <ul className="grid content-start gap-3 sm:grid-cols-2" aria-live="polite">
          {pieces.map((p) => {
            const r = predictSize(p, body, returnHistory);
            return (
              <li key={p.id} className="flex gap-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
                <GarmentArt product={p} className="aspect-[3/4] w-20 shrink-0 rounded-xl" tag={false} sizes="80px" />
                <div className="min-w-0 flex-1 py-1">
                  <p className="display truncate text-[20px] leading-tight">{p.name}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="display text-[30px] leading-none text-lavender">{r.size}</span>
                    <div className="flex-1">
                      <div className="h-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-amethyst to-lavender transition-[width] duration-500" style={{ width: `${Math.round(r.confidence * 100)}%` }} />
                      </div>
                      <p className="label-sm mt-1.5 text-mist/60"><Spark className="mr-1 inline h-2.5 w-2.5" animate={false} />{r.level} · {Math.round(r.confidence * 100)}%</p>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-mist/60">{r.reason}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
