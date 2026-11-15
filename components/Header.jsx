"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES, MOODS, PRODUCTS } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { useLenis } from "./SmoothScroll";
import { Spark } from "./ui/primitives";

const Icon = {
  search: <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  bag: <path d="M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" />,
  menu: <path d="M4 8h16M4 16h10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  soundOn: <path d="M4 10v4h3l4 4V6L7 10H4Zm11-1.5a4 4 0 0 1 0 7M17.5 6a7.5 7.5 0 0 1 0 12" />,
  soundOff: <path d="M4 10v4h3l4 4V6L7 10H4Zm12 0 4 4m0-4-4 4" />,
};
const Svg = ({ k, className = "h-[18px] w-[18px]" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {Icon[k]}
  </svg>
);

const NAV = [["Collection", "/#collection"], ["Dressing Room", "/dressing-room"], ["Fit Finder", "/#fit"], ["Story", "/#story"]];
const ANNOUNCE = [
  ["Season 01 · The Lavender Hour is here", "/#collection"],
  ["Try every piece on your own avatar in the AI Dressing Room", "/dressing-room"],
  ["Your size, predicted piece by piece · Open the Fit Finder", "/#fit"],
];
const AI_TOOLS = [
  ["AI Stylist", "Dressed by occasion", "stylist"],
  ["Virtual try-on", "Your avatar, your size", "/dressing-room"],
  ["Fit Finder", "Size predicted per piece", "/#fit"],
  ["Colour analysis", "Shades that suit you", "/#atelier"],
];
const SHOP_CATS = CATEGORIES.filter((c) => c.id !== "all");
const count = (c) => PRODUCTS.filter(c.match).length;

// Two-tier header: a rotating announcement strip that tucks away once you scroll, and a full-width
// bar that is midnight over the homepage hero and frosted pearl everywhere else. "Shop" opens a mega
// menu (categories, moods, AI services, features); phones get a full-screen menu instead.
export default function Header() {
  const { setPanel, bag, wishlist, sound, setSound, setShopCat } = useApp();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [mega, setMega] = useState(false);
  const [menu, setMenu] = useState(false);
  const [note, setNote] = useState(0);
  const onHome = usePathname() === "/";
  const router = useRouter();
  const lenis = useLenis();
  const fab = !onHome || pastHero; // on the homepage the mobile stylist button waits until the hero scrolls away
  const dark = menu || (onHome && !solid && !mega); // midnight over the hero and behind the phone menu
  const last = useRef(0);
  const closeTimer = useRef(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setHidden(y > 160 && y > last.current);
      setSolid(y > 40);
      // the hero is pinned while its looks play, so measure where it actually is rather than scroll distance
      const hero = document.querySelector("[data-hero]");
      setPastHero(!hero || hero.getBoundingClientRect().bottom < window.innerHeight * 0.3);
      last.current = y;
    };
    // at most once per frame: scroll events can fire several times a frame, and each read forces layout
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // announcement strip rotates
  useEffect(() => {
    const t = setInterval(() => setNote((n) => (n + 1) % ANNOUNCE.length), 4800);
    return () => clearInterval(t);
  }, []);

  // Esc closes menus; Ctrl/⌘+K opens search from anywhere
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") { setMega(false); setMenu(false); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setMenu(false); setPanel("search"); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [setPanel]);

  // the phone menu holds the page still underneath it
  useEffect(() => {
    if (menu) lenis?.stop();
    else lenis?.start();
  }, [menu, lenis]);

  // Same-page anchors glide with Lenis; everything else routes normally.
  const go = (href) => {
    setMega(false);
    setMenu(false);
    if (onHome && href.startsWith("/#")) {
      const target = href.slice(1);
      if (lenis) lenis.scrollTo(target, { offset: -10, duration: 1.4 });
      else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
    } else router.push(href);
  };
  const tool = (href) => (href === "stylist" ? (setMega(false), setMenu(false), setPanel("stylist")) : go(href));
  const shopCategory = (id) => { setShopCat(id); go("/#shop"); };

  const openMega = () => { clearTimeout(closeTimer.current); setMega(true); };
  const closeMega = () => { closeTimer.current = setTimeout(() => setMega(false), 140); };

  const tone = dark ? "text-pearl" : "text-plum";
  const iconBtn = `relative grid h-10 w-10 place-items-center rounded-full transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-plum/[0.06]"}`;
  const link = "label-sm relative py-2 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 hover:after:scale-x-100";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[90] transition-transform duration-700 ease-[var(--ease-film)] ${hidden && !mega && !menu ? "-translate-y-full" : solid && !menu ? "-translate-y-8" : ""}`}
        onMouseLeave={closeMega}
      >
        {/* ── Announcement strip (32px) ─────────────────────── */}
        <div className={`relative h-8 overflow-hidden text-pearl transition-colors duration-500 ${dark && !menu ? "bg-[#06121f]/55" : "bg-[#120c1f]"}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.button
              key={note}
              onClick={() => go(ANNOUNCE[note][1])}
              className="label-sm absolute inset-0 flex items-center justify-center gap-2 px-4 text-[10px] text-pearl/85 hover:text-pearl"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ y: -14, opacity: 0, transition: { duration: 0.3 } }}
            >
              <Spark className="h-2.5 w-2.5 shrink-0" animate={false} />
              <span className="truncate">{ANNOUNCE[note][0]}</span>
              <span aria-hidden>→</span>
            </motion.button>
          </AnimatePresence>
        </div>

        {/* ── Main bar (64px) ───────────────────────────────── */}
        <div
          className={`relative border-b transition-[background-color,border-color,box-shadow,color] duration-500 ${tone} ${
            // over the homepage hero the bar is clear so the night sky runs up behind the nav
            menu ? "border-white/10 bg-[#1a1229]" : dark ? "border-white/10 bg-transparent" :"border-plum/10 bg-pearl shadow-[0_12px_40px_-24px_rgba(30,21,48,.35)]"
          }`}
        >
          <div className="mx-auto grid h-16 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-[var(--gutter)]">
            {/* left: phone menu button / desktop nav */}
            <div className="flex items-center">
              <button onClick={() => { setMenu(!menu); setMega(false); }} className={`${iconBtn} -ml-2 xl:hidden`} aria-expanded={menu} aria-controls="phone-menu" aria-label={menu ? "Close menu" : "Open menu"}>
                <Svg k={menu ? "close" : "menu"} className="h-5 w-5" />
              </button>
              <nav className="hidden items-center gap-6 whitespace-nowrap xl:flex 2xl:gap-8" aria-label="Primary">
                <button
                  className={`${link} flex items-center gap-1.5`}
                  onMouseEnter={openMega}
                  onFocus={openMega}
                  onClick={() => (mega ? setMega(false) : openMega())}
                  aria-expanded={mega}
                  aria-controls="mega-menu"
                >
                  Shop
                  <svg viewBox="0 0 10 6" className={`h-1.5 w-2.5 transition-transform duration-300 ${mega ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden><path d="M1 1l4 4 4-4" /></svg>
                </button>
                {NAV.map(([t, h]) => (
                  <Link key={t} href={h} onClick={(e) => { if (h.startsWith("/#") && onHome) { e.preventDefault(); go(h); } }} onMouseEnter={closeMega} className={link}>
                    {t}
                  </Link>
                ))}
              </nav>
            </div>

            {/* centre: wordmark */}
            <Link href="/" onClick={() => setMenu(false)} className="group flex flex-col items-center leading-none" aria-label="Fit Your Fashion home">
              <span className="display whitespace-nowrap text-[18px] tracking-[0.14em] sm:text-[23px] sm:tracking-[0.22em]">FIT YOUR FASHION</span>
              <span className={`label-sm mt-1 hidden text-[8.5px] tracking-[0.42em] sm:block ${dark ? "text-lavender/80" : "text-amethyst/80"}`}>AI couture atelier</span>
            </Link>

            {/* right: actions */}
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => setPanel("search")}
                className={`hidden h-10 w-[200px] items-center gap-2.5 rounded-full border px-4 text-left text-[12.5px] transition-colors 2xl:flex ${dark ? "border-white/15 text-pearl/55 hover:border-white/35" : "border-plum/12 text-plum/50 hover:border-plum/35"}`}
                aria-label="Search"
              >
                <Svg k="search" className="h-4 w-4" />
                <span className="flex-1">Search</span>
                <kbd className={`rounded-md px-1.5 py-0.5 font-sans text-[10px] ${dark ? "bg-white/10" : "bg-plum/[0.06]"}`}>Ctrl K</kbd>
              </button>
              <button className={`${iconBtn} 2xl:hidden`} onClick={() => setPanel("search")} aria-label="Search">
                <Svg k="search" />
              </button>
              <button onClick={() => setPanel("stylist")} className="ai-glow label-sm mx-1.5 hidden items-center gap-2 rounded-full bg-pearl px-4 py-2.5 text-plum md:inline-flex" data-cursor="Ask">
                <Spark className="h-3.5 w-3.5" /> AI Stylist
              </button>
              <button className={`${iconBtn} hidden lg:grid`} onClick={() => setSound(!sound)} aria-pressed={sound} aria-label={sound ? "Mute ambient sound" : "Play ambient sound"} data-cursor={sound ? "Mute" : "Sound"}>
                <Svg k={sound ? "soundOn" : "soundOff"} />
              </button>
              <button className={`${iconBtn} hidden sm:grid`} onClick={() => setPanel("wishlist")} aria-label={`Wishlist, ${wishlist.length} items`}>
                <Svg k="heart" />
                {wishlist.length > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amethyst px-1 text-[9px] text-white">{wishlist.length}</span>}
              </button>
              <button className={`${iconBtn} -mr-2`} onClick={() => setPanel("bag")} aria-label={`Bag, ${bag.length} items`}>
                <Svg k="bag" />
                {bag.length > 0 && <span className={`absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] ${dark ? "bg-pearl text-plum" : "bg-plum text-pearl"}`}>{bag.length}</span>}
              </button>
            </div>
          </div>

          {/* ── Shop mega menu (desktop) ─────────────────────── */}
          <AnimatePresence>
            {mega && (
              <motion.div
                id="mega-menu"
                className="absolute inset-x-0 top-full hidden border-b border-plum/10 bg-pearl text-plum shadow-[0_40px_80px_-40px_rgba(30,21,48,.45)] xl:block"
                initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)", transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)", transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] } }}
                onMouseEnter={openMega}
              >
                <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_0.9fr_1fr_1.7fr] gap-12 px-[var(--gutter)] py-10">
                  <div>
                    <p className="label-sm text-amethyst">Shop by category</p>
                    <ul className="mt-4 space-y-0.5">
                      <li>
                        <button onClick={() => shopCategory("all")} className="display group flex w-full items-baseline justify-between py-1.5 text-left text-[22px] hover:text-amethyst">
                          Shop all <span className="font-sans text-[11px] text-plum/40">{PRODUCTS.length}</span>
                        </button>
                      </li>
                      {SHOP_CATS.map((c) => (
                        <li key={c.id}>
                          <button onClick={() => shopCategory(c.id)} className="display group flex w-full items-baseline justify-between py-1.5 text-left text-[22px] transition-colors hover:text-amethyst">
                            <span className="transition-transform duration-500 group-hover:translate-x-1.5">{c.name}</span>
                            <span className="font-sans text-[11px] text-plum/40">{count(c)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="label-sm text-amethyst">Shop by mood</p>
                    <ul className="mt-4 space-y-3">
                      {MOODS.map((m) => (
                        <li key={m.id}>
                          <button onClick={() => go(`/dressing-room?mood=${m.id}`)} className="group flex items-center gap-3 text-left">
                            <span className="h-7 w-7 shrink-0 rounded-full ring-1 ring-plum/10" style={{ background: `linear-gradient(135deg, ${m.tint}, ${m.deep})` }} />
                            <span>
                              <span className="block text-[14px] group-hover:text-amethyst">{m.name}</span>
                              <span className="block text-[12px] text-ink-soft">{m.line}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="label-sm flex items-center gap-1.5 text-amethyst"><Spark className="h-3 w-3" animate={false} /> AI services</p>
                    <ul className="mt-4 divide-y divide-plum/10 border-y border-plum/10">
                      {AI_TOOLS.map(([t, d, h]) => (
                        <li key={t}>
                          <button onClick={() => tool(h)} className="group flex w-full items-center justify-between gap-3 py-3 text-left">
                            <span>
                              <span className="block text-[14px] group-hover:text-amethyst">{t}</span>
                              <span className="block text-[12px] text-ink-soft">{d}</span>
                            </span>
                            <span className="text-plum/30 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-amethyst">→</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ["bridal", "Bridal Lavender", "Ceremony edit", "/editorial/bridal-runway.webp", "50% 30%"],
                      ["dresses", "Moonlit Evening", "New this season", "/products/aurora-gown.webp", "50% 20%"],
                    ].map(([id, t, k, src, pos]) => (
                      <button key={id} onClick={() => shopCategory(id)} className="group relative aspect-[4/5] overflow-hidden rounded-2xl text-left text-pearl">
                        <Image src={src} alt="" fill sizes="20vw" className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-film)] group-hover:scale-105" style={{ objectPosition: pos }} />
                        <span className="absolute inset-0 bg-gradient-to-t from-[#120c1f]/85 to-transparent" />
                        <span className="absolute inset-x-4 bottom-4">
                          <span className="label-sm block text-[10px] text-lavender">{k}</span>
                          <span className="display mt-1 block text-[24px] leading-none">{t}</span>
                          <span className="label-sm mt-3 inline-flex items-center gap-1.5 text-[10px] text-pearl/85">Shop now <span className="transition-transform duration-500 group-hover:translate-x-1">→</span></span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Phone / tablet full-screen menu ─────────────────── */}
      <AnimatePresence>
        {menu && (
          <motion.div
            id="phone-menu"
            className="fixed inset-0 z-[85] overflow-y-auto bg-[#1a1229] pb-10 pt-[112px] text-pearl xl:hidden"
            data-lenis-prevent
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)", transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
            exit={{ clipPath: "inset(0 0 100% 0)", transition: { duration: 0.45, ease: [0.76, 0, 0.24, 1] } }}
          >
            <div className="px-[var(--gutter)]">
              <nav aria-label="Menu">
                <ul>
                  {[["Shop all", "/#shop"], ["Shop by category", "/#categories"], ...NAV].map(([t, h], n) => (
                    <motion.li key={t} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 + n * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}>
                      <button onClick={() => go(h)} className="display flex w-full items-baseline justify-between border-b border-white/10 py-3 text-left text-[34px] leading-tight">
                        {t} <span className="font-sans text-[11px] text-pearl/40">{String(n + 1).padStart(2, "0")}</span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <p className="label-sm mt-10 text-lavender">Categories</p>
              <div className="no-scrollbar -mx-[var(--gutter)] mt-4 flex gap-3 overflow-x-auto px-[var(--gutter)]">
                {SHOP_CATS.map((c) => (
                  <button key={c.id} onClick={() => shopCategory(c.id)} className="relative aspect-[3/4] w-[34vw] max-w-[180px] shrink-0 overflow-hidden rounded-2xl text-left">
                    <Image src={c.image} alt="" fill sizes="34vw" className="object-cover" style={{ objectPosition: "50% 25%" }} />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#120c1f]/85 to-transparent" />
                    <span className="display absolute inset-x-3 bottom-3 text-[17px] leading-tight">{c.name}</span>
                  </button>
                ))}
              </div>

              <p className="label-sm mt-10 flex items-center gap-1.5 text-lavender"><Spark className="h-3 w-3" animate={false} /> AI services</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {AI_TOOLS.map(([t, d, h]) => (
                  <button key={t} onClick={() => tool(h)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
                    <span className="block text-[14px]">{t}</span>
                    <span className="mt-0.5 block text-[12px] text-pearl/50">{d}</span>
                  </button>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6 text-[13px] text-pearl/70">
                <button onClick={() => { setMenu(false); setPanel("wishlist"); }} className="flex items-center gap-2"><Svg k="heart" className="h-4 w-4" /> Wishlist ({wishlist.length})</button>
                <button onClick={() => setSound(!sound)} aria-pressed={sound} className="flex items-center gap-2"><Svg k={sound ? "soundOn" : "soundOff"} className="h-4 w-4" /> Sound {sound ? "on" : "off"}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: stylist is a floating button that opens a bottom sheet (outside the header's transform) */}
      <button
        onClick={() => setPanel("stylist")}
        className={`ai-glow label-sm fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-[90] inline-flex transition-all duration-500 ${fab && !menu ? "" : "pointer-events-none translate-y-6 opacity-0"} items-center gap-2 rounded-full bg-pearl/90 px-5 py-3.5 text-plum shadow-xl backdrop-blur md:hidden`}
      >
        <Spark className="h-4 w-4" /> Stylist
      </button>
    </>
  );
}
