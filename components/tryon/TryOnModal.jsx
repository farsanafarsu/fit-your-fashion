"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MODEL, PRODUCTS_URL, SESSION_SECONDS, TOKEN_URL, assetUrl, track } from "./config";

// Live virtual try-on with Decart (lucy-vton). Flow: consent (first time only) → camera → connecting →
// live (3-minute countdown) → ended / error. Decart's SDK is imported only when a session starts.
// The browser never sees the API key: it asks TOKEN_URL for a 60-second client token instead.
const CONSENT_KEY = "fyf-tryon-consent";
const STATUS = {
  consent: "Ready when you are",
  camera: "Waiting for your camera…",
  connecting: "Connecting to the fitting room…",
  live: "Live",
  ended: "Session ended",
  error: "Something went wrong",
};
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const absolute = (src) => new URL(assetUrl(src), window.location.href).href;

// Friendly words for the failures people actually hit.
function explain(err) {
  const name = err?.name || "", code = err?.code || "", status = err?.status;
  if (name === "NotAllowedError" || name === "SecurityError") return "Camera access was blocked. Allow the camera for this site in your browser, then press Start.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "We couldn't find a camera on this device.";
  if (name === "NotReadableError") return "Your camera is busy in another app. Close it there, then press Start.";
  if (status === 429) return err.message || "Try-on is busy right now. Please try again in a little while.";
  if (status === 403) return "Try-on isn't available on this address.";
  if (status && err.message) return err.message; // the token service already wrote a friendly sentence
  if (code === "INSUFFICIENT_CREDITS" || /credit/i.test(err?.message || "")) return "Try-on is resting for now. Please try again later.";
  return err?.message ? `Couldn't start the try-on: ${err.message}` : "Couldn't start the try-on. Please try again.";
}

async function fetchToken() {
  if (!TOKEN_URL) throw Object.assign(new Error("Try-on isn't set up yet (no token service configured)."), { status: 0 });
  const r = await fetch(TOKEN_URL, { method: "POST" });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(body.message || `Token service said ${r.status}`), { status: r.status });
  return body.apiKey;
}

