"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTS, SIZES, byId, formatPrice } from "@/lib/catalog";
import { useApp } from "@/lib/store";
import { bodyFromHeight, fitMap, predictSize } from "@/lib/sizing";
import GarmentArt from "../ui/GarmentArt";
import { Spark } from "../ui/primitives";
import HeatLegend, { HEAT } from "./HeatLegend";

const AvatarScene = dynamic(() => import("./AvatarScene"), { ssr: false, loading: () => <div className="ai-shimmer h-full w-full" /> });
const LiveMirror = dynamic(() => import("./LiveMirror"), { ssr: false });

const SLOTS = [["dress", "Dresses"], ["top", "Tops"], ["bottom", "Bottoms"], ["outer", "Layers"], ["accessory", "Accessories"]];
const SKIN = ["#F1D2BE", "#D9A988", "#B57E5C", "#8A5A3D", "#5C3A27"];

// Wearing a dress clears top + bottom and vice versa; one piece per slot.
function wear(outfit, id) {
  const p = byId(id);
  if (outfit.includes(id)) return outfit.filter((x) => x !== id);
  const clash = p.slot === "dress" ? ["dress", "top", "bottom"] : p.slot === "top" || p.slot === "bottom" ? [p.slot, "dress"] : [p.slot];
  return [...outfit.filter((x) => !clash.includes(byId(x).slot)), id];
}

