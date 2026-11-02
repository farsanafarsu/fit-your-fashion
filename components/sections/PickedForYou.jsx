"use client";
import { useMemo } from "react";
import { PRODUCTS, MOODS } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import ProductCard from "../ProductCard";
import { Spark } from "../ui/primitives";

// Rail reorders from the style profile: mood affinity (hover, clicks) + recently viewed pieces.
export default function PickedForYou() {
  const { moodWeights, viewed, topMood } = useApp();
  const ranked = useMemo(() => {
    const score = (p) => p.moods.reduce((s, m) => s + (moodWeights[m] ?? 0), 0) + (viewed.includes(p.id) ? 1.5 - viewed.indexOf(p.id) * 0.1 : 0);
    return [...PRODUCTS].sort((a, b) => score(b) - score(a));
  }, [moodWeights, viewed]);
  const why = topMood ? `Because you’re drawn to ${MOODS.find((m) => m.id === topMood)?.name}.` : "Explore a little — this rail learns from what you linger on.";

  return (
    <section className="bg-white py-24 md:py-32" aria-labelledby="pk-h">
      <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-4 px-[var(--gutter)] md:flex-row md:items-end">
        <div>
          <p className="label flex items-center gap-2 text-amethyst"><Spark className="h-3.5 w-3.5" /> AI-curated</p>
          <h2 id="pk-h" className="display mt-5 text-[13vw] md:text-[5.5vw]">Picked <span className="display-i">for you</span></h2>
        </div>
        <p className="text-[14px] text-ink-soft" aria-live="polite">{why}</p>
      </div>
      <div className="no-scrollbar mt-12 flex snap-x gap-5 overflow-x-auto px-[var(--gutter)] pb-4">
        {ranked.map((p) => (
          <ProductCard key={p.id} product={p} className="w-[62vw] shrink-0 snap-start sm:w-[34vw] lg:w-[21vw]" />
        ))}
      </div>
    </section>
  );
}
