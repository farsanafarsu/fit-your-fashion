"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ENDPOINT, GUIDANCE, PHOTO_MAX_SIDE, PRODUCTS_URL, SPACE, TIMESTEPS, assetUrl, guessCategory, track } from "./config";

// Photo virtual try-on on a Hugging Face Space (FASHN VTON v1.5).
// Flow: consent (first time only) → add a photo (upload or camera) → working (queue + seconds) → result / error.
// Swapping the piece re-uses the same photo. The Gradio client is imported only when someone starts.
const CONSENT_KEY = "fyf-tryon-photo-consent";
const STATUS = {
  consent: "Ready when you are",
  photo: "Add your photo",
  camera: "Camera on",
  working: "Dressing you…",
  done: "Your try-on",
  error: "Something went wrong",
};

// Kept in memory for this page visit only (never written to storage), so each piece doesn't need a new photo.
let saved = null; // { blob, url, id }
const results = new Map(); // `${photoId}|${garment image}` -> result URL
let clientPromise = null;

function getClient() {
  if (!clientPromise) {
    clientPromise = import("@gradio/client").then(async ({ Client, handle_file }) => ({
      app: await Client.connect(SPACE, { events: ["data", "status"] }),
      handle_file,
    }));
    clientPromise.catch(() => { clientPromise = null; }); // let the next attempt reconnect
  }
  return clientPromise;
}

const absolute = (src) => new URL(assetUrl(src), window.location.href).href;

// Shrink to PHOTO_MAX_SIDE and re-encode as JPEG: faster upload, and strips the photo's metadata (location etc.).
async function shrink(source, mirror = false) {
  const img = source instanceof Blob ? await createImageBitmap(source) : source;
  const w = img.videoWidth || img.width, h = img.videoHeight || img.height;
  const k = Math.min(1, PHOTO_MAX_SIDE / Math.max(w, h));
  const c = Object.assign(document.createElement("canvas"), { width: Math.round(w * k), height: Math.round(h * k) });
  const ctx = c.getContext("2d");
  if (mirror) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("photo"))), "image/jpeg", 0.9));
}

// Friendly words for the failures people actually hit.
function explain(err) {
  const name = err?.name || "", msg = String(err?.message || "");
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access was blocked. Allow the camera for this site, or upload a photo instead.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "We couldn't find a camera on this device. Upload a photo instead.";
  if (name === "NotReadableError") return "Your camera is busy in another app. Close it there, or upload a photo instead.";
  if (msg === "photo" || name === "InvalidStateError" || name === "EncodingError") return "We couldn't read that photo. Please try a JPG or PNG.";
  if (/quota|exceeded|ZeroGPU|GPU (task|duration)|daily/i.test(msg)) return "You've used today's free try-ons on this device. They refill within a day, so please come back later.";
  if (/queue is full|too many/i.test(msg)) return "The fitting room is very busy. Please try again in a minute.";
  if (/sleep|building|paused|runtime|not (found|running)|fetch|network|connect/i.test(msg)) return "The try-on service is waking up or can't be reached. Please try again in a minute.";
  return msg ? `Couldn't make the try-on: ${msg}` : "Couldn't make the try-on. Please try again.";
}

