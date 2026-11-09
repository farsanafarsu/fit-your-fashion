import { Spark } from "@/components/ui/primitives";

export const metadata = { title: "Style Guide — FIT YOUR FASHION" };

const COLOURS = [
  ["Pure White", "#FFFFFF", "Ground · product stages", "plum"],
  ["Pearl", "#FAF8FD", "Default page ground", "plum"],
  ["Soft Lavender", "#E9DFF5", "Panels, tints, hover fills", "plum"],
  ["Lavender", "#C9B6E4", "Accents, cursor ring, on-dark text", "plum"],
  ["Deep Amethyst", "#6E4FA8", "Labels, links, active states (6.3:1 on white)", "pearl"],
  ["Midnight Plum", "#1E1530", "Dark chapters, body text (16:1 on pearl)", "pearl"],
];

const TYPE = [
  ["Display XXL", "display text-[13vw] sm:text-[72px] lg:text-[96px]", "Cormorant Garamond 500 · 9–17vw · tracking −0.02em · leading 0.86–0.92", "Wear the future."],
  ["Display L", "display text-[10vw] sm:text-[56px]", "Cormorant Garamond 500 · 5.5–7vw section titles", "The Lavender Hour"],
  ["Display italic", "display-i text-[8.5vw] sm:text-[40px]", "Cormorant Garamond italic — the emotional half of a headline", "Before it’s yours."],
  ["Product name", "display text-[26px]", "Cormorant Garamond 500 · 22–26px · −0.02em", "Aurora Bias Gown"],
  ["Body", "text-[16px] leading-relaxed", "Manrope 400 · 14–16px · 1.6", "Silks that move like breath; tailoring with a pulse."],
  ["Label", "label", "Manrope 600 · 11px · +0.24em · uppercase", "Chapter 01 — The Collection"],
  ["Label small", "label-sm", "Manrope 500 · 10px · +0.2em · uppercase", "Photo placeholder"],
];

const MOTION = [
  ["Micro", "240ms", "expo.out", "Hover colour, icon states, cursor scale"],
  ["UI", "480–700ms", "cubic-bezier(.22,1,.36,1)", "Drawers, sheets, header hide/show, tabs"],
  ["Scene", "1.2–1.6s", "expo.inOut", "Mask reveals (wipe, iris, curtain), headline arrivals"],
  ["Scroll", "scrub 1", "linear (none)", "Pins, horizontal gallery, parallax planes, film cuts"],
  ["Magnetic", "600ms", "elastic.out(1, .4)", "Primary buttons follow the pointer at 35%"],
  ["Ambient", "6–60s loops", "sine / linear", "Light leaks, haze, UGC marquee"],
];

