"use client";
import Link from "next/link";
import { useState } from "react";
import { PRODUCTS, MOODS, PAIRS, byId } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import GarmentArt from "../ui/GarmentArt";
import { Spark } from "../ui/primitives";

// Small on-device AI tools. Images never leave the browser: they are read into a canvas,
// sampled, and discarded.

function readImage(file) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 64; c.height = 64;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0, 64, 64);
      res({ data: x.getImageData(0, 0, 64, 64).data, url: img.src });
    };
    img.src = URL.createObjectURL(file);
  });
}
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function Upload({ onFile, label }) {
  return (
    <label className="ai-glow flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl bg-white/70 p-6 text-center text-[13px]" data-cursor="Upload">
      <Spark className="h-5 w-5" />
      {label}
      <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
    </label>
  );
}

const Result = ({ ids, note }) => (
  <div className="mt-4">
    {note && <p className="mb-3 text-[13px] text-ink-soft">{note}</p>}
    <div className="grid grid-cols-3 gap-2">
      {ids.map((id) => (
        <Link key={id} href={`/dressing-room?look=${id}`} data-cursor="Try on">
          <GarmentArt product={byId(id)} className="aspect-[3/4] rounded-lg" tag={false} />
          <span className="mt-1 block truncate text-[11px]">{byId(id).name}</span>
        </Link>
      ))}
    </div>
  </div>
);

function ColourAnalysis() {
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (f) => {
    setBusy(true);
    const { data, url } = await readImage(f);
    // Sample the centre of the frame (where a selfie's face usually is), skin-like pixels only.
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = 16; y < 48; y++) for (let x = 16; x < 48; x++) {
      const i = (y * 64 + x) * 4;
      const [R, G, B] = [data[i], data[i + 1], data[i + 2]];
      if (R > G && G > B && R - B > 15) { r += R; g += G; b += B; n++; }
    }
    URL.revokeObjectURL(url);
    const avg = n ? [r / n, g / n, b / n] : [200, 160, 130];
    const [h, , l] = rgbToHsl(avg);
    const warm = h < 22;
    const depth = l < 0.45 ? "deep" : l < 0.62 ? "medium" : "fair";
    const pick = PRODUCTS.filter((p) => p.slot !== "accessory")
      .map((p) => {
        const [ph, , pl] = rgbToHsl(hexToRgb(p.colour));
        const contrast = Math.abs(pl - l);
        return { id: p.id, s: contrast + (warm ? (ph > 260 ? 0.15 : 0) : ph < 280 ? 0.15 : 0) };
      })
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((x) => x.id);
    setTimeout(() => {
      setBusy(false);
      setRes({ note: `Reading: ${warm ? "warm" : "cool"} undertone, ${depth} depth${n ? "" : " (low light — try a brighter photo)"}. These shades give you the most luminous contrast:`, ids: pick, swatch: `rgb(${avg.map(Math.round).join(",")})` });
    }, 900);
  };
  return (
    <div>
      <Upload onFile={run} label="Upload a selfie in daylight" />
      {busy && <div className="ai-shimmer mt-4 h-24 rounded-2xl" />}
      {res && (
        <>
          <div className="mt-4 flex items-center gap-3 text-[12px]"><span className="h-6 w-6 rounded-full ring-2 ring-white" style={{ background: res.swatch }} /> Your sampled tone</div>
          <Result {...res} />
        </>
      )}
    </div>
  );
}

function VisualSearch() {
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (f) => {
    setBusy(true);
    const { data, url } = await readImage(f);
    // Dominant colour (ignoring near-white/black background) → nearest pieces by colour.
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) {
      const s = data[i] + data[i + 1] + data[i + 2];
      if (s > 60 && s < 720) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
    }
    URL.revokeObjectURL(url);
    const avg = n ? [r / n, g / n, b / n] : [200, 180, 220];
    const ids = [...PRODUCTS].sort((a, b) => dist(hexToRgb(a.colour), avg) - dist(hexToRgb(b.colour), avg)).slice(0, 3).map((p) => p.id);
    setTimeout(() => { setBusy(false); setRes({ ids, note: "Closest pieces by colour and tone. (Prototype matches colour; a vision model would also match silhouette.)" }); }, 900);
  };
  return (
    <div>
      <Upload onFile={run} label="Upload or drop any outfit photo" />
      {busy && <div className="ai-shimmer mt-4 h-24 rounded-2xl" />}
      {res && <Result {...res} />}
    </div>
  );
}

function OccasionWeather() {
  const [occ, setOcc] = useState("moonlit");
  const [weather, setWeather] = useState("warm");
  const ids = PRODUCTS.filter((p) => p.moods.includes(occ) && p.season.includes(weather)).slice(0, 3).map((p) => p.id);
  const sel = "rounded-full border border-plum/15 bg-white/70 px-3 py-2 text-[13px]";
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="occ">Occasion</label>
        <select id="occ" className={sel} value={occ} onChange={(e) => setOcc(e.target.value)}>
          {MOODS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <label className="sr-only" htmlFor="wx">Weather</label>
        <select id="wx" className={sel} value={weather} onChange={(e) => setWeather(e.target.value)}>
          <option value="warm">Warm / humid</option><option value="mild">Mild</option><option value="cool">Cool</option>
        </select>
      </div>
      <p className="mt-3 text-[11px] text-ink-soft">Production: reads your local forecast with permission. Prototype: choose the weather.</p>
      {ids.length ? <Result ids={ids} /> : <p className="mt-4 text-[13px]">Nothing in this edit fits that pairing yet.</p>}
    </div>
  );
}