function AvatarBuilder() {
  const { body, setBody } = useApp();
  const [mode, setMode] = useState("measure");
  const [photo, setPhoto] = useState(null);
  const [scan, setScan] = useState("idle"); // idle | live | counting | done | error
  const [count, setCount] = useState(3);
  const cam = useRef(null);
  const stream = useRef(null);

  const stopCam = () => stream.current?.getTracks().forEach((t) => t.stop());
  useEffect(() => stopCam, []);

  const startScan = async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      cam.current.srcObject = stream.current;
      setScan("live");
    } catch {
      setScan("error");
    }
  };
  const capture = () => {
    setScan("counting");
    let n = 3;
    setCount(n);
    const iv = setInterval(() => {
      n--;
      setCount(n);
      if (n === 0) {
        clearInterval(iv);
        stopCam();
        setScan("done");
      }
    }, 900);
  };

  const field = (k, label, min, max) => (
    <label key={k} className="block">
      <span className="flex justify-between text-[12px]"><span>{label}</span><span className="tabular-nums text-amethyst">{body[k]} cm</span></span>
      <input type="range" min={min} max={max} value={body[k]} onChange={(e) => setBody({ ...body, [k]: +e.target.value })} className="mt-1.5 w-full accent-[#6E4FA8]" />
    </label>
  );

  return (
    <div>
      <div className="grid grid-cols-3 gap-1 rounded-full bg-mist/70 p-1" role="tablist" aria-label="Create avatar from">
        {[["photo", "Photo"], ["scan", "Body scan"], ["measure", "Measures"]].map(([k, t]) => (
          <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={`label-sm min-h-10 rounded-full py-2.5 text-[10px] ${mode === k ? "bg-white shadow" : ""}`}>{t}</button>
        ))}
      </div>

      <div className="mt-5">
        {mode === "photo" && (
          <div>
            <label className="ai-glow flex cursor-pointer items-center gap-4 rounded-2xl bg-white p-4 text-[13px]" data-cursor="Upload">
              {photo ? <img src={photo} alt="Your uploaded full-length photo" className="h-20 w-14 rounded-lg object-cover" /> : <Spark className="h-6 w-6" />}
              <span>{photo ? "Photo added. Refine your measurements below." : "Upload a full-length photo, standing straight, fitted clothing"}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files[0]; if (f) setPhoto(URL.createObjectURL(f)); }} />
            </label>
            <p className="mt-2 text-[11px] text-ink-soft">Prototype: body estimation isn’t connected yet, so measurements start from your height.</p>
            {photo && <button onClick={() => setPhoto(null)} className="label-sm mt-2 text-plum/60 underline">Delete photo</button>}
          </div>
        )}
        {mode === "scan" && (
          <div>
            <div className="relative mx-auto aspect-[3/4] max-h-[60svh] overflow-hidden rounded-2xl bg-plum">
              <video ref={cam} autoPlay playsInline muted className={`h-full w-full object-cover ${scan === "live" || scan === "counting" ? "" : "hidden"}`} />
              <svg viewBox="0 0 300 400" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                <path d="M150 40a22 26 0 1 1 0 52a22 26 0 1 1 0-52M110 100h80l20 120-15 5-10-70v240h-30l-5-150-5 150h-30V155l-10 70-15-5Z" fill="none" stroke="#C9B6E4" strokeDasharray="6 6" strokeWidth="2" />
              </svg>
              <div className="absolute inset-x-0 bottom-3 text-center text-[12px] text-pearl">
                {scan === "idle" && <button onClick={startScan} className="label-sm rounded-full bg-pearl px-4 py-2.5 text-plum">Start camera</button>}
                {scan === "live" && <button onClick={capture} className="label-sm rounded-full bg-pearl px-4 py-2.5 text-plum">Align & scan</button>}
                {scan === "counting" && <span className="display text-[48px]">{count}</span>}
                {scan === "done" && <span>Scan captured. Measurements estimated from height; refine below.</span>}
                {scan === "error" && <span>Camera unavailable. Use photo or measurements instead.</span>}
              </div>
            </div>
            <p className="mt-2 text-[11px] text-ink-soft">On a phone: prop it at waist height, step back 2 m and turn slowly once.</p>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="flex justify-between text-[12px]"><span>Height</span><span className="tabular-nums text-amethyst">{body.height} cm</span></span>
          <input type="range" min="145" max="190" value={body.height} onChange={(e) => setBody({ ...body, ...(mode !== "measure" ? bodyFromHeight(+e.target.value) : {}), height: +e.target.value })} className="mt-1.5 w-full accent-[#6E4FA8]" />
        </label>
        {field("bust", "Bust", 72, 120)}
        {field("waist", "Waist", 54, 110)}
        {field("hip", "Hip", 80, 130)}
        <div>
          <span className="text-[12px]">Skin tone</span>
          <div className="mt-2 flex flex-wrap gap-3" role="radiogroup" aria-label="Skin tone">
            {SKIN.map((c) => (
              <button key={c} role="radio" aria-checked={body.skin === c} aria-label={`Skin tone ${c}`} onClick={() => setBody({ ...body, skin: c })} className={`h-11 w-11 rounded-full ring-offset-2 sm:h-9 sm:w-9 ${body.skin === c ? "ring-2 ring-amethyst" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
      <p className="mt-5 rounded-xl bg-mist/50 p-3 text-[11px] leading-relaxed text-ink-soft">
        <strong className="font-medium text-plum">Your body data is yours.</strong> Photos and scans are processed on this device and never uploaded. Measurements are stored only in this browser — <button className="underline" onClick={() => { try { localStorage.removeItem("fyf:body"); } catch {} setBody({ height: 165, bust: 88, waist: 70, hip: 96, skin: "#C99A7A" }); setPhoto(null); }}>delete them anytime</button>.
      </p>
    </div>
  );
}

function SizeRow({ id, size, setSize }) {
  const { body, returnHistory } = useApp();
  const p = byId(id);
  const rec = predictSize(p, body, returnHistory);
  const map = fitMap(p, size, body);
  if (rec.size === "One size") return <p className="text-[12px] text-ink-soft">{p.name} · one size</p>;
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[14px]">{p.name}</p>
        <span className="text-[11px] text-ink-soft">{formatPrice()}</span>
      </div>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label={`Size for ${p.name}`}>
        {SIZES.map((s) => (
          <button key={s} role="radio" aria-checked={size === s} onClick={() => setSize(id, s)} className={`relative min-h-10 flex-1 rounded-full py-2 text-[13px] transition ${size === s ? "bg-plum text-pearl" : "bg-mist/60 hover:bg-mist"}`}>
            {s}
            {rec.size === s && <Spark className="absolute -right-1 -top-1.5 h-3.5 w-3.5" />}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px]">
        <Spark className="h-3 w-3" animate={false} />
        <span>AI recommends <strong className="font-medium">{rec.size}</strong> · {rec.level} confidence</span>
        <span className="ml-auto h-1 w-16 overflow-hidden rounded-full bg-mist" aria-hidden><span className="block h-full bg-amethyst" style={{ width: `${rec.confidence * 100}%` }} /></span>
      </div>
      <p className="mt-1 text-[11px] text-ink-soft">{rec.reason}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Object.entries(map).map(([z, v]) => (
          <span key={z} className="rounded-full px-2 py-0.5 text-[10px] capitalize" style={{ background: HEAT[v.fit] + "33" }}>
            {z}: {v.fit}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function DressingRoom() {
  const params = useSearchParams();
  const { body, returnHistory, setReturnHistory, lookbook, saveLook, removeLook, addToBag, noteMood } = useApp();
  const [outfit, setOutfit] = useState(["aurora-gown", "halo-cape"]);
  const [sizes, setSizes] = useState({});
  const [pose, setPose] = useState("stand");
  const [heat, setHeat] = useState(false);
  const [spin, setSpin] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [tab, setTab] = useState("dress");
  const [toast, setToast] = useState(null);
  const campaign = params.get("campaign") === "1";

  useEffect(() => {
    const look = params.get("look");
    const mood = params.get("mood");
    if (look) {
      const ids = look.split(",").filter(byId);
      if (ids.length) setOutfit(ids.reduce(wear, []));
    } else if (mood) {
      const pick = PRODUCTS.filter((p) => p.moods.includes(mood));
      setOutfit(pick.slice(0, 3).map((p) => p.id).reduce(wear, []));
      noteMood(mood, 1);
    }
    if (campaign) setSpin(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Default every worn piece to its predicted size until the user picks one.
  const effectiveSizes = useMemo(
    () => Object.fromEntries(outfit.map((id) => [id, sizes[id] ?? predictSize(byId(id), body, returnHistory).size])),
    [outfit, sizes, body, returnHistory]
  );
  const setSize = useCallback((id, s) => setSizes((x) => ({ ...x, [id]: s })), []);
  const closeMirror = useCallback(() => setMirror(false), []);
  const flash = (t) => { setToast(t); setTimeout(() => setToast(null), 2200); };

  const share = async () => {
    const url = `${location.origin}/dressing-room?look=${outfit.join(",")}`; // garments only — never body data
    try {
      if (navigator.share) await navigator.share({ title: "My look — Fit Your Fashion", url });
      else { await navigator.clipboard.writeText(url); flash("Link copied"); }
    } catch {}
  };


  return (
    <div className={`min-h-[100svh] pt-28 ${campaign ? "bg-plum text-pearl" : "bg-pearl"}`}>
      {/* Phone: stage → wardrobe → avatar. Tablet: sticky stage beside the panels. xl: three columns. */}
      <div className="mx-auto grid max-w-[1700px] grid-cols-1 gap-3 px-3 pb-24 sm:gap-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_340px] md:pb-6 xl:h-[calc(100svh-5.5rem)] xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        {/* Avatar */}
        <aside id="avatar-panel" className="no-scrollbar order-3 scroll-mt-24 rounded-[24px] bg-white/80 p-5 text-plum md:col-start-2 md:row-start-2 xl:order-none xl:col-start-1 xl:row-start-1 xl:overflow-y-auto" data-lenis-prevent aria-label="Your avatar">
          <h2 className="display text-[30px]">Your avatar</h2>
          <p className="mb-5 mt-1 text-[12px] text-ink-soft">Create it once. Every size recommendation uses it.</p>
          <AvatarBuilder />
          <label className="mt-5 block text-[12px]">
            Return history (improves sizing)
            <select value={returnHistory} onChange={(e) => setReturnHistory(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-full border border-plum/15 bg-white px-4 py-2.5">
              <option value="none">No returns yet</option>
              <option value="tight">I usually return things for being too tight</option>
              <option value="loose">I usually return things for being too loose</option>
            </select>
          </label>
        </aside>

        {/* Stage */}
        <section className={`grain vignette relative order-1 h-[62svh] min-h-[440px] overflow-hidden rounded-[24px] md:sticky md:top-20 md:col-start-1 md:row-span-2 md:row-start-1 md:h-[calc(100svh-6rem)] md:self-start xl:relative xl:top-auto xl:order-none xl:col-start-2 xl:row-span-1 xl:h-auto xl:self-stretch ${campaign ? "bg-gradient-to-b from-plum-2 to-plum" : "bg-gradient-to-b from-white to-mist"}`} aria-label="3D try-on stage">
          <AvatarScene className="absolute inset-0" body={body} outfit={outfit} sizes={effectiveSizes} heatmap={heat} pose={pose} autoRotate={spin} dark={campaign} />
          {campaign && (
            <div className="pointer-events-none absolute left-4 top-4 z-[5] max-w-[70%] text-pearl sm:left-6 sm:top-6">
              <p className="label text-lavender">Campaign mode</p>
              <p className="display-i mt-2 text-[28px] leading-none sm:text-[40px]">On your body, in your tone.</p>
            </div>
          )}
          <div className="absolute inset-x-3 bottom-3 z-[5] flex flex-wrap items-center justify-center gap-2">
            <div className="flex gap-1 rounded-full bg-white/80 p-1 text-plum backdrop-blur" role="radiogroup" aria-label="Pose">
              {[["stand", "Stand"], ["hip", "Pose"], ["walk", "Walk"]].map(([k, t]) => (
                <button key={k} role="radio" aria-checked={pose === k} onClick={() => setPose(k)} className={`label-sm min-h-10 rounded-full px-3.5 py-2.5 ${pose === k ? "bg-plum text-pearl" : ""}`}>{t}</button>
              ))}
            </div>
            <button onClick={() => setSpin(!spin)} aria-pressed={spin} className={`label-sm rounded-full px-4 py-3 backdrop-blur ${spin ? "bg-plum text-pearl" : "bg-white/80 text-plum"}`}>360°</button>
            <button onClick={() => setHeat(!heat)} aria-pressed={heat} className={`ai-glow label-sm flex items-center gap-1.5 rounded-full px-4 py-3 backdrop-blur ${heat ? "bg-plum text-pearl" : "bg-white/80 text-plum"}`}><Spark className="h-3 w-3" />Heatmap</button>
            <button onClick={() => setMirror(true)} className="label-sm rounded-full bg-white/80 px-4 py-3 text-plum backdrop-blur" data-cursor="Mirror">Live Mirror</button>
          </div>
          {heat && <div className="absolute left-3 top-3 z-[5] md:left-1/2 md:top-4 md:-translate-x-1/2"><HeatLegend /></div>}
          <button onClick={() => document.getElementById("avatar-panel")?.scrollIntoView({ behavior: "smooth" })} className="label-sm absolute right-3 top-3 z-[5] min-h-11 rounded-full bg-white/80 px-4 text-plum backdrop-blur md:hidden">
            Your avatar ↓
          </button>
          {toast && <p className="absolute left-1/2 top-16 z-[6] -translate-x-1/2 rounded-full bg-plum px-4 py-2 text-[12px] text-pearl" role="status">{toast}</p>}
        </section>

        {/* Wardrobe */}
        <aside className="no-scrollbar order-2 flex flex-col rounded-[24px] bg-white/80 p-4 text-plum sm:p-5 md:col-start-2 md:row-start-1 xl:order-none xl:col-start-3 xl:overflow-y-auto" data-lenis-prevent aria-label="Wardrobe and fit">
          <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" role="tablist" aria-label="Categories">
            {SLOTS.map(([k, t]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`label-sm min-h-10 shrink-0 rounded-full px-3.5 py-2.5 ${tab === k ? "bg-plum text-pearl" : "bg-mist/60"}`}>{t}</button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3">
            {PRODUCTS.filter((p) => p.slot === tab).map((p) => {
              const on = outfit.includes(p.id);
              return (
                <button key={p.id} onClick={() => setOutfit((o) => wear(o, p.id))} aria-pressed={on} className={`rounded-xl p-1 text-left transition ${on ? "bg-mist ring-2 ring-amethyst" : "hover:bg-mist/50"}`} data-cursor={on ? "Remove" : "Try on"}>
                  <GarmentArt product={p} className="aspect-[3/4] rounded-lg" tag={false} />
                  <span className="mt-1 block truncate px-0.5 text-[11px]">{p.name}</span>
                </button>
              );
            })}
          </div>

          <h3 className="label mt-6 text-amethyst">Wearing · fit</h3>
          <div className="mt-3 space-y-2">
            {outfit.length ? outfit.map((id) => <SizeRow key={id} id={id} size={effectiveSizes[id]} setSize={setSize} />) : <p className="text-[13px] text-ink-soft">Choose pieces above to dress your avatar.</p>}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button disabled={!outfit.length} onClick={() => { saveLook({ items: outfit, sizes: effectiveSizes, pose }); flash("Saved to your Lookbook"); }} className="label-sm rounded-full bg-plum py-3.5 text-pearl disabled:opacity-40">Save look</button>
            <button disabled={!outfit.length} onClick={share} className="label-sm rounded-full border border-plum/25 py-3.5 disabled:opacity-40">Share</button>
            <button disabled={!outfit.length} onClick={() => { outfit.forEach((id) => addToBag(id, effectiveSizes[id])); flash("Look added to bag"); }} className="label-sm col-span-2 rounded-full border border-plum/25 py-3.5 disabled:opacity-40">Add look to bag</button>
          </div>

          <h3 className="label mt-7 text-amethyst">Lookbook</h3>
          {lookbook.length === 0 && <p className="mt-2 text-[12px] text-ink-soft">Saved looks appear here.</p>}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
            {lookbook.map((l) => (
              <div key={l.at} className="rounded-xl bg-mist/50 p-2">
                <button className="flex w-full -space-x-6" onClick={() => { setOutfit(l.items); setSizes(l.sizes ?? {}); setPose(l.pose ?? "stand"); }} aria-label="Wear this saved look">
                  {l.items.slice(0, 3).map((id) => <GarmentArt key={id} product={byId(id)} className="aspect-[3/4] w-1/2 rounded-md ring-2 ring-white" tag={false} />)}
                </button>
                <button onClick={() => removeLook(l.at)} className="label-sm mt-1 py-2 text-[10px] text-plum/50">Remove</button>
              </div>
            ))}
          </div>
          <Link href="/" className="label-sm mt-6 py-3 text-plum/50">← Back to the film</Link>
        </aside>
      </div>
      {mirror && <LiveMirror outfit={outfit} onClose={closeMirror} />}
    </div>
  );
}