export default function TryOnModal({ product, onClose, onAddToCart }) {
  const [current, setCurrent] = useState(product);
  const [products, setProducts] = useState([]);
  const [state, setState] = useState(() => (typeof window !== "undefined" && localStorage.getItem(CONSENT_KEY) ? "camera" : "consent"));
  const [error, setError] = useState("");
  const [left, setLeft] = useState(SESSION_SECONDS);
  const [toast, setToast] = useState("");
  const [dropping, setDropping] = useState(false);
  const local = useRef(null), out = useRef(null), closeBtn = useRef(null);
  const session = useRef({ stream: null, rt: null, timer: null, run: 0 });
  const currentRef = useRef(product);
  currentRef.current = current;

  const toastTimer = useRef(null);
  const flash = (msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), 2600); };

  // Tear everything down: Decart session, camera, countdown.
  const stop = useCallback((why = "stopped") => {
    const s = session.current;
    s.run++; // invalidates any start() still in flight
    clearInterval(s.timer); s.timer = null;
    try { s.rt?.disconnect(); } catch {}
    s.rt = null;
    s.stream?.getTracks().forEach((t) => t.stop());
    s.stream = null;
    if (local.current) local.current.srcObject = null;
    if (out.current) out.current.srcObject = null;
    if (why !== "error") setState((st) => (st === "consent" ? st : "ended"));
    if (why !== "unmount") track("tryon_ended", { reason: why, product: currentRef.current?.id });
  }, []);

  const fail = useCallback((err) => {
    stop("error");
    setError(explain(err));
    setState("error");
    track("tryon_error", { message: String(err?.message || err), product: currentRef.current?.id });
  }, [stop]);

  const garmentBlob = async (p) => (await fetch(absolute(p.image))).blob(); // a Blob works locally and in production

  const start = useCallback(async () => {
    const s = session.current;
    stop("restart");
    const run = ++s.run;
    setError("");
    setLeft(SESSION_SECONDS);
    localStorage.setItem(CONSENT_KEY, "1");
    track("tryon_started", { product: currentRef.current?.id });
    try {
      setState("camera");
      const sdk = await import("@decartai/sdk"); // lazy: only downloaded when someone actually starts
      const model = sdk.models.realtime(MODEL);
      const fps = sdk.resolveFpsNumber ? sdk.resolveFpsNumber(model.fps) : model.fps;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: model.width }, height: { ideal: model.height }, frameRate: { ideal: fps } },
      });
      if (run !== s.run) return stream.getTracks().forEach((t) => t.stop());
      s.stream = stream;
      local.current.srcObject = stream;

      setState("connecting");
      // one token now (so a 429/403 shows a clear message), a fresh one for any automatic reconnect
      let first = await fetchToken();
      const image = await garmentBlob(currentRef.current);
      if (run !== s.run) return;
      const client = sdk.createDecartClient({ apiKeyProvider: async () => { if (first) { const k = first; first = null; return k; } return fetchToken(); } });
      const rt = await client.realtime.connect(stream, {
        model,
        mirror: "auto",
        initialState: { image },
        onRemoteStream: (edited) => { if (out.current) out.current.srcObject = edited; },
        onConnectionChange: (c) => {
          if (run !== s.run) return;
          if (c === "connected" || c === "generating") {
            setState((st) => { if (st !== "live") track("tryon_live", { product: currentRef.current?.id }); return "live"; });
            if (!s.timer) s.timer = setInterval(() => setLeft((l) => { if (l <= 1) { stop("time_limit"); return 0; } return l - 1; }), 1000);
          } else if (c === "connecting" || c === "reconnecting") setState("connecting");
          else if (c === "disconnected") stop("disconnected");
        },
      });
      if (run !== s.run) return rt.disconnect();
      s.rt = rt;
      rt.on("error", (e) => run === s.run && fail(e));
      rt.on("sessionEnded", (e) => run === s.run && (e?.reason === "session_limit" ? fail({ status: 429, message: "All fitting rooms are busy right now. Please try again in a minute." }) : stop(e?.reason || "ended")));
    } catch (e) {
      if (run === s.run) fail(e);
    }
  }, [stop, fail]);

  // Swap the outfit: live if a session is running, otherwise it's used on the next Start.
  const swap = useCallback(async (p) => {
    if (!p || p.id === currentRef.current?.id) return;
    setCurrent(p);
    track("tryon_swapped", { product: p.id });
    const rt = session.current.rt;
    if (rt) {
      try { await rt.setImage(await garmentBlob(p)); flash(`Now wearing ${p.name}`); } catch (e) { fail(e); }
    }
  }, [fail]);

  const snapshot = () => {
    const v = state === "live" && out.current?.videoWidth ? out.current : null;
    if (!v) return flash("Snapshots are available while you're live.");
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob((b) => {
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(b), download: `fit-your-fashion-${current.id || "look"}.png` });
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }, "image/png");
    track("tryon_snapshot", { product: current.id });
    flash("Snapshot saved to your downloads");
  };

  const addToCart = () => {
    onAddToCart?.(current);
    track("tryon_add_to_cart", { product: current.id });
    flash(`${current.name} added to your bag`);
  };

  // Open: products for the strip, focus, auto-start if they've consented before. Close: always stop.
  useEffect(() => {
    track("tryon_opened", { product: product.id });
    closeBtn.current?.focus();
    fetch(PRODUCTS_URL).then((r) => r.json()).then(setProducts).catch(() => setProducts([]));
    if (localStorage.getItem(CONSENT_KEY)) start();
    const onKey = (e) => e.key === "Escape" && onClose();
    const onHide = () => document.hidden && session.current.stream && stop("tab_hidden");
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onHide); stop("unmount"); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const live = state === "live";
  const running = ["camera", "connecting", "live"].includes(state);
  const strip = products.some((p) => p.id === current.id) || !current.id ? products : [current, ...products];

  return (
    <div className="fixed inset-0 z-[160] flex items-stretch justify-center bg-plum/85 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Live try-on: ${current.name}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex h-full w-full max-w-[1040px] flex-col overflow-hidden bg-plum-2 text-pearl shadow-[0_40px_120px_-30px_rgba(0,0,0,.7)] sm:h-auto sm:max-h-[94svh] sm:rounded-[28px]">
        {/* header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="label-sm text-lavender">Live try-on</p>
            <p className="display truncate text-[22px] leading-tight sm:text-[26px]">{current.name}</p>
          </div>
          <button ref={closeBtn} onClick={onClose} aria-label="Close try-on" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 transition hover:bg-white hover:text-plum">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {/* stage: portrait on phones, landscape on desktop */}
        <div
          className={`relative min-h-0 flex-1 bg-[#120c1f] sm:h-[min(56svh,600px)] sm:flex-none ${dropping ? "ring-2 ring-inset ring-lavender" : ""}`}
          onDragOver={(e) => { if (e.dataTransfer.types.includes("text/tryon-id")) { e.preventDefault(); setDropping(true); } }}
          onDragLeave={() => setDropping(false)}
          onDrop={(e) => { e.preventDefault(); setDropping(false); swap(strip.find((p) => p.id === e.dataTransfer.getData("text/tryon-id"))); }}
        >
          {/* your camera, mirrored, until the edited stream is live */}
          <video ref={local} autoPlay playsInline muted className={`absolute inset-0 h-full w-full -scale-x-100 object-cover transition-opacity duration-500 ${running && !live ? "opacity-60" : "opacity-0"}`} />
          <video ref={out} autoPlay playsInline muted className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${live ? "opacity-100" : "opacity-0"}`} />

          {/* status + countdown */}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
            <span role="status" className={`label-sm flex items-center gap-2 rounded-full px-3.5 py-2 ${live ? "bg-white text-plum" : "bg-white/12 text-pearl"}`}>
              <span className={`h-2 w-2 rounded-full ${live ? "bg-[#e5484d] motion-safe:animate-pulse" : state === "error" ? "bg-[#e5484d]" : running ? "bg-lavender motion-safe:animate-pulse" : "bg-white/50"}`} aria-hidden />
              {STATUS[state]}
            </span>
            {live && <span className={`label-sm rounded-full px-3.5 py-2 tabular-nums ${left <= 30 ? "bg-[#e5484d] text-white" : "bg-white/12"}`} aria-label={`${fmt(left)} left`}>{fmt(left)}</span>}
          </div>

          {/* overlays per state */}
          {state === "consent" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div className="max-w-[420px]">
                <p className="display text-[30px] leading-tight">See it on you, live.</p>
                <p className="mt-3 text-[14px] leading-relaxed text-mist/85">
                  Your camera video is processed live by our try-on partner, Decart, to show this piece on you. <strong className="text-pearl">Nothing is stored</strong> — an image is only saved if you tap Snapshot.
                </p>
                <button onClick={start} className="label mt-6 rounded-full bg-pearl px-7 py-4 text-plum transition-colors hover:bg-lavender">Allow camera &amp; start</button>
              </div>
            </div>
          )}
          {(state === "camera" || state === "connecting") && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="h-12 w-12 rounded-full border-2 border-white/25 border-t-pearl motion-safe:animate-spin" aria-hidden />
            </div>
          )}
          {state === "ended" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <p className="display text-[28px]">{left === 0 ? "Time's up for this session." : "Session ended."}</p>
                <p className="mt-2 text-[14px] text-mist/80">Your camera is off. Start again whenever you like.</p>
              </div>
            </div>
          )}
          {state === "error" && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <p className="max-w-[440px] text-[15px] leading-relaxed text-mist" role="alert">{error}</p>
            </div>
          )}
          {running && (
            <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[12px] text-white/85 drop-shadow sm:bottom-4">
              Tip: step back so your whole outfit is in frame, in good light.
            </p>
          )}
          {toast && <p className="label-sm absolute left-1/2 top-16 -translate-x-1/2 rounded-full bg-pearl px-4 py-2.5 text-plum" role="status">{toast}</p>}
        </div>

        {/* controls */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3 sm:px-6">
          {running ? (
            <button onClick={() => stop("user")} className="label-sm rounded-full border border-white/25 px-5 py-3 transition hover:bg-white hover:text-plum">Stop</button>
          ) : (
            <button onClick={start} className="label-sm rounded-full bg-pearl px-5 py-3 text-plum transition hover:bg-lavender">Start</button>
          )}
          <button onClick={snapshot} disabled={!live} className="label-sm rounded-full border border-white/25 px-5 py-3 transition hover:bg-white hover:text-plum disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-pearl">Snapshot</button>
          <button onClick={addToCart} className="label-sm ml-auto rounded-full bg-lavender px-5 py-3 text-plum transition hover:bg-pearl">Add to bag</button>
        </div>

        {/* other pieces: click or drag onto the video */}
        {strip.length > 0 && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-6">
            <p className="label-sm mb-2 text-mist/70">Try another piece — tap, or drag it onto the video</p>
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
