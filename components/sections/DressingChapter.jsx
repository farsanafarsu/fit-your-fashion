"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { byId } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { predictSize } from "@/lib/sizing";
import { Button, ChapterLabel, Spark } from "../ui/primitives";
import HeatLegend from "../dressing/HeatLegend";

const AvatarScene = dynamic(() => import("../dressing/AvatarScene"), { ssr: false, loading: () => <div className="ai-shimmer h-full w-full rounded-[28px]" /> });

const LOOKS = [
  { name: "Moonlit", items: ["aurora-gown", "halo-cape", "pearl-collar"] },
  { name: "Soft Power", items: ["nocturne-blazer", "vesper-trouser"] },
  { name: "Off-Duty", items: ["cloud-knit", "orbit-skirt"] },
];

// Chapter 02 — a live, lazily-mounted preview of the dressing room.
export default function DressingChapter() {
  const { body, returnHistory } = useApp();
  const [look, setLook] = useState(0);
  const [heat, setHeat] = useState(false);
  const [mounted, setMounted] = useState(false); // 3D scene created once the chapter is near
  const [inView, setInView] = useState(false); // ...but it only renders while actually on screen
  const ref = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting);
      if (e.isIntersecting) setMounted(true);
    }, { rootMargin: "300px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const items = LOOKS[look].items;
  const sizes = Object.fromEntries(items.map((id) => [id, predictSize(byId(id), body, returnHistory).size]));

  return (
    <section ref={ref} id="dressing-room" data-chapter="#1E1530" className="on-dark relative overflow-x-clip py-28 text-pearl md:py-40" aria-labelledby="dr-h">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[60vmax] w-[60vmax] -translate-x-1/2 rounded-full bg-amethyst/30 blur-[140px]" aria-hidden />
      <div className="relative mx-auto grid max-w-[1500px] grid-cols-1 items-center gap-12 px-[var(--gutter)] *:min-w-0 md:gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <ChapterLabel n="02" title="The AI Dressing Room" dark />
          <h2 id="dr-h" className="display mt-8 text-[15vw] sm:text-[11vw] lg:text-[7.4vw]">
            Try the <span className="display-i iris-text">future</span> on.
          </h2>
          <p className="mt-8 max-w-md text-[16px] leading-relaxed text-mist/80">
            Build an avatar from a photo, a quick phone scan or your measurements. Layer pieces, swap sizes and watch the fit change — then step into Live Mirror.
          </p>
          <ul className="mt-10 grid max-w-md grid-cols-1 gap-x-6 gap-y-3 text-[14px] text-mist/80 min-[400px]:grid-cols-2 sm:text-[13px]">
            {["360° rotate · pose · walk", "Layer top, bottom, accessories", "Fit heatmap per size", "Live Mirror AR (webcam)", "AI Size Predictor", "Save & share your Lookbook"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Spark className="h-3 w-3 shrink-0" animate={false} /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <Button as={Link} href="/dressing-room" variant="light" ai data-cursor="Enter">
              Enter the Dressing Room
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="relative mx-auto aspect-[3/4] max-h-[85svh] overflow-hidden rounded-[24px] sm:aspect-[4/5] sm:rounded-[28px] bg-gradient-to-b from-plum-2 to-plum ring-1 ring-white/10">
            {mounted && <AvatarScene className="absolute inset-0" body={body} outfit={items} sizes={sizes} heatmap={heat} pose="walk" autoRotate dark active={inView} dpr={[1, 1.5]} />}
            <div className="absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1.5 rounded-full bg-white/10 p-1 backdrop-blur-md" role="tablist" aria-label="Preview looks">
                {LOOKS.map((l, i) => (
                  <button key={l.name} role="tab" aria-selected={look === i} onClick={() => setLook(i)} className={`label-sm rounded-full px-3 py-2.5 sm:px-3.5 ${look === i ? "bg-pearl text-plum" : "text-pearl"}`}>
                    {l.name}
                  </button>
                ))}
              </div>
              <button onClick={() => setHeat(!heat)} aria-pressed={heat} className={`ai-glow label-sm flex items-center gap-2 rounded-full px-4 py-3 backdrop-blur-md ${heat ? "bg-pearl text-plum" : "bg-white/10"}`}>
                <Spark className="h-3 w-3" /> Fit heatmap
              </button>
            </div>
            <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-3">
              <div className="rounded-2xl bg-white/10 p-3 text-[12px] backdrop-blur-md">
                {items.map((id) => (
                  <p key={id} className="flex justify-between gap-6">
                    <span>{byId(id).name}</span>
                    <span className="text-lavender">{sizes[id]}</span>
                  </p>
                ))}
              </div>
              {heat && <HeatLegend dark />}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-mist/50">Interactive preview using your saved measurements (defaults until you create an avatar). Drag to rotate.</p>
        </div>
      </div>
    </section>
  );
}