export default function TryOnModal({ product, onClose, onAddToCart }) {
  const [current, setCurrent] = useState(product);
  const [products, setProducts] = useState([]);
  const [state, setState] = useState(() => (typeof window !== "undefined" && localStorage.getItem(CONSENT_KEY) ? "photo" : "consent"));
  const [error, setError] = useState("");
  const [photoUrl, setPhotoUrl] = useState(saved?.url || "");
  const [result, setResult] = useState("");
  const [queue, setQueue] = useState(null);
  const [secs, setSecs] = useState(0);
  const [toast, setToast] = useState("");
  const [dropping, setDropping] = useState(false);
  const closeBtn = useRef(null), fileInput = useRef(null), video = useRef(null);
  const stream = useRef(null), job = useRef(null), run = useRef(0);
  const productsReady = useRef(null), productsRef = useRef([]);
  const currentRef = useRef(product);
  currentRef.current = current;

  const toastTimer = useRef(null);
  const flash = (msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), 2600); };

  const stopCamera = useCallback(() => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);

  const cancelJob = useCallback(() => {
    run.current++; // invalidates anything still in flight
    try { job.current?.cancel?.(); } catch {}
    job.current = null;
  }, []);

  const fail = useCallback((err) => {
    stopCamera();
    setError(explain(err));
    setState("error");
    track("tryon_error", { message: String(err?.message || err), product: currentRef.current?.id });
  }, [stopCamera]);

  const categoryOf = (p) => p.category || productsRef.current.find((x) => x.id === p.id)?.category || guessCategory(p.name);

  // Ask the Space for a picture of `saved` wearing `p`. Results are cached, so swapping back is instant.
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
      await productsReady.current;
      const [{ app, handle_file }, garment] = await Promise.all([getClient(), fetch(absolute(p.image)).then((r) => r.blob())]);
      if (mine !== run.current) return;
      const sub = app.submit(ENDPOINT, {
        person_image: handle_file(saved.blob),
        garment_image: handle_file(garment),
        category: categoryOf(p),
        garment_photo_type: "model", // your product photos show the piece worn; use "flat-lay" for flat shots
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
          setResult(url);
          setState("done");
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

  const acceptPhoto = useCallback(async (blob) => {
    if (saved?.url) URL.revokeObjectURL(saved.url);
    saved = { blob, url: URL.createObjectURL(blob), id: Date.now() };
    setPhotoUrl(saved.url);
    track("tryon_photo_added", { product: currentRef.current?.id });
    generate(currentRef.current);
  }, [generate]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try { await acceptPhoto(await shrink(file)); } catch (err) { fail(err); }
  };

  const openCamera = async () => {
    cancelJob();
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } } });
      stream.current = s;
      setState("camera");
      requestAnimationFrame(() => { if (video.current) video.current.srcObject = s; });
    } catch (err) { fail(err); }
  };

  const capture = async () => {
    const v = video.current;
    if (!v?.videoWidth) return flash("One moment, the camera is starting…");
    try {
      const blob = await shrink(v, true); // mirrored, so it matches what you saw
      stopCamera();
      await acceptPhoto(blob);
    } catch (err) { fail(err); }
  };

  const consent = () => {
    localStorage.setItem(CONSENT_KEY, "1");
    if (saved) generate(currentRef.current); else setState("photo");
  };

  // Swap the piece: re-runs on the same photo (or just selects it if there's no photo yet).
  const swap = useCallback((p) => {
    if (!p || p.id === currentRef.current?.id) return;
    setCurrent(p);
    currentRef.current = p;
    track("tryon_swapped", { product: p.id });
    if (saved && localStorage.getItem(CONSENT_KEY) && state !== "camera") generate(p);
  }, [generate, state]);

  const download = async () => {
    if (!result) return;
    const name = `fit-your-fashion-${current.id || "look"}.png`;
    try {
      const blob = await (await fetch(result)).blob();
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      flash("Saved to your downloads");
    } catch {
      window.open(result, "_blank", "noopener"); // if the download is blocked, open the picture instead
    }
    track("tryon_download", { product: current.id });
  };

  const addToCart = () => {
    onAddToCart?.(current);
    track("tryon_add_to_cart", { product: current.id });
    flash(`${current.name} added to your bag`);
  };

  // Seconds counter while working.
  useEffect(() => {
    if (state !== "working") return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  // Open: products for the strip, focus, and if they've already given a photo this visit, go straight to it.
  useEffect(() => {
    track("tryon_opened", { product: product.id });
    closeBtn.current?.focus();
    productsReady.current = fetch(PRODUCTS_URL).then((r) => r.json()).then((list) => { productsRef.current = list; setProducts(list); }).catch(() => setProducts([]));
    if (saved && localStorage.getItem(CONSENT_KEY)) generate(product);
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); cancelJob(); stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const working = state === "working";
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
          className={`relative min-h-0 flex-1 bg-[#120c1f] sm:h-[min(56svh,600px)] sm:flex-none ${dropping ? "ring-2 ring-inset ring-lavender" : ""}`}
          onDragOver={(e) => { if (e.dataTransfer.types.includes("text/tryon-id")) { e.preventDefault(); setDropping(true); } }}
          onDragLeave={() => setDropping(false)}
          onDrop={(e) => { e.preventDefault(); setDropping(false); swap(strip.find((p) => p.id === e.dataTransfer.getData("text/tryon-id"))); }}
        >
          {/* camera preview, mirrored */}
          {state === "camera" && <video ref={video} autoPlay playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />}

          {/* your photo while working, the result when done */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {working && photoUrl && <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-contain opacity-40 blur-[2px]" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {state === "done" && result && <img src={result} alt={`You wearing ${current.name}`} className="absolute inset-0 h-full w-full object-contain" />}
          {state === "done" && photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Your photo" className="absolute bottom-3 left-3 h-[84px] w-[64px] rounded-xl border-2 border-white/60 object-cover shadow-lg sm:bottom-4 sm:left-4 sm:h-[110px] sm:w-[84px]" />
          )}

          {/* status */}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
            <span role="status" className={`label-sm flex items-center gap-2 rounded-full px-3.5 py-2 ${state === "done" ? "bg-white text-plum" : "bg-white/12 text-pearl"}`}>
              <span className={`h-2 w-2 rounded-full ${state === "error" ? "bg-[#e5484d]" : working ? "bg-lavender motion-safe:animate-pulse" : state === "done" ? "bg-[#30a46c]" : "bg-white/50"}`} aria-hidden />
              {STATUS[state]}
            </span>
            {working && <span className="label-sm rounded-full bg-white/12 px-3.5 py-2 tabular-nums">{queue ? `In line: ${queue}` : `${secs}s`}</span>}
          </div>

          {/* overlays per state */}
          {state === "consent" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="max-w-[440px]">
                <p className="display text-[30px] leading-tight">See it on you.</p>
                <p className="mt-3 text-[14px] leading-relaxed text-mist/85">
                  Add a photo of yourself and our AI dresses you in this piece. Your photo is sent to our try-on model on Hugging Face only to make the picture. <strong className="text-pearl">We don't keep it</strong>, and it's forgotten when you leave this page.
                </p>
                <button onClick={consent} className="label mt-6 rounded-full bg-pearl px-7 py-4 text-plum transition-colors hover:bg-lavender">I agree, let's start</button>
              </div>
            </div>
          )}
          {state === "photo" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="max-w-[440px]">
                <p className="display text-[28px] leading-tight">Add a photo of you</p>
                <p className="mt-2 text-[14px] leading-relaxed text-mist/80">Best results: stand facing the camera, full or half body, in good light, with a plain background.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                  <button onClick={() => fileInput.current?.click()} className="label rounded-full bg-pearl px-6 py-4 text-plum transition-colors hover:bg-lavender">Upload a photo</button>
                  <button onClick={openCamera} className="label rounded-full border border-white/30 px-6 py-4 transition hover:bg-white hover:text-plum">Take a photo</button>
                </div>
              </div>
            </div>
          )}
          {state === "camera" && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2.5">
              <button onClick={capture} className="label rounded-full bg-pearl px-7 py-4 text-plum transition-colors hover:bg-lavender">Capture</button>
              <button onClick={() => { stopCamera(); setState("photo"); }} className="label rounded-full border border-white/40 bg-black/30 px-6 py-4 transition hover:bg-white hover:text-plum">Cancel</button>
            </div>
          )}
          {working && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <span className="mx-auto block h-12 w-12 rounded-full border-2 border-white/25 border-t-pearl motion-safe:animate-spin" aria-hidden />
                <p className="mt-4 text-[14px] text-mist/90">{queue ? "Waiting for a free fitting room…" : "Usually 20–60 seconds. The first try can take longer while the model wakes up."}</p>
              </div>
            </div>
          )}
          {state === "error" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="max-w-[440px]">
                <p className="text-[15px] leading-relaxed text-mist" role="alert">{error}</p>
                <button onClick={() => (saved ? generate(current) : setState("photo"))} className="label mt-5 rounded-full bg-pearl px-6 py-3.5 text-plum transition-colors hover:bg-lavender">Try again</button>
              </div>
            </div>
          )}
          {toast && <p className="label-sm absolute left-1/2 top-16 -translate-x-1/2 rounded-full bg-pearl px-4 py-2.5 text-plum" role="status">{toast}</p>}
        </div>

        {/* controls */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3 sm:px-6">
          <button onClick={() => { cancelJob(); stopCamera(); setState(localStorage.getItem(CONSENT_KEY) ? "photo" : "consent"); }} disabled={state === "consent"} className={btn}>{photoUrl ? "Change photo" : "Add photo"}</button>
          <button onClick={download} disabled={state !== "done"} className={btn}>Download</button>
          <button onClick={addToCart} className="label-sm ml-auto rounded-full bg-lavender px-5 py-3 text-plum transition hover:bg-pearl">Add to bag</button>
        </div>

        {/* other pieces: click or drag onto the picture */}
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
                    title={p.name}
                    className={`block h-[78px] w-[60px] overflow-hidden rounded-xl border-2 transition sm:h-[92px] sm:w-[70px] ${p.id === current.id ? "border-lavender" : "border-transparent opacity-75 hover:opacity-100"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={assetUrl(p.image)} alt={p.name} className="h-full w-full object-cover" draggable={false} />
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
