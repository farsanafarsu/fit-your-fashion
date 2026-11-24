"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ENDPOINT, GARMENTS_URL, GUIDANCE, PHOTO_MAX_SIDE, PRODUCTS_URL, SPACE, TIMESTEPS, assetUrl, guessCategory, track } from "./config";

// Two ways to try on:
//  • INSTANT (default): live camera; the garment follows your body. Runs in your browser (live.js): free, no queue.
//  • HD: a realistic AI picture from a Hugging Face Space. Uses a camera frame or an uploaded photo; may queue.
// Flow: consent (first time) → starting → live ⇄ (working → done) ; photo = upload screen for HD; error.
const CONSENT_KEY = "fyf-tryon-consent-v2";
const STATUS = {
  consent: "Ready when you are",
  starting: "Starting your camera…",
  live: "Live",
  photo: "HD try-on",
  working: "Making your HD photo…",
  done: "HD try-on",
  error: "Something went wrong",
};

// Kept in memory for this page visit only (never written to storage).
let saved = null; // the person photo for HD: { blob, url, id }
const results = new Map(); // `${photoId}|${garment image}` -> HD result URL
let clientPromise = null;
let metaPromise = null;

function getClient() {
  if (!clientPromise) {
    clientPromise = import("@gradio/client").then(async ({ Client, handle_file }) => ({
      app: await Client.connect(SPACE, { events: ["data", "status"] }),
      handle_file,
    }));
    clientPromise.catch(() => { clientPromise = null; });
  }
  return clientPromise;
}
const getMeta = () => (metaPromise ||= fetch(`${GARMENTS_URL}/meta.json`).then((r) => r.json()).catch(() => ({})));

const absolute = (src) => new URL(assetUrl(src), window.location.href).href;

// Shrink to PHOTO_MAX_SIDE and re-encode as JPEG: faster upload, and strips the photo's metadata (location etc.).
async function shrink(source) {
  const img = source instanceof Blob ? await createImageBitmap(source) : source;
  const w = img.videoWidth || img.width, h = img.videoHeight || img.height;
  const k = Math.min(1, PHOTO_MAX_SIDE / Math.max(w, h));
  const c = Object.assign(document.createElement("canvas"), { width: Math.round(w * k), height: Math.round(h * k) });
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("photo"))), "image/jpeg", 0.9));
}

function explain(err) {
  const name = err?.name || "", msg = String(err?.message || "");
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access was blocked. Allow the camera for this site, or upload a photo for an HD try-on instead.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "We couldn't find a camera on this device. Upload a photo for an HD try-on instead.";
  if (name === "NotReadableError") return "Your camera is busy in another app. Close it there, or upload a photo instead.";
  if (msg === "photo" || name === "InvalidStateError" || name === "EncodingError") return "We couldn't read that photo. Please try a JPG or PNG.";
  if (/quota|exceeded|ZeroGPU|GPU (task|duration)|daily/i.test(msg)) return "You've used today's free HD try-ons on this device. They refill within a day. The live try-on still works.";
  if (/queue is full|too many/i.test(msg)) return "HD try-on is very busy. Please try again in a minute, or use the live try-on.";
  if (/sleep|building|paused|runtime|not (found|running)|fetch|network|connect|wasm|model/i.test(msg)) return "We couldn't reach the try-on service. Check your connection and try again.";
  return msg ? `Couldn't make the try-on: ${msg}` : "Couldn't make the try-on. Please try again.";
}

