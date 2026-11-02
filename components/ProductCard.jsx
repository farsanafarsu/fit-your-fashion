"use client";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import GarmentArt from "./ui/GarmentArt";

// Editorial product card: second angle crossfades in on hover.
export default function ProductCard({ product, index, className = "", aspect = "aspect-[3/4]", dark = false }) {
  const { toggleWish, wishlist, noteView, noteMood } = useApp();
  const saved = wishlist.includes(product.id);
  return (
    <article className={`group relative ${className}`}>
      <Link
        href={`/dressing-room?look=${product.id}`}
        data-cursor="Try on"
        onClick={() => {
          noteView(product.id);
          product.moods.forEach((m) => noteMood(m, 0.5));
        }}
        className="block"
      >
        <div className={`relative overflow-hidden rounded-[4px] ${aspect}`}>
          <GarmentArt product={product} bg={dark ? "dark" : "light"} className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--ease-film)] group-hover:scale-[1.04]" />
          <GarmentArt product={product} angle={1} bg={dark ? "dark" : "light"} className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        </div>
        <div className="mt-4">
          {index != null && <span className="label-sm mr-3 opacity-50">{String(index + 1).padStart(2, "0")}</span>}
          <h3 className="display inline text-[22px] leading-[1.05] tracking-[-0.02em] sm:text-[26px]">{product.name}</h3>
          {/* details and price share a row so narrow cards never squeeze the name */}
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <p className="label-sm min-w-0 truncate opacity-60">{product.fabric} · {product.colourName}</p>
            <span className="shrink-0 text-[13px] opacity-70" title="Placeholder price">{formatPrice()}</span>
          </div>
        </div>
      </Link>
      <button
        onClick={() => toggleWish(product.id)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-white/70 text-plum backdrop-blur transition hover:bg-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        </svg>
      </button>
    </article>
  );
}
