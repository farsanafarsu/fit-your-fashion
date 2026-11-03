"use client";
import Link from "next/link";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { PRODUCTS, PAIRS, byId, formatPrice } from "@/lib/catalog";
import { predictSize } from "@/lib/sizing";
import { useLenis } from "../SmoothScroll";
import StylistChat from "../StylistChat";
import GarmentArt from "../ui/GarmentArt";
import { Spark } from "../ui/primitives";

const ease = [0.22, 1, 0.36, 1];

// Desktop: right-hand drawer. Mobile: bottom sheet (drag down to close).
function Sheet({ title, onClose, children, ai }) {
  // Sheets only mount after a user action, so window is available on first render.
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const drag = useDragControls();
  useEffect(() => {
    const m = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(m.matches);
    m.addEventListener("change", on);
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      m.removeEventListener("change", on);
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);
  const variants = mobile ? { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } } : { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } };
  return (
    <>
      <motion.div className="fixed inset-0 z-[150] bg-plum/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        {...variants}
        transition={{ duration: 0.7, ease }}
        drag={mobile ? "y" : false}
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, i) => i.offset.y > 120 && onClose()}
        className="fixed z-[160] flex flex-col bg-pearl text-plum max-md:inset-x-0 max-md:bottom-0 max-md:h-[88dvh] max-md:rounded-t-[28px] max-md:pb-[env(safe-area-inset-bottom)] md:inset-y-3 md:right-3 md:w-[min(460px,calc(100vw-1.5rem))] md:rounded-[28px]"
        data-lenis-prevent
      >
        <div className="flex touch-none justify-center pb-1 pt-3 md:hidden" onPointerDown={(e) => drag.start(e)} aria-hidden>
          <span className="h-1 w-10 rounded-full bg-plum/20" />
        </div>
        <div className="flex items-center justify-between px-6 pb-3 pt-5">
          <h2 className="flex items-center gap-2 text-[15px]">
            {ai && <Spark className="h-4 w-4" />}
            <span className="display text-[28px]">{title}</span>
          </h2>
          <button onClick={onClose} className="label-sm min-h-11 rounded-full border border-plum/20 px-4" autoFocus>
            Close
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">{children}</div>
      </motion.aside>
    </>
  );
}

function Bag() {
  const { bag, removeFromBag, addToBag, body, returnHistory } = useApp();
  const ids = bag.map((b) => b.id);
  // Complete the Look: pieces that pair with what's already in the bag.
  const suggestions = useMemo(() => [...new Set(ids.flatMap((id) => PAIRS[id] ?? []))].filter((id) => !ids.includes(id)).slice(0, 3), [ids.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!bag.length) return <p className="text-ink-soft">Your bag is empty. The collection is waiting.</p>;
  return (
    <div className="no-scrollbar -mx-1 flex-1 space-y-4 overflow-y-auto px-1">
      {bag.map(({ id, size }) => {
        const p = byId(id);
        const rec = predictSize(p, body, returnHistory);
        return (
          <div key={id} className="flex gap-4">
            <GarmentArt product={p} className="aspect-[3/4] w-20 shrink-0 rounded-xl" tag={false} />
            <div className="flex-1">
              <p>{p.name}</p>
              <p className="text-[12px] text-ink-soft">{formatPrice()} · Size {size}</p>
              {rec.size !== size && rec.size !== "One size" && (
                <button className="mt-1 flex items-center gap-1 py-1.5 text-left text-[12px] text-amethyst" onClick={() => addToBag(id, rec.size)}>
                  <Spark className="h-3 w-3" /> AI suggests {rec.size} ({rec.level} confidence) — switch
                </button>
              )}
              <button onClick={() => removeFromBag(id)} className="label-sm mt-1 py-2 text-plum/50 hover:text-plum">Remove</button>
            </div>
          </div>
        );
      })}
      {suggestions.length > 0 && (
        <div className="rounded-2xl bg-white p-4 ai-glow">
          <p className="label mb-3 flex items-center gap-2 text-amethyst"><Spark className="h-3.5 w-3.5" /> Complete the look</p>
          <div className="grid grid-cols-3 gap-2">
            {suggestions.map((id) => (
              <button key={id} onClick={() => addToBag(id, predictSize(byId(id), body, returnHistory).size)} className="text-left" data-cursor="Add">
                <GarmentArt product={byId(id)} className="aspect-[3/4] rounded-lg" tag={false} />
                <span className="mt-1 block text-[11px] leading-tight">{byId(id).name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-[11px] text-ink-soft">Checkout is not part of this prototype.</p>
    </div>
  );
}

function Wishlist() {
  const { wishlist, toggleWish } = useApp();
  if (!wishlist.length) return <p className="text-ink-soft">Nothing saved yet — tap the heart on any piece.</p>;
  return (
    <div className="grid grid-cols-2 gap-4 overflow-y-auto sm:grid-cols-3 md:grid-cols-2">
      {wishlist.map((id) => (
        <div key={id}>
          <GarmentArt product={byId(id)} className="aspect-[3/4] rounded-xl" tag={false} />
          <p className="mt-2 text-[13px]">{byId(id).name}</p>
          <button onClick={() => toggleWish(id)} className="label-sm py-2 text-plum/50">Remove</button>
        </div>
      ))}
    </div>
  );
}

function Search() {
  const [q, setQ] = useState("");
  const results = PRODUCTS.filter((p) => `${p.name} ${p.colourName} ${p.fabric} ${p.type} ${p.moods.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const { setPanel } = useApp();
  return (
    <>
      <label className="sr-only" htmlFor="search-in">Search the collection</label>
      <input id="search-in" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Silk, lavender, bridal…" className="display w-full border-b border-plum/20 bg-transparent pb-3 text-[28px] outline-none sm:text-[32px]" />
      <Link href="/#atelier" onClick={() => setPanel(null)} className="label-sm mt-4 flex items-center gap-2 text-amethyst">
        <Spark className="h-3.5 w-3.5" /> Or search with a photo (Visual Search)
      </Link>
      <div className="mt-6 grid flex-1 grid-cols-2 content-start gap-4 overflow-y-auto sm:grid-cols-3 md:grid-cols-2">
        {results.map((p) => (
          <Link key={p.id} href={`/dressing-room?look=${p.id}`} onClick={() => setPanel(null)} data-cursor="Try on">
            <GarmentArt product={p} className="aspect-[3/4] rounded-xl" tag={false} />
            <p className="mt-2 text-[13px]">{p.name}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function Overlays() {
  const { panel, setPanel, ask } = useApp();
  const lenis = useLenis();
  useEffect(() => {
    if (panel) lenis?.stop();
    else lenis?.start();
  }, [panel, lenis]);
  const close = () => setPanel(null);
  const titles = { stylist: "Your Stylist", bag: "Bag", wishlist: "Wishlist", search: "Search" };
  return (
    <AnimatePresence>
      {panel && (
        <Sheet key={panel} title={titles[panel]} onClose={close} ai={panel === "stylist"}>
          {panel === "stylist" && <StylistChat className="flex-1" initial={ask} />}
          {panel === "bag" && <Bag />}
          {panel === "wishlist" && <Wishlist />}
          {panel === "search" && <Search />}
        </Sheet>
      )}
    </AnimatePresence>
  );
}
