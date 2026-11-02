"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { Spark, Scramble } from "./ui/primitives";

const Icon = {
  search: <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  bag: <path d="M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" />,
};
const Svg = ({ k }) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
    {Icon[k]}
  </svg>
);

// Floating header: hides when scrolling down, returns on the way up.
export default function Header() {
  const { setPanel, bag, wishlist, sound, setSound } = useApp();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const onHome = usePathname() === "/";
  const fab = !onHome || pastHero; // on the homepage the mobile stylist button waits until the hero scrolls away
  const last = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 120 && y > last.current);
      setSolid(y > 40);
      setPastHero(y > window.innerHeight * 0.7);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const iconBtn = "relative grid h-11 w-11 place-items-center sm:h-10 sm:w-10 rounded-full transition-colors hover:bg-white/60";
  return (
    <>
    <header
      className={`fixed inset-x-0 top-0 z-[90] px-3 pt-3 transition-transform duration-700 ease-[var(--ease-film)] sm:px-5 ${hidden ? "-translate-y-[120%]" : ""}`}
    >
      <div
        className={`mx-auto flex max-w-[1500px] items-center justify-between gap-2 rounded-full px-3 py-1.5 text-plum transition-all duration-700 sm:px-5 ${solid ? "bg-pearl/75 shadow-[0_10px_40px_-20px_rgba(30,21,48,.35)] backdrop-blur-xl" : "bg-white/20 backdrop-blur-md"}`}
      >
        <nav className="hidden items-center gap-7 xl:flex" aria-label="Primary">
          {[["Collection", "/#collection"], ["Dressing Room", "/dressing-room"], ["Moods", "/#moods"], ["Story", "/#story"]].map(([t, h]) => (
            <Link key={t} href={h} className="label-sm text-plum/80 hover:text-plum">
              <Scramble text={t} />
            </Link>
          ))}
        </nav>
        <Link href="/" className="display whitespace-nowrap py-3 text-[17px] tracking-[0.06em] sm:text-[22px] sm:tracking-[0.16em] xl:absolute xl:left-1/2 xl:-translate-x-1/2" aria-label="Fit Your Fashion home">
          FIT YOUR FASHION
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button className={`${iconBtn} hidden sm:grid`} onClick={() => setSound(!sound)} aria-pressed={sound} aria-label={sound ? "Mute ambient sound" : "Play ambient sound"} data-cursor={sound ? "Mute" : "Sound"}>
            <span className="flex h-3 items-end gap-[2px]" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="w-[2px] rounded bg-plum transition-all" style={{ height: sound ? `${[60, 100, 40, 80][i]}%` : "25%", animation: sound ? `float-y ${0.6 + i * 0.15}s ease-in-out infinite` : "none" }} />
              ))}
            </span>
          </button>
          <button className={iconBtn} onClick={() => setPanel("search")} aria-label="Search">
            <Svg k="search" />
          </button>
          <button onClick={() => setPanel("stylist")} className="ai-glow label-sm mx-1 hidden items-center gap-2 rounded-full bg-white/70 px-4 py-2.5 md:inline-flex" data-cursor="Ask">
            <Spark className="h-3.5 w-3.5" /> AI Stylist
          </button>
          <button className={iconBtn} onClick={() => setPanel("wishlist")} aria-label={`Wishlist, ${wishlist.length} items`}>
            <Svg k="heart" />
            {wishlist.length > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-amethyst" />}
          </button>
          <button className={iconBtn} onClick={() => setPanel("bag")} aria-label={`Bag, ${bag.length} items`}>
            <Svg k="bag" />
            {bag.length > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-plum px-1 text-[10px] text-pearl">{bag.length}</span>}
          </button>
        </div>
      </div>
    </header>
    {/* Mobile: stylist is a floating button that opens a bottom sheet (outside the header's transform) */}
      <button
        onClick={() => setPanel("stylist")}
        className={`ai-glow label-sm fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-[90] inline-flex transition-all duration-500 ${fab ? "" : "pointer-events-none translate-y-6 opacity-0"} items-center gap-2 rounded-full bg-pearl/90 px-5 py-3.5 text-plum shadow-xl backdrop-blur md:hidden`}
      >
        <Spark className="h-4 w-4" /> Stylist
      </button>
    </>
  );
}