export default function TryOnModal({ product, onClose, onAddToCart }) {
  const [current, setCurrent] = useState(product);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [state, setState] = useState(() => (typeof window !== "undefined" && localStorage.getItem(CONSENT_KEY) ? "starting" : "consent"));
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState("");
  const [photoUrl, setPhotoUrl] = useState(saved?.url || "");
  const [result, setResult] = useState("");
  const [queue, setQueue] = useState(null);
  const [secs, setSecs] = useState(0);
  const [toast, setToast] = useState("");
  const [dropping, setDropping] = useState(false);
  const closeBtn = useRef(null), fileInput = useRef(null), video = useRef(null), canvas = useRef(null);
  const stream = useRef(null), live = useRef(null), job = useRef(null), run = useRef(0), liveRun = useRef(0);
  const productsRef = useRef([]), metaRef = useRef({});
  const currentRef = useRef(product);
  currentRef.current = current;

  const toastTimer = useRef(null);
  const flash = (msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), 2600); };

  const categoryOf = (p) => p.category || productsRef.current.find((x) => x.id === p.id)?.category || guessCategory(p.name);
  const instantFor = (p) => (p?.id && metaRef.current[p.id]?.instant ? metaRef.current[p.id] : null);

  // ── camera + live engine ──────────────────────────────────────────────────
  const stopLive = useCallback(() => {
    liveRun.current++;
    live.current?.stop(); live.current = null;
    stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);

  const cancelJob = useCallback(() => {
    run.current++;
    try { job.current?.cancel?.(); } catch {}
    job.current = null;
  }, []);

  const fail = useCallback((err) => {
    setError(explain(err));
    setState("error");
    track("tryon_error", { message: String(err?.message || err), product: currentRef.current?.id });
  }, []);

  const wear = useCallback(async (p) => {
    const m = instantFor(p), engine = live.current;
    if (!engine) return;
    if (!m) return engine.clearGarment();
    try { await engine.setGarment(m, `${GARMENTS_URL}/${p.id}.webp`, categoryOf(p)); } catch { engine.clearGarment(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLive = useCallback(async () => {
    cancelJob();
    stopLive();
    const mine = liveRun.current;
    setError(""); setTracking(""); setState("starting");
    try {
      const [s, { startLive: start }] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 1280 } } }),
        import("./live"),
        getMeta().then((m) => { metaRef.current = m; setMeta(m); }),
      ]);
      if (mine !== liveRun.current) return s.getTracks().forEach((t) => t.stop());
      stream.current = s;
      video.current.srcObject = s;
      await video.current.play().catch(() => {});
      const engine = await start({ video: video.current, canvas: canvas.current, onStatus: setTracking });
      if (mine !== liveRun.current) return engine.stop();
      live.current = engine;
      await wear(currentRef.current);
      setState("live");
      track("tryon_live", { product: currentRef.current?.id });
    } catch (e) {
      if (mine === liveRun.current) { stopLive(); fail(e); }
    }
  }, [cancelJob, stopLive, wear, fail]);

  // ── HD (Hugging Face) ─────────────────────────────────────────────────────
  const generate = useCallback(async (p) => {
    if (!saved) return setState("photo");
    cancelJob();
    const mine = run.current;
    const key = `${saved.id}|${p.image}`;
    setError("");
    if (results.has(key)) { setResult(results.get(key)); setState("done"); return; }
    setResult(""); setQueue(null); setSecs(0); setState("working");
    track("tryon_started", { product: p.id });
    try {
      const [{ app, handle_file }, garment] = await Promise.all([getClient(), fetch(absolute(p.image)).then((r) => r.blob())]);
      if (mine !== run.current) return;
      const sub = app.submit(ENDPOINT, {
        person_image: handle_file(saved.blob),
        garment_image: handle_file(garment),
        category: categoryOf(p),
        garment_photo_type: "model", // product photos show the piece worn; use "flat-lay" for flat shots
        num_timesteps: TIMESTEPS,
        guidance_scale: GUIDANCE,
        seed: 42,
        segmentation_free: true,
      });
      job.current = sub;
      let got = false;
      for await (const msg of sub) {
        if (mine !== run.current) return;
        if (msg.type === "status") {
          if (msg.stage === "error") throw new Error(msg.message || "The try-on service returned an error.");
          setQueue(msg.stage === "pending" && msg.queue && msg.position != null ? msg.position + 1 : null);
        } else if (msg.type === "data") {
          const out = msg.data?.[0];
          const url = typeof out === "string" ? out : out?.url;
          if (!url) throw new Error("No picture came back.");
          results.set(key, url);
          setResult(url); setState("done");
          track("tryon_done", { product: p.id });
          got = true;
          break;
        }
      }
      if (!got && mine === run.current) throw new Error("The try-on service stopped without a picture.");
    } catch (e) {
      if (mine === run.current) fail(e);
    } finally {
      if (mine === run.current) job.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelJob, fail]);

  const acceptPhoto = useCallback((blob) => {
    if (saved?.url) URL.revokeObjectURL(saved.url);
    saved = { blob, url: URL.createObjectURL(blob), id: Date.now() };
    setPhotoUrl(saved.url);
    track("tryon_photo_added", { product: currentRef.current?.id });
    generate(currentRef.current);
  }, [generate]);

  // HD from the live camera: grab the current frame (without the overlay), then stop the camera.
  const hdFromCamera = async () => {
    const engine = live.current;
    if (!engine || !video.current?.videoWidth) return setState("photo");
    try {
      const blob = await shrink(engine.frame());
      stopLive();
      acceptPhoto(blob);
    } catch (e) { fail(e); }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    stopLive();
    try { acceptPhoto(await shrink(file)); } catch (err) { fail(err); }
  };

  // ── actions ───────────────────────────────────────────────────────────────
  const consent = () => { localStorage.setItem(CONSENT_KEY, "1"); startLive(); };

  const swap = useCallback((p) => {
    if (!p || p.id === currentRef.current?.id) return;
    setCurrent(p);
    currentRef.current = p;
    track("tryon_swapped", { product: p.id });
    if (live.current) wear(p);
    else if (saved && (state === "done" || state === "working")) generate(p);
  }, [wear, generate, state]);

  const save = async (blobOrUrl, label) => {
    const name = `fit-your-fashion-${current.id || "look"}${label}.png`;
    try {
      const blob = typeof blobOrUrl === "string" ? await (await fetch(blobOrUrl)).blob() : blobOrUrl;
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      flash("Saved to your downloads");
    } catch {
      if (typeof blobOrUrl === "string") window.open(blobOrUrl, "_blank", "noopener");
    }
  };
  const snapshot = async () => {
    if (state === "done") { track("tryon_download", { product: current.id }); return save(result, "-hd"); }
    if (!live.current) return;
    track("tryon_snapshot", { product: current.id });
    save(await live.current.snapshot(), "");
  };

  const addToCart = () => {
    onAddToCart?.(current);
    track("tryon_add_to_cart", { product: current.id });
    flash(`${current.name} added to your bag`);
  };

  useEffect(() => {
    if (state !== "working") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    track("tryon_opened", { product: product.id });
    closeBtn.current?.focus();
    fetch(PRODUCTS_URL).then((r) => r.json()).then((list) => { productsRef.current = list; setProducts(list); }).catch(() => setProducts([]));
    getMeta().then((m) => { metaRef.current = m; setMeta(m); });
    if (localStorage.getItem(CONSENT_KEY)) startLive();
    else import("./live").then((m) => m.warmUp()); // fetch the engine while they read
    const onKey = (e) => e.key === "Escape" && onClose();
    const onHide = () => document.hidden && live.current && (stopLive(), setState("photo"));
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onHide); cancelJob(); stopLive(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const working = state === "working";
  const isLive = state === "live";
  const noInstant = isLive && !meta[current.id]?.instant;
  const strip = products.some((p) => p.id === current.id) || !current.id ? products : [current, ...products];
  const btn = "label-sm rounded-full border border-white/25 px-5 py-3 transition hover:bg-white hover:text-plum disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-pearl";

  return (
    <div className="fixed inset-0 z-[160] flex items-stretch justify-center bg-plum/85 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Try on: ${current.name}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <div className="flex h-full w-full max-w-[1040px] flex-col overflow-hidden bg-plum-2 text-pearl shadow-[0_40px_120px_-30px_rgba(0,0,0,.7)] sm:h-auto sm:max-h-[94svh] sm:rounded-[28px]">
        {/* header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="label-sm text-lavender">Virtual try-on</p>
            <p className="display truncate text-[22px] leading-tight sm:text-[26px]">{current.name}</p>
          </div>
          <button ref={closeBtn} onClick={onClose} aria-label="Close try-on" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 transition hover:bg-white hover:text-plum">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {/* stage */}
        <div
          className={`relative min-h-0 flex-1 bg-[#120c1f] sm:h-[min(60svh,640px)] sm:flex-none ${dropping ? "ring-2 ring-inset ring-lavender" : ""}`}
          onDragOver={(e) => { if (e.dataTransfer.types.includes("text/tryon-id")) { e.preventDefault(); setDropping(true); } }}
          onDragLeave={() => setDropping(false)}
          onDrop={(e) => { e.preventDefault(); setDropping(false); swap(strip.find((p) => p.id === e.dataTransfer.getData("text/tryon-id"))); }}
        >
          {/* live: the video feeds the engine; the canvas shows camera + garment, mirrored like a mirror */}
          <video ref={video} autoPlay playsInline muted className="pointer-events-none absolute inset-0 h-full w-full opacity-0" aria-hidden />
          <canvas ref={canvas} className={`absolute inset-0 h-full w-full -scale-x-100 object-contain transition-opacity duration-500 ${isLive ? "opacity-100" : "opacity-0"}`} aria-label={`Live view of you wearing ${current.name}`} />

          {/* HD: your photo while working, the result when done */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {working && photoUrl && <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-contain opacity-40 blur-[2px]" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {state === "done" && result && <img src={result} alt={`You wearing ${current.name}`} className="absolute inset-0 h-full w-full object-contain" />}

          {/* status */}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
            <span role="status" className={`label-sm flex items-center gap-2 rounded-full px-3.5 py-2 ${isLive || state === "done" ? "bg-white text-plum" : "bg-white/12 text-pearl"}`}>
              <span className={`h-2 w-2 rounded-full ${state === "error" ? "bg-[#e5484d]" : isLive ? "bg-[#e5484d] motion-safe:animate-pulse" : working || state === "starting" ? "bg-lavender motion-safe:animate-pulse" : state === "done" ? "bg-[#30a46c]" : "bg-white/50"}`} aria-hidden />
              {STATUS[state]}
            </span>
            {working && <span className="label-sm rounded-full bg-white/12 px-3.5 py-2 tabular-nums">{queue ? `In line: ${queue}` : `${secs}s`}</span>}
          </div>

          {/* overlays per state */}
          {state === "consent" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="max-w-[460px]">
                <p className="display text-[30px] leading-tight">See it on you, live.</p>
                <p className="mt-3 text-[14px] leading-relaxed text-mist/85">
                  Your camera opens and the piece follows you as you move. <strong className="text-pearl">This runs on your device</strong>: your video is never uploaded or stored.
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-mist/70">For a realistic AI photo, tap <em>HD photo</em>. Only then is one picture sent to our AI model on Hugging Face, and we don't keep it.</p>
                <button onClick={consent} className="label mt-6 rounded-full bg-pearl px-7 py-4 text-plum transition-colors hover:bg-lavender">Allow camera &amp; start</button>
              </div>
            </div>
          )}
          {state === "starting" && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <span className="mx-auto block h-12 w-12 rounded-full border-2 border-white/25 border-t-pearl motion-safe:animate-spin" aria-hidden />
                <p className="mt-4 text-[14px] text-mist/90">Loading the fitting room. The first time takes a few seconds.</p>
              </div>
            </div>
          )}
          {isLive && (
            <p className="pointer-events-none absolute inset-x-4 bottom-3 text-center text-[13px] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.8)] sm:bottom-4">
              {noInstant
                ? "The live preview isn't ready for this piece yet. Tap HD photo to see it on you."
                : tracking === "no-person"
                  ? "Step back until your shoulders and hips are in view."
                  : "Stand facing the camera in good light. The piece follows you."}
            </p>
          )}
          {state === "photo" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="max-w-[440px]">
                <p className="display text-[28px] leading-tight">HD try-on</p>
                <p className="mt-2 text-[14px] leading-relaxed text-mist/80">Upload a photo of you (facing the camera, good light, plain background), or go back to the live try-on.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  <button onClick={() => fileInput.current?.click()} className="label rounded-full bg-pearl px-6 py-4 text-plum transition-colors hover:bg-lavender">Upload a photo</button>
                  <button onClick={startLive} className="label rounded-full border border-white/30 px-6 py-4 transition hover:bg-white hover:text-plum">Live try-on</button>
                </div>
              </div>
            </div>
          )}
          {working && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <span className="mx-auto block h-12 w-12 rounded-full border-2 border-white/25 border-t-pearl motion-safe:animate-spin" aria-hidden />
                <p className="mt-4 max-w-[380px] text-[14px] text-mist/90">{queue ? "HD try-on is busy. Waiting for a free spot…" : "Usually 20–60 seconds."}</p>
              </div>
            </div>
          )}
          {state === "error" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="max-w-[440px]">
                <p className="text-[15px] leading-relaxed text-mist" role="alert">{error}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                  <button onClick={startLive} className="label rounded-full bg-pearl px-6 py-3.5 text-plum transition-colors hover:bg-lavender">Live try-on</button>
                  <button onClick={() => fileInput.current?.click()} className="label rounded-full border border-white/30 px-6 py-3.5 transition hover:bg-white hover:text-plum">Upload a photo</button>
                </div>
              </div>
            </div>
          )}
          {toast && <p className="label-sm absolute left-1/2 top-16 -translate-x-1/2 rounded-full bg-pearl px-4 py-2.5 text-plum" role="status">{toast}</p>}
        </div>

        {/* controls */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3 sm:px-6">
          {state === "done" || working ? (
            <button onClick={startLive} className={btn}>Back to live</button>
          ) : (
            <button onClick={hdFromCamera} disabled={!isLive} className={btn} title="A realistic AI photo. Takes 20–60 seconds.">HD photo ✦</button>
          )}
          <button onClick={snapshot} disabled={!(isLive && !noInstant) && state !== "done"} className={btn}>{state === "done" ? "Download" : "Snapshot"}</button>
          <button onClick={() => fileInput.current?.click()} disabled={state === "consent"} className={`${btn} hidden sm:inline-block`}>Upload photo</button>
          <button onClick={addToCart} className="label-sm ml-auto rounded-full bg-lavender px-5 py-3 text-plum transition hover:bg-pearl">Add to bag</button>
        </div>

        {/* other pieces */}
        {strip.length > 0 && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-6">
            <p className="label-sm mb-2 text-mist/70">Try another piece — tap, or drag it onto the picture</p>
            <ul className="flex gap-2.5 overflow-x-auto pb-1">
              {strip.map((p) => (
                <li key={p.id || p.image} className="shrink-0">
                  <button
                    onClick={() => swap(p)}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/tryon-id", p.id)}
                    aria-pressed={p.id === current.id}
                    title={meta[p.id]?.instant ? p.name : `${p.name} (HD only)`}
                    className={`relative block h-[78px] w-[60px] overflow-hidden rounded-xl border-2 transition sm:h-[92px] sm:w-[70px] ${p.id === current.id ? "border-lavender" : "border-transparent opacity-75 hover:opacity-100"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={assetUrl(p.image)} alt={p.name} className="h-full w-full object-cover" draggable={false} />
                    {!meta[p.id]?.instant && <span className="label-sm absolute inset-x-0 bottom-0 bg-plum/80 py-0.5 text-center text-[9px]">HD</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
