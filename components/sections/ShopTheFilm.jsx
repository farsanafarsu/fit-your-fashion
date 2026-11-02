"use client";
import Link from "next/link";
import { useState } from "react";
import { byId, formatPrice, MEDIA } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { SHAPES } from "../ui/GarmentArt";
import SilkFilm from "../ui/SilkFilm";
import { PlaceholderTag } from "../ui/primitives";

// Each figure in frame: where it stands (%), its scale, and the products it wears.
const CAST = [
  { x: 14, s: 0.9, delay: 0, looks: [["nocturne-blazer", 32, 34], ["vesper-trouser", 50, 72]] },
  { x: 41, s: 1.08, delay: -3, looks: [["aurora-gown", 50, 50], ["pearl-collar", 50, 16], ["halo-cape", 18, 36]] },
  { x: 70, s: 0.95, delay: -6, looks: [["cloud-knit", 50, 30], ["orbit-skirt", 50, 70]] },
];

function Figure({ product, layer }) {
  return (
    <svg viewBox="0 0 300 400" className="absolute inset-0 h-full w-full" style={{ zIndex: layer }} aria-hidden>
      <path d={SHAPES[product.type]} fill={product.type === "necklace" ? "none" : product.colour} stroke={product.type === "necklace" ? product.colour : "none"} strokeWidth="10" opacity={product.type === "cape" ? 0.55 : 1} />
    </svg>
  );
}

export default function ShopTheFilm() {
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(null);
  const { addToBag } = useApp();

  return (
    <section data-chapter="#1E1530" className="on-dark relative py-24 text-pearl md:py-32" aria-labelledby="sf-h">
      <div className="mx-auto max-w-[1500px] px-[var(--gutter)]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="label text-lavender">Shop the film</p>
            <h2 id="sf-h" className="display mt-6 text-[13vw] sm:text-[9vw] lg:text-[6vw]">Pause. <span className="display-i text-lavender">Everything is yours.</span></h2>
          </div>
          <p className="max-w-xs text-[14px] text-mist/70">Freeze the campaign and every look in frame becomes tappable.</p>
        </div>

        <div className="grain vignette relative mt-10 aspect-[3/4] max-h-[85svh] w-full overflow-hidden rounded-[6px] sm:aspect-[4/3] md:mt-12 lg:aspect-[16/9]">
          {MEDIA.campaignFilm ? null : <SilkFilm dark={0.75} paused={paused} className="absolute inset-0" />}
          <PlaceholderTag className="bottom-3 left-3 text-plum sm:bottom-auto sm:left-4 sm:top-4">Campaign film placeholder</PlaceholderTag>
          {CAST.map((c, i) => (
            <div
              key={i}
              className="absolute bottom-[4%] h-[78%] w-[30%] sm:w-[22%]"
              style={{ left: `${c.x}%`, scale: c.s, transformOrigin: "bottom", animation: `float-y 6s ease-in-out ${c.delay}s infinite`, animationPlayState: paused ? "paused" : "running" }}
            >
              {c.looks.map(([id], j) => <Figure key={id} product={byId(id)} layer={byId(id).slot === "outer" ? 3 : byId(id).slot === "accessory" ? 4 : j + 1} />)}
              {paused &&
                c.looks.map(([id, hx, hy]) => (
                  <button
                    key={id}
                    onClick={() => setOpen(open === id ? null : id)}
                    className="absolute z-10 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center"
                    style={{ left: `${hx}%`, top: `${hy}%` }}
                    aria-label={`Shop ${byId(id).name}`}
                    aria-expanded={open === id}
                    data-cursor="Shop"
                  >
                    <span className="absolute inset-0 animate-ping rounded-full bg-pearl/40" />
                    <span className="h-3 w-3 rounded-full bg-pearl ring-4 ring-pearl/30" />
                  </button>
                ))}
            </div>
          ))}
          {open && (
            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-3 rounded-2xl bg-pearl p-3 text-plum sm:bottom-5 sm:left-auto sm:right-5 sm:w-[360px] sm:gap-4 sm:p-4" role="dialog" aria-label={byId(open).name}>
              <div className="flex-1">
                <p className="display text-[22px] leading-tight">{byId(open).name}</p>
                <p className="text-[12px] text-ink-soft">{byId(open).fabric} · {formatPrice()}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Link href={`/dressing-room?look=${open}`} className="label-sm rounded-full bg-plum px-4 py-3 text-center text-pearl">Try on</Link>
                <button onClick={() => addToBag(open)} className="label-sm rounded-full border border-plum/30 px-4 py-3">Add</button>
              </div>
            </div>
          )}
          <button
            onClick={() => { setPaused(!paused); setOpen(null); }}
            className="absolute right-3 top-3 z-20 flex min-h-11 items-center gap-2 rounded-full bg-white/15 px-4 py-3 backdrop-blur-md sm:right-5 sm:top-5 sm:px-5"
            aria-pressed={paused}
            data-cursor={paused ? "Play" : "Pause"}
          >
            <span className="label-sm">{paused ? "Play film" : "Pause to shop"}</span>
            <span aria-hidden>{paused ? "▶" : "❚❚"}</span>
          </button>
        </div>
        <p className="mt-3 text-[11px] text-mist/50">Captions: none needed for this silent placeholder; the final campaign film ships with an English caption track.</p>
      </div>
    </section>
  );
}
