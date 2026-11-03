"use client";
import Image from "next/image";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { useLenis } from "../SmoothScroll";

// Shop by category: a bento of department tiles. Choosing one filters the shop grid below and
// glides to it. The order fills a 4×3 grid on desktop and pairs up cleanly in two columns on phones.
const LAYOUT = {
  dresses: "col-span-2 row-span-2 md:col-span-2 md:row-span-2",
  sarees: "row-span-2 md:row-span-2",
  tailoring: "",
  jewellery: "",
  bridal: "col-span-2 md:col-span-2",
  separates: "",
  capes: "",
};
const ORDER = ["dresses", "sarees", "tailoring", "jewellery", "bridal", "separates", "capes"];
const pad = (n) => String(n).padStart(2, "0");

export default function ShopByCategory() {
  const { setShopCat } = useApp();
  const lenis = useLenis();
  const open = (id) => {
    setShopCat(id);
    if (lenis) lenis.scrollTo("#shop", { offset: -10, duration: 1.4 });
    else document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="categories" data-chapter="#FAF8FD" className="py-24 md:py-32" aria-labelledby="cat-h">
      <div className="mx-auto max-w-[1500px] px-[var(--gutter)]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="label text-amethyst">The wardrobe</p>
            <h2 id="cat-h" className="display mt-5 text-[14vw] sm:text-[9vw] lg:text-[6vw]">Shop <span className="display-i">by category</span></h2>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-ink-soft">Seven departments, one season. Every piece comes with an AI-predicted size and a virtual try-on.</p>
        </div>

        <ul className="mt-12 grid auto-rows-[44vw] grid-flow-dense grid-cols-2 gap-3 sm:auto-rows-[30vw] md:auto-rows-[min(21vw,300px)] md:grid-cols-4 md:gap-4">
          {ORDER.map((id, n) => {
            const c = CATEGORIES.find((x) => x.id === id);
            const count = PRODUCTS.filter(c.match).length;
            const big = id === "dresses";
            return (
              <li key={id} className={LAYOUT[id]}>
                <button
                  onClick={() => open(id)}
                  className="group relative block h-full w-full overflow-hidden rounded-[22px] bg-plum text-left text-pearl"
                  data-cursor="Shop"
                  aria-label={`Shop ${c.name}, ${count} pieces`}
                >
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes={big ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                    className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-film)] group-hover:scale-[1.07]"
                    style={{ objectPosition: id === "bridal" ? "50% 35%" : "50% 25%" }}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#120c1f]/90 via-[#120c1f]/15 to-transparent transition-opacity duration-700 group-hover:opacity-90" aria-hidden />
                  <span className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#120c1f]/45 to-transparent" aria-hidden />
                  <span className="pointer-events-none absolute inset-2 rounded-[16px] border border-white/0 transition-colors duration-700 group-hover:border-white/25" aria-hidden />

                  <span className="absolute left-4 top-4 flex items-center gap-2 sm:left-5 sm:top-5">
                    <span className="label-sm rounded-full bg-white/15 px-2.5 py-1.5 text-[10px] text-pearl backdrop-blur-md">{pad(n + 1)}</span>
                    <span className="label-sm hidden text-[10px] text-pearl/80 sm:inline">{count} {count === 1 ? "piece" : "pieces"}</span>
                  </span>

                  <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
                    <span className="min-w-0">
                      <span className={`display block leading-[0.95] ${big ? "text-[9vw] md:text-[min(3.6vw,52px)]" : "text-[6.4vw] sm:text-[4vw] md:text-[min(2.1vw,30px)]"}`}>{c.name}</span>
                      <span className={`mt-2 block text-[12.5px] leading-snug text-pearl/70 ${big ? "max-w-xs" : "hidden lg:block"}`}>{c.line}</span>
                    </span>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pearl text-plum transition-transform duration-500 group-hover:-rotate-45 sm:h-11 sm:w-11" aria-hidden>→</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="label-sm mt-5 text-plum/35">Imagery: Unsplash placeholders</p>
      </div>
    </section>
  );
}
