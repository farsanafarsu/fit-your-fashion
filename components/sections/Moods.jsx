"use client";
import { useRef } from "react";
import { MOODS, PRODUCTS } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import GarmentArt from "../ui/GarmentArt";
import { Scramble } from "../ui/primitives";

// Hovering a mood retints the whole page (see .ambience) and shifts the soundtrack.
// Touch has no hover: the first tap previews the mood, the second opens it.
export default function Moods() {
  const { mood, setMood, noteMood } = useApp();
  const pointer = useRef("mouse");
  const active = MOODS.find((m) => m.id === mood);
  return (
    <section
      id="moods"
      data-chapter="#FFFFFF"
      data-tint /* transparent: hovering a mood retints the page backdrop itself (see Backdrop) */
      className="relative overflow-hidden py-24 transition-colors duration-[1200ms] md:py-36"
      style={{ color: active?.id === "moonlit" ? "#FAF8FD" : "#1E1530" }}
      aria-labelledby="mo-h"
      onPointerLeave={(e) => e.pointerType === "mouse" && setMood(null)} /* touch fires leave on lift */
    >
      <div className="mx-auto max-w-[1500px] px-[var(--gutter)]">
        <p className="label opacity-70">Shop by mood</p>
        <h2 id="mo-h" className="display mt-6 text-[13vw] sm:text-[9vw] lg:text-[6vw]">How do you want <span className="display-i">to feel?</span></h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-14 lg:grid-cols-4">
          {MOODS.map((m, i) => {
            const piece = PRODUCTS.find((p) => p.moods[0] === m.id) ?? PRODUCTS[i];
            const on = mood === m.id;
            return (
              <a
                key={m.id}
                href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/dressing-room/?mood=${m.id}`}
                data-cursor="Feel"
                onPointerDown={(e) => (pointer.current = e.pointerType)}
                onPointerEnter={(e) => { if (e.pointerType !== "mouse") return; setMood(m.id); noteMood(m.id, 0.3); }}
                onFocus={() => setMood(m.id)}
                onClick={(e) => {
                  if (pointer.current !== "mouse" && !on) {
                    e.preventDefault();
                    setMood(m.id);
                    noteMood(m.id, 0.3);
                    return;
                  }
                  noteMood(m.id, 2);
                }}
                className={`group relative block aspect-[3/4] overflow-hidden rounded-[6px] transition-all duration-700 ease-[var(--ease-film)] ${mood && !on ? "opacity-50 saturate-50" : ""}`}
              >
                <GarmentArt product={piece} bg={m.id === "moonlit" ? "dark" : "light"} className="absolute inset-0 transition-transform duration-[1600ms] ease-[var(--ease-film)] group-hover:scale-110" tag={false} />
                <span className="label-sm absolute right-2 top-2 rounded-full bg-white/60 px-2 py-1 text-[10px] text-plum/60 backdrop-blur">Photo placeholder</span>
                <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-transparent to-transparent" />
                <div className="absolute inset-x-3 bottom-3 text-pearl sm:inset-x-5 sm:bottom-5">
                  <span className="label-sm opacity-70">0{i + 1}</span>
                  <h3 className="display mt-1.5 text-[22px] leading-[0.95] sm:mt-2 sm:text-[34px]"><Scramble text={m.name} /></h3>
                  <p className={`mt-2 overflow-hidden text-[12px] leading-snug transition-all duration-700 sm:text-[13px] ${on ? "max-h-24 opacity-90" : "max-h-0 opacity-0"} group-hover:max-h-24 group-hover:opacity-90`}>{m.line}</p>
                  {on && <span className="label-sm mt-2 inline-block rounded-full bg-pearl/90 px-3 py-1.5 text-plum lg:hidden">Tap to explore →</span>}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
