"use client";
import Link from "next/link";
import { useState } from "react";
import { byId, formatPrice, MOODS, PAIRS, PRODUCTS } from "@/lib/catalog";
import { predictSize } from "@/lib/sizing";
import { useApp } from "@/lib/store";
import GarmentArt from "../ui/GarmentArt";
import { Spark } from "../ui/primitives";

// Complete the Look: choose an anchor piece and the stylist builds around it from PAIRS,
// explaining each pairing from the garments' own attributes (shared mood, layer, formality).
const ANCHORS = PRODUCTS.filter((p) => p.slot !== "accessory" && PAIRS[p.id]);
const ROLE = { outer: "The layer", top: "The top", bottom: "The base", dress: "The dress", accessory: "The finish" };

function note(anchor, piece) {
  const shared = piece.moods.find((m) => anchor.moods.includes(m));
  const mood = shared && MOODS.find((m) => m.id === shared).name;
  if (piece.slot === "accessory") return `A light point at the neckline${mood ? ` keeps it ${mood}` : ""} without competing with the ${anchor.type}.`;
  if (piece.slot === "outer") return `${piece.fabric} over the ${anchor.fabric.toLowerCase()}: structure for arrivals, off once the room warms up.`;
  if (piece.formality === anchor.formality) return `Same register as the ${anchor.type}${mood ? `, both ${mood}` : ""} — ${piece.colourName.toLowerCase()} against ${anchor.colourName.toLowerCase()} keeps it tonal.`;
  return `${piece.formality < anchor.formality ? "Dresses it down" : "Lifts it"} — ${piece.colourName.toLowerCase()} ${piece.type} for a${mood ? ` ${mood}` : ""} balance.`;
}

export default function CompleteTheLook() {
  const { body, returnHistory, addToBag, noteView } = useApp();
  const [anchorId, setAnchorId] = useState(ANCHORS[0].id);
  const [added, setAdded] = useState(false);
  const anchor = byId(anchorId);
  const pieces = PAIRS[anchorId].map(byId);
  const look = [anchor, ...pieces];

  return (
    <section id="looks" data-chapter="#F3EEF9" className="py-24 md:py-32" aria-labelledby="ctl-h">
      <div className="mx-auto max-w-[1500px] px-[var(--gutter)]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="label flex items-center gap-2 text-amethyst"><Spark className="h-3.5 w-3.5" /> AI outfit builder</p>
            <h2 id="ctl-h" className="display mt-5 text-[14vw] sm:text-[9vw] lg:text-[6vw]">Complete <span className="display-i">the look</span></h2>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-ink-soft">Choose the piece you love. The stylist builds the rest around it and tells you why each one belongs.</p>
        </div>

        <div className="no-scrollbar -mx-[var(--gutter)] mt-10 flex gap-3 overflow-x-auto px-[var(--gutter)] pb-2" role="radiogroup" aria-label="Start from">
          {ANCHORS.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={p.id === anchorId}
              onClick={() => { setAnchorId(p.id); setAdded(false); noteView(p.id); }}
              className={`group w-24 shrink-0 text-left transition-opacity sm:w-28 ${p.id === anchorId ? "" : "opacity-55 hover:opacity-100"}`}
            >
              <GarmentArt product={p} className={`aspect-[3/4] rounded-2xl ring-2 ring-offset-2 ring-offset-[#F3EEF9] transition ${p.id === anchorId ? "ring-amethyst" : "ring-transparent"}`} tag={false} sizes="112px" />
              <span className="label-sm mt-2 block truncate text-[10px]">{p.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          <figure className="relative overflow-hidden rounded-[28px] bg-white">
            <GarmentArt key={anchor.id} product={anchor} className="aspect-[4/5] w-full" tag={false} sizes="(max-width: 1024px) 90vw, 40vw" />
            <figcaption className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 rounded-2xl bg-white/80 p-4 backdrop-blur-md">
              <span>
                <span className="label-sm text-amethyst">Your anchor</span>
                <span className="display mt-1 block text-[26px] leading-none">{anchor.name}</span>
              </span>
              <span className="label-sm text-plum/60">{predictSize(anchor, body, returnHistory).size}</span>
            </figcaption>
          </figure>

          <div className="flex flex-col">
            <ol className="grid gap-3">
              {pieces.map((p, i) => (
                <li key={p.id} className="flex gap-4 rounded-[22px] bg-white p-3 shadow-[0_10px_30px_-20px_rgba(30,21,48,.35)]">
                  <GarmentArt product={p} className="aspect-[3/4] w-24 shrink-0 rounded-2xl sm:w-28" tag={false} sizes="112px" />
                  <div className="min-w-0 py-1 pr-2">
                    <p className="label-sm text-plum/45">0{i + 2} · {ROLE[p.slot]}</p>
                    <p className="display mt-1 text-[24px] leading-tight">{p.name}</p>
                    <p className="mt-2 flex gap-2 text-[13px] leading-snug text-ink-soft">
                      <Spark className="mt-0.5 h-3.5 w-3.5 shrink-0" animate={false} />
                      {note(anchor, p)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-col gap-3 rounded-[22px] border border-plum/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="label-sm text-plum/50">{look.length} pieces · in your sizes</p>
                <p className="display mt-1 text-[28px]" title="Placeholder price">{formatPrice()}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/dressing-room?look=${anchor.id}`} className="label-sm rounded-full border border-plum/25 px-5 py-3.5 hover:border-plum" data-cursor="Try on">Try it on</Link>
                <button
                  onClick={() => { look.forEach((p) => addToBag(p.id, predictSize(p, body, returnHistory).size)); setAdded(true); }}
                  className="label-sm ai-glow rounded-full bg-plum px-6 py-3.5 text-pearl hover:bg-amethyst"
                >
                  {added ? "Look in bag ✓" : "Add the look"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
