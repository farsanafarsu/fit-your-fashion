"use client";
import { MOODS, PRODUCTS } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import GarmentArt from "../ui/GarmentArt";
import { Scramble } from "../ui/primitives";

// Hovering a mood retints the whole page (see .ambience) and shifts the soundtrack.
export default function Moods() {
  const { mood, setMood, noteMood } = useApp();
  const active = MOODS.find((m) => m.id === mood);
  return (
    <section
      id="moods"
      className="relative overflow-hidden py-24 transition-colors duration-[1200ms] md:py-36"
      style={{ background: active?.tint ?? "#FFFFFF", color: active?.id === "moonlit" ? "#FAF8FD" : "#1E1530" }}
      aria-labelledby="mo-h"
      onPointerLeave={() => setMood(null)}
    >
      <div className="mx-auto max-w-[1500px] px-[var(--gutter)]">
        <p className="label opacity-70">Shop by mood</p>
        <h2 id="mo-h" className="display mt-6 text-[13vw] md:text-[6vw]">How do you want <span className="display-i">to feel?</span></h2>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOODS.map((m, i) => {
            const piece = PRODUCTS.find((p) => p.moods[0] === m.id) ?? PRODUCTS[i];
            const on = mood === m.id;
            return (
              <a
                key={m.id}
                href={`/dressing-room?mood=${m.id}`}
                data-cursor="Feel"
                onPointerEnter={() => { setMood(m.id); noteMood(m.id, 0.3); }}
                onFocus={() => setMood(m.id)}
                onClick={() => noteMood(m.id, 2)}
                className={`group relative block aspect-[3/4] overflow-hidden rounded-[6px] transition-all duration-700 ease-[var(--ease-film)] ${mood && !on ? "opacity-50 saturate-50" : ""}`}
              >
                <GarmentArt product={piece} bg={m.id === "moonlit" ? "dark" : "light"} className="absolute inset-0 transition-transform duration-[1600ms] ease-[var(--ease-film)] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-transparent to-transparent" />
                <div className="absolute inset-x-5 bottom-5 text-pearl">
                  <span className="label-sm opacity-70">0{i + 1}</span>
                  <h3 className="display mt-2 text-[34px] leading-none"><Scramble text={m.name} /></h3>
                  <p className="mt-2 max-h-0 overflow-hidden text-[13px] opacity-0 transition-all duration-700 group-hover:max-h-20 group-hover:opacity-90 group-focus:max-h-20 group-focus:opacity-90">{m.line}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
