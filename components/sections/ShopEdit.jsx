"use client";
import { useMemo } from "react";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";
import { predictSize } from "@/lib/sizing";
import { useApp } from "@/lib/store";
import ProductCard from "../ProductCard";
import { Spark } from "../ui/primitives";

// The shop floor: department filters over the catalogue. Every card carries the size the fit model
// predicts from the visitor's profile, so "Add to bag" is one tap and already in the right size.
export default function ShopEdit() {
  const { body, returnHistory, bag, addToBag, shopCat: cat, setShopCat: setCat } = useApp();
  const items = useMemo(() => PRODUCTS.filter(CATEGORIES.find((c) => c.id === cat).match), [cat]);

  return (
    <section id="shop" data-chapter="#FFFFFF" className="py-24 md:py-32" aria-labelledby="shop-h">
      <div className="mx-auto max-w-[1500px] px-[var(--gutter)]">
        <div className="flex flex-col justify-between gap-8 border-b border-plum/10 pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="label text-amethyst">The Shop · Season 01</p>
            <h2 id="shop-h" className="display mt-5 text-[14vw] sm:text-[9vw] lg:text-[6vw]">Shop <span className="display-i">the edit</span></h2>
          </div>
          <div className="max-w-sm">
            <p className="flex items-start gap-2 text-[14px] leading-relaxed text-ink-soft">
              <Spark className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Sizes on every piece are predicted from your fit profile ({body.height} cm, bust {body.bust}). <a href="#fit" className="text-amethyst underline underline-offset-4">Refine it</a></span>
            </p>
          </div>
        </div>

        <div role="tablist" aria-label="Departments" className="no-scrollbar -mx-[var(--gutter)] mt-8 flex gap-2 overflow-x-auto px-[var(--gutter)]">
          {CATEGORIES.map((c) => {
            const n = PRODUCTS.filter(c.match).length;
            const on = c.id === cat;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={on}
                onClick={() => setCat(c.id)}
                className={`label-sm shrink-0 rounded-full border px-5 py-3 transition-colors duration-300 ${on ? "border-plum bg-plum text-pearl" : "border-plum/15 text-plum/70 hover:border-plum/50"}`}
              >
                {c.name} <span className="ml-1 opacity-50">{n}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:gap-x-8" role="tabpanel">
          {items.map((p) => {
            const fit = predictSize(p, body, returnHistory);
            const inBag = bag.some((b) => b.id === p.id);
            return (
              <div key={p.id} className="flex flex-col">
                <ProductCard product={p} index={PRODUCTS.indexOf(p)} />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-plum/10 pt-4">
                  <span className="label-sm flex items-center gap-1.5 text-amethyst" title={fit.reason}>
                    <Spark className="h-3 w-3" animate={false} />
                    {fit.size === "One size" ? "One size" : `Your size ${fit.size}`}
                    <span className="text-plum/40">· {Math.round(fit.confidence * 100)}%</span>
                  </span>
                  <button
                    onClick={() => addToBag(p.id, fit.size)}
                    className={`label-sm rounded-full px-4 py-2.5 transition-colors duration-300 ${inBag ? "bg-mist text-plum" : "bg-plum text-pearl hover:bg-amethyst"}`}
                  >
                    {inBag ? "In bag ✓" : "Add to bag"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
