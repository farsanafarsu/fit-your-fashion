"use client";
import StylistChat from "../StylistChat";
import { ChapterLabel, Spark } from "../ui/primitives";

export default function StylistChapter() {
  return (
    <section id="stylist" className="relative overflow-hidden bg-white py-28 md:py-40" aria-labelledby="st-h">
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-12 px-[var(--gutter)] *:min-w-0 md:gap-14 lg:grid-cols-2 lg:items-center">
        <div data-reveal="wipe">
          <ChapterLabel n="03" title="Your AI Stylist" />
          <h2 id="st-h" className="display mt-8 text-[15vw] sm:text-[11vw] lg:text-[7vw]">
            Say where. <br />
            <span className="display-i text-amethyst">We’ll say what.</span>
          </h2>
          <p className="mt-8 max-w-md text-[16px] leading-relaxed text-ink-soft">
            Type or speak. Your stylist reads the occasion, place, season and your proportions, then dresses you in complete looks from the collection — ready to try on.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            {["Chat + voice", "Occasion & weather aware", "Knows your size", "Learns your style"].map((t) => (
              <span key={t} className="label-sm rounded-full border border-plum/15 px-3.5 py-2 text-plum/70">{t}</span>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-mist/70 blur-[80px] sm:-inset-10" aria-hidden />
          <div className="ai-glow relative flex h-[min(620px,82svh)] flex-col rounded-[24px] bg-pearl/90 p-4 sm:rounded-[28px] shadow-[0_40px_120px_-40px_rgba(110,79,168,.45)] backdrop-blur sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-plum/10 pb-4">
              <span className="flex items-center gap-2"><Spark className="h-4 w-4" /><span className="display text-[22px]">Stylist</span></span>
              <span className="label-sm text-plum/50">Live preview</span>
            </div>
            <StylistChat preview className="min-h-0 flex-1" />
          </div>
        </div>
      </div>
    </section>
  );
}