export default function StyleGuide() {
  return (
    <main id="main" className="bg-pearl px-[var(--gutter)] pb-32 pt-28 text-plum sm:pt-36">
      <div className="mx-auto max-w-[1200px]">
        <p className="label text-amethyst">Fit Your Fashion</p>
        <h1 className="display mt-6 text-[18vw] sm:text-[12vw] lg:text-[9vw]">Style <span className="display-i">guide</span></h1>
        <p className="mt-6 max-w-xl text-ink-soft">A fashion film, not a shop: slow, confident, editorial. Lavender and white as the core; Midnight Plum for cinematic dark chapters; iridescence only as a whisper on AI elements.</p>

        <h2 className="label mt-24 text-amethyst">01 · Colour</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {COLOURS.map(([n, hex, use, ink]) => (
            <div key={hex} className="overflow-hidden rounded-2xl ring-1 ring-plum/10">
              <div className={`flex h-28 items-end p-3 sm:h-36 sm:p-4 ${ink === "pearl" ? "text-pearl" : "text-plum"}`} style={{ background: hex }}>
                <span className="display text-[20px] leading-none sm:text-[28px]">{n}</span>
              </div>
              <div className="bg-white p-3 text-[12px] sm:p-4 sm:text-[13px]"><p className="font-medium">{hex}</p><p className="text-ink-soft">{use}</p></div>
            </div>
          ))}
          <div className="col-span-2 overflow-hidden rounded-2xl ring-1 ring-plum/10 md:col-span-1">
            <div className="h-20 sm:h-36" style={{ background: "var(--iris)" }} />
            <div className="bg-white p-3 text-[12px] sm:p-4 sm:text-[13px]"><p className="font-medium">Iridescent shimmer</p><p className="text-ink-soft">Accents only: AI borders, glows, the spark. Never a full-page gradient.</p></div>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-ink-soft">Rhythm: alternate light (white / pearl) and dark (plum) chapters. Body text on lavender is always Midnight Plum; never lavender on white for text.</p>

        <h2 className="label mt-24 text-amethyst">02 · Typography</h2>
        <div className="mt-8 divide-y divide-plum/10">
          {TYPE.map(([n, cls, spec, sample]) => (
            <div key={n} className="grid grid-cols-1 gap-3 py-6 *:min-w-0 md:grid-cols-[200px_1fr]">
              <div><p className="text-[13px] font-medium">{n}</p><p className="text-[12px] text-ink-soft">{spec}</p></div>
              <p className={`${cls} min-w-0 break-words`}>{sample}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-ink-soft">Contrast sizes dramatically: a giant serif word sits beside a 10–11px uppercase label. Max line length 60ch.</p>

        <h2 className="label mt-24 text-amethyst">03 · Spacing & layout</h2>
        <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-6">
          {[4, 8, 12, 16, 24, 32, 48, 64, 96, 160].map((s) => (
            <div key={s} className="text-center text-[11px]"><div className="bg-lavender" style={{ width: s, height: s }} /><p className="mt-2">{s}</p></div>
          ))}
        </div>
        <ul className="mt-6 space-y-2 text-[14px] text-ink-soft">
          <li>Base unit 4px; section padding 96–160px (py-24 → py-40); gutter clamp(16px, 4vw, 56px); max width 1500px.</li>
          <li>Radii: 4–6px for editorial imagery, 16–28px for UI panels and AI surfaces, full pill for buttons and chips.</li>
          <li>Mobile: 16px gutter, swipe galleries with scroll-snap, AI Stylist as a bottom sheet, vertical (9:16) hero film.</li>
        </ul>

        <h2 className="label mt-24 text-amethyst">04 · Motion</h2>
        <p className="label-sm mt-6 text-plum/50 md:hidden">Swipe the table →</p>
        <div className="no-scrollbar -mx-[var(--gutter)] mt-3 overflow-x-auto px-[var(--gutter)] md:mx-0 md:mt-8 md:px-0">
          <table className="w-full min-w-[620px] text-left text-[14px]">
            <thead className="label-sm text-ink-soft"><tr><th className="py-3">Token</th><th>Duration</th><th>Easing</th><th>Use</th></tr></thead>
            <tbody className="divide-y divide-plum/10">
              {MOTION.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className="py-3 pr-4">{c}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
        <ul className="mt-6 space-y-2 text-[14px] text-ink-soft">
          <li>Opening: 2.6s — light leak (1.4s) → letters stagger 60ms → curtain lift (1.1s, expo.inOut). Shown once per session; Esc skips.</li>
          <li>Things arrive slowly and leave quickly. Nothing bounces except magnetic buttons.</li>
          <li>Reduced motion: no smooth-scroll, no pins or parallax; reveals become instant and pinned chapters stack.</li>
        </ul>

        <h2 className="label mt-24 text-amethyst">05 · AI elements</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          <div className="ai-glow rounded-[24px] bg-white p-6"><Spark className="h-8 w-8" /><p className="mt-4 font-medium">The spark</p><p className="mt-1 text-[13px] text-ink-soft">Four-point star, iridescent fill, a 2.4s breathe. Marks every AI action, label and message.</p></div>
          <div className="ai-glow rounded-[24px] bg-white p-6"><div className="h-8 rounded-full" style={{ background: "var(--iris)" }} /><p className="mt-4 font-medium">Iridescent edge</p><p className="mt-1 text-[13px] text-ink-soft">1px animated conic border (.ai-glow) with a soft lavender bloom on hover.</p></div>
          <div className="ai-glow rounded-[24px] bg-white p-6"><div className="ai-shimmer h-8 rounded-full" /><p className="mt-4 font-medium">Thinking shimmer</p><p className="mt-1 text-[13px] text-ink-soft">1.6s sweep (.ai-shimmer) while the AI works. Never a spinner.</p></div>
        </div>
        <ul className="mt-6 space-y-2 text-[14px] text-ink-soft">
          <li>Voice: warm, brief, specific. The stylist speaks in looks, not lists.</li>
          <li>Privacy line wherever a photo or camera is requested: processed securely, deletable anytime.</li>
          <li>Fit heatmap: rose = tight, mint = perfect, sky = loose — always shown with a text legend.</li>
        </ul>

        <h2 className="label mt-24 text-amethyst">06 · Cursor & micro-interactions</h2>
        <ul className="mt-6 space-y-2 text-[14px] text-ink-soft">
          <li>24px lavender ring; grows 2.2× over links, 4.2× with a label (View, Try on, Drag, Shop, Enter). Hidden on touch.</li>
          <li>Text scramble on nav and footer links (≈ 2 frames per letter). Product cards crossfade to a second angle on hover (700ms).</li>
          <li>Sound off by default; ambient pad fades in over 1.2s, UI ticks are 120ms sine blips.</li>
        </ul>
      </div>
    </main>
  );
}