function SmartWardrobe() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const COLOURS = { black: "nocturne-blazer", white: "vesper-trouser", denim: "cloud-knit", jeans: "cloud-knit", grey: "lune-slip", beige: "orbit-skirt", gold: "aurora-gown", saree: "halo-cape", kurta: "vesper-trouser", shirt: "orbit-skirt", tee: "nocturne-blazer" };
  const sugg = [...new Set(items.flatMap((t) => Object.entries(COLOURS).filter(([k]) => t.toLowerCase().includes(k)).flatMap(([, id]) => [id, ...(PAIRS[id] ?? []).slice(0, 1)])))].slice(0, 3);
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) setItems([...items, text.trim()]); setText(""); }} className="flex gap-2">
        <label className="sr-only" htmlFor="wd">Add something you own</label>
        <input id="wd" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. black wide jeans" className="min-w-0 flex-1 rounded-full border border-plum/15 bg-white/70 px-4 py-2.5 text-[13px] outline-none" />
        <button className="label-sm rounded-full bg-plum px-4 text-pearl">Add</button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">{items.map((t, i) => <span key={i} className="rounded-full bg-mist px-3 py-1 text-[12px]">{t}</span>)}</div>
      {items.length > 0 && (sugg.length ? <Result ids={sugg} note="New pieces that work with what you own:" /> : <p className="mt-3 text-[13px] text-ink-soft">Add a colour or garment type (black, white, denim, saree…) and I’ll match it.</p>)}
    </div>
  );
}

const SKIN = ["#F1D2BE", "#D9A988", "#B57E5C", "#8A5A3D", "#5C3A27"];
function CampaignMode() {
  const { body, setBody } = useApp();
  const [id, setId] = useState("aurora-gown");
  return (
    <div>
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Skin tone">
        {SKIN.map((c) => (
          <button key={c} role="radio" aria-checked={body.skin === c} aria-label={`Skin tone ${c}`} onClick={() => setBody({ ...body, skin: c })} className={`h-7 w-7 rounded-full ring-offset-2 ${body.skin === c ? "ring-2 ring-amethyst" : ""}`} style={{ background: c }} />
        ))}
      </div>
      <label className="sr-only" htmlFor="cm-p">Piece</label>
      <select id="cm-p" value={id} onChange={(e) => setId(e.target.value)} className="mt-3 w-full rounded-full border border-plum/15 bg-white/70 px-3 py-2 text-[13px]">
        {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <Link href={`/dressing-room?look=${id}&campaign=1`} className="label-sm mt-4 flex items-center justify-center gap-2 rounded-full bg-plum py-3 text-pearl" data-cursor="Render">
        <Spark className="h-3.5 w-3.5" /> Render on my body type
      </Link>
      <p className="mt-3 text-[11px] text-ink-soft">Uses your avatar’s measurements and chosen tone. Production: a generative model renders a campaign still.</p>
    </div>
  );
}

const TOOLS = [
  { id: "colour", name: "Colour Analysis", line: "Your most luminous shades, from a selfie.", C: ColourAnalysis },
  { id: "visual", name: "Visual Search", line: "Seen it somewhere? Find it here.", C: VisualSearch },
  { id: "weather", name: "Occasion & Weather", line: "Dressed for the event and the sky.", C: OccasionWeather },
  { id: "wardrobe", name: "Smart Wardrobe", line: "New pieces that love what you own.", C: SmartWardrobe },
  { id: "campaign", name: "Campaign Mode", line: "The campaign, on your body and tone.", C: CampaignMode },
];

export default function Atelier() {
  const [tool, setTool] = useState("colour");
  const T = TOOLS.find((t) => t.id === tool);
  return (
    <section id="atelier" className="relative bg-pearl py-24 md:py-32" aria-labelledby="at-h">
      <div className="mx-auto max-w-[1500px] px-[var(--gutter)]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="label flex items-center gap-2 text-amethyst"><Spark className="h-3.5 w-3.5" /> The AI Atelier</p>
            <h2 id="at-h" className="display mt-6 text-[13vw] md:text-[5.5vw]">An intelligence <span className="display-i">with taste.</span></h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-ink-soft">
            <strong className="font-medium text-plum">Privacy first.</strong> Photos are processed on your device in this prototype and never uploaded. In production, images are encrypted in transit, used only for your request, and can be deleted from your account at any time.
          </p>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid gap-2" role="tablist" aria-label="AI tools">
            {TOOLS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tool === t.id} onClick={() => setTool(t.id)} className={`group flex items-baseline justify-between rounded-2xl px-6 py-5 text-left transition-colors ${tool === t.id ? "ai-glow bg-white" : "hover:bg-white/60"}`}>
                <span className="display text-[26px] md:text-[32px]">{t.name}</span>
                <span className="hidden max-w-[45%] text-right text-[13px] text-ink-soft sm:block lg:hidden xl:block">{t.line}</span>
              </button>
            ))}
          </div>
          <div className="rounded-[28px] bg-mist/60 p-6 md:p-10" role="tabpanel" aria-label={T.name}>
            <p className="label mb-5 text-amethyst">{T.name}</p>
            <T.C />
          </div>
        </div>
      </div>
    </section>
  );
}
