"use client";
import { useEffect, useRef, useState } from "react";
import { byId } from "@/lib/catalog";
import { SHAPES } from "../ui/GarmentArt";

// AR try-on through the webcam. The camera stream stays on-device and stops when closed.
// Prototype overlays the garments at a guided position; production plugs a pose-tracking
// model (e.g. MediaPipe Pose) in where `anchor` is computed.
export default function LiveMirror({ outfit, onClose }) {
  const video = useRef(null);
  const [err, setErr] = useState(null);
  const [scale, setScale] = useState(1);
  const [y, setY] = useState(0);

  useEffect(() => {
    let stream;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        stream = s;
        video.current.srcObject = s;
      })
      .catch(() => setErr("Camera unavailable or permission declined. Live Mirror needs your camera; nothing is recorded."));
    if (!navigator.mediaDevices) setErr("This browser does not support camera access.");
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const layers = outfit.map(byId).sort((a, b) => ["dress", "bottom", "top", "outer", "accessory"].indexOf(a.slot) - ["dress", "bottom", "top", "outer", "accessory"].indexOf(b.slot));
  return (
    <div className="fixed inset-0 z-[180] bg-plum text-pearl" role="dialog" aria-modal="true" aria-label="Live Mirror">
      <video ref={video} autoPlay playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
      {err && <p className="absolute inset-x-6 top-1/2 mx-auto max-w-md -translate-y-1/2 text-center text-[15px]">{err}</p>}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative h-[70vh] w-[52.5vh]" style={{ transform: `translateY(${y}vh) scale(${scale})` }}>
          {layers.map((p) => (
            <svg key={p.id} viewBox="0 0 300 400" className="absolute inset-0 h-full w-full drop-shadow-[0_10px_30px_rgba(30,21,48,.4)]" aria-hidden>
              <path d={SHAPES[p.type]} fill={p.type === "necklace" ? "none" : p.colour} stroke={p.type === "necklace" ? p.colour : "none"} strokeWidth="10" opacity={p.type === "cape" ? 0.55 : 0.92} />
            </svg>
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
        <span className="label-sm rounded-full bg-white/15 px-4 py-2 backdrop-blur">Live Mirror · prototype</span>
        <button onClick={onClose} className="label-sm rounded-full bg-pearl px-5 py-3 text-plum" autoFocus>Close mirror</button>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-6 bg-gradient-to-t from-plum/80 p-6 text-[12px]">
        <label className="flex items-center gap-3">Size in frame <input type="range" min="0.6" max="1.4" step="0.01" value={scale} onChange={(e) => setScale(+e.target.value)} /></label>
        <label className="flex items-center gap-3">Height <input type="range" min="-20" max="20" step="0.5" value={y} onChange={(e) => setY(+e.target.value)} /></label>
        <span className="opacity-70">Stand back so your shoulders meet the neckline. The stream never leaves your device.</span>
      </div>
    </div>
  );
}
