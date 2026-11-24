// Instant try-on engine: camera → MediaPipe Pose (in the browser) → garment cutout warped onto the body.
// Runs entirely on the shopper's device: free, unlimited, no queue, and the video never leaves the phone.
import { fitGarment, fromMediaPipe, smooth } from "./fit";

// MediaPipe's engine (~15 MB, cached by the browser after the first visit) and its pose model.
const MP_VERSION = "1.2.3";
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let landmarkerPromise = null;
function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const files = await FilesetResolver.forVisionTasks(WASM);
      const opts = (delegate) => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
      try { return await PoseLandmarker.createFromOptions(files, opts("GPU")); }
      catch { return await PoseLandmarker.createFromOptions(files, opts("CPU")); } // older phones without WebGL2
    })();
    landmarkerPromise.catch(() => { landmarkerPromise = null; });
  }
  return landmarkerPromise;
}

const images = new Map();
function loadImage(src) {
  if (!images.has(src)) {
    images.set(src, new Promise((res, rej) => {
      const i = new Image();
      i.decoding = "async";
      i.onload = () => res(i);
      i.onerror = () => { images.delete(src); rej(new Error("garment image")); };
      i.src = src;
    }));
  }
  return images.get(src);
}

// start({ video, canvas, onStatus }) → controller. onStatus("tracking" | "no-person") lets the UI give hints.
export async function startLive({ video, canvas, onStatus }) {
  const landmarker = await getLandmarker();
  const ctx = canvas.getContext("2d");
  let garment = null, img = null, category = "one-pieces", opacity = 0.96;
  let raf = 0, last = -1, pose = null, lost = 0, status = "", stopped = false;

  const setStatus = (s) => { if (s !== status) { status = s; onStatus?.(s); } };

  const frame = () => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || video.readyState < 2 || video.currentTime === last) return;
    last = video.currentTime;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }

    const res = landmarker.detectForVideo(video, performance.now());
    const lm = res.landmarks?.[0];
    if (lm) { pose = smooth(pose, fromMediaPipe(lm, w, h)); lost = 0; setStatus("tracking"); }
    else if (++lost > 8) { pose = null; setStatus("no-person"); }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(video, 0, 0, w, h);
    if (pose && garment && img) {
      const t = fitGarment(garment, pose, category);
      if (t) {
        ctx.globalAlpha = opacity;
        ctx.setTransform(...t);
        ctx.drawImage(img, 0, 0, garment.w, garment.h);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
      }
    }
  };
  raf = requestAnimationFrame(frame);

  return {
    // meta: entry from garments/meta.json; src: its cutout image URL
    async setGarment(meta, src, cat) {
      const next = await loadImage(src);
      garment = meta; img = next; category = cat;
    },
    clearGarment() { garment = null; img = null; },
    setOpacity(o) { opacity = o; },
    // Mirror-image PNG of the canvas, as the shopper saw it.
    snapshot() {
      const c = Object.assign(document.createElement("canvas"), { width: canvas.width, height: canvas.height });
      const x = c.getContext("2d");
      x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(canvas, 0, 0);
      return new Promise((r) => c.toBlob(r, "image/png"));
    },
    // The plain camera frame (no garment), for the HD AI try-on.
    frame() {
      const c = Object.assign(document.createElement("canvas"), { width: video.videoWidth, height: video.videoHeight });
      const x = c.getContext("2d");
      x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(video, 0, 0);
      return c;
    },
    stop() { stopped = true; cancelAnimationFrame(raf); },
  };
}

// Preload the engine while the shopper reads the consent screen.
export const warmUp = () => getLandmarker().catch(() => {});
