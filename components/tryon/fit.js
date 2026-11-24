// Pure maths for the instant try-on: where to draw a garment cutout on a person.
// Keypoints are named by the person's own left/right: ls, rs (shoulders), lh, rh (hips), lk, rk (knees).
// Garment keypoints come from public/tryon/garments/meta.json (fractions of the image size, plus confidence).

const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (v) => Math.hypot(v[0], v[1]);

// Affine transform [a, b, c, d, e, f] (canvas setTransform order) taking 3 source points to 3 target points.
export function affine3(src, dst) {
  const [[x1, y1], [x2, y2], [x3, y3]] = src;
  const det = x1 * (y2 - y3) - x2 * (y1 - y3) + x3 * (y1 - y2);
  if (Math.abs(det) < 1e-6) return null;
  const solve = (u1, u2, u3) => [
    (u1 * (y2 - y3) - u2 * (y1 - y3) + u3 * (y1 - y2)) / det,
    (x1 * (u2 - u3) - x2 * (u1 - u3) + x3 * (u1 - u2)) / det,
    (x1 * (y2 * u3 - y3 * u2) - x2 * (y1 * u3 - y3 * u1) + x3 * (y1 * u2 - y2 * u1)) / det,
  ];
  const [a, c, e] = solve(dst[0][0], dst[1][0], dst[2][0]);
  const [b, d, f] = solve(dst[0][1], dst[1][1], dst[2][1]);
  return [a, b, c, d, e, f];
}

// A third point at 90° to the pair (p, q), `k` times their distance away, toward "down" for a person.
function perp(p, q, k) {
  const m = mid(p, q), v = sub(q, p);
  // person-left is on image right, so (p=left, q=right) runs right→left; turning that by −90° points down
  return [m[0] + v[1] * k, m[1] - v[0] * k];
}

const ok = (pt, min = 0.5) => pt && (pt[2] ?? 1) >= min;

// garment: { w, h, kp }, person: { kp } in pixels of the target canvas. Returns a transform or null.
export function fitGarment(garment, person, category) {
  const g = Object.fromEntries(Object.entries(garment.kp).map(([k, v]) => [k, [v[0] * garment.w, v[1] * garment.h, v[2]]]));
  const p = person.kp;
  if (category === "bottoms") {
    if (!ok(g.lh) || !ok(g.rh) || !ok(p.lh) || !ok(p.rh)) return null;
    // the hips fix position, width and tilt; leg length follows hip width (knees are often out of frame)
    const k = 1.6;
    return affine3([g.lh, g.rh, perp(g.lh, g.rh, k)], [p.lh, p.rh, perp(p.lh, p.rh, k)]);
  }
  if (!ok(g.ls) || !ok(g.rs) || !ok(p.ls) || !ok(p.rs)) return null;
  const gHip = ok(g.lh) && ok(g.rh) ? mid(g.lh, g.rh) : null;
  const pHip = ok(p.lh, 0.4) && ok(p.rh, 0.4) ? mid(p.lh, p.rh) : null;
  if (gHip && pHip) {
    // stop a hip guess from shearing the garment sideways more than a lean would
    const torso = len(sub(pHip, mid(p.ls, p.rs))) / len(sub(p.ls, p.rs));
    if (torso > 0.8 && torso < 3.5) return affine3([g.ls, g.rs, gHip], [p.ls, p.rs, pHip]);
  }
  // hips out of frame: keep the garment's own shoulder-to-hip proportion
  const k = gHip ? len(sub(gHip, mid(g.ls, g.rs))) / len(sub(g.ls, g.rs)) : 1.5;
  return affine3([g.ls, g.rs, perp(g.ls, g.rs, k)], [p.ls, p.rs, perp(p.ls, p.rs, k)]);
}

// Exponential smoothing so the garment doesn't jitter. `prev` and `next` are { kp }.
export function smooth(prev, next, t = 0.45) {
  if (!prev) return next;
  const kp = {};
  for (const [k, v] of Object.entries(next.kp)) {
    const o = prev.kp[k];
    kp[k] = o ? [o[0] + (v[0] - o[0]) * t, o[1] + (v[1] - o[1]) * t, v[2]] : v;
  }
  return { kp };
}

// MediaPipe Pose landmark indices → our names (MediaPipe uses the person's own left/right).
export const MP = { ls: 11, rs: 12, lh: 23, rh: 24, lk: 25, rk: 26 };
export function fromMediaPipe(landmarks, w, h) {
  const kp = {};
  for (const [k, i] of Object.entries(MP)) {
    const l = landmarks[i];
    if (l) kp[k] = [l.x * w, l.y * h, l.visibility ?? 1];
  }
  return { kp };
}
