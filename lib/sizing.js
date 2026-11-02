import { SIZES, SIZE_CHART } from "./catalog";

const ZONES = { top: ["bust", "waist"], outer: ["bust", "waist"], bottom: ["waist", "hip"], dress: ["bust", "waist", "hip"], accessory: [] };

export const zonesFor = (product) => ZONES[product.slot] ?? [];

// Positive bias = the customer tends to return things for being too tight → nudge up a size.
const BIAS_CM = { none: 0, tight: 1.5, loose: -1.5 };

// Deviation (cm) of garment from the body in one zone: < 0 tight, > 0 loose.
export function deviation(product, size, body, zone) {
  return SIZE_CHART[size][zone] + product.cut - body[zone];
}

export function zoneFit(product, dev) {
  const looseAt = product.fit === "relaxed" ? 8 : 4;
  if (dev < -2) return "tight";
  if (dev > looseAt) return "loose";
  return "perfect";
}

export function fitMap(product, size, body) {
  return Object.fromEntries(
    zonesFor(product).map((z) => {
      const dev = deviation(product, size, body, z);
      return [z, { dev, fit: zoneFit(product, dev) }];
    })
  );
}

function score(product, size, body, bias) {
  const looseAt = product.fit === "relaxed" ? 8 : 4;
  return zonesFor(product).reduce((s, z) => {
    const dev = deviation(product, size, body, z) - bias;
    if (dev < -2) return s + (-2 - dev) * 2; // tightness hurts more than looseness
    if (dev > looseAt) return s + (dev - looseAt);
    return s;
  }, 0);
}

// Returns { size, confidence: 0–1, level, reason }.
export function predictSize(product, body, returnHistory = "none") {
  if (!zonesFor(product).length) return { size: "One size", confidence: 1, level: "High", reason: "One size, adjustable fit." };
  const bias = BIAS_CM[returnHistory] ?? 0;
  const ranked = SIZES.map((s) => ({ s, v: score(product, s, body, bias) })).sort((a, b) => a.v - b.v);
  const [best, second] = ranked;
  let c = 0.96 - best.v * 0.07;
  if (second.v - best.v < 1) c -= 0.14; // two sizes nearly tie
  if (returnHistory !== "none") c -= 0.04;
  c = Math.max(0.35, Math.min(0.97, c));
  const level = c > 0.8 ? "High" : c > 0.6 ? "Medium" : "Low";
  const map = fitMap(product, best.s, body);
  const off = Object.entries(map).filter(([, v]) => v.fit !== "perfect");
  const reason = off.length
    ? `Best overall; expect it ${off.map(([z, v]) => `${v.fit} at the ${z}`).join(", ")}.`
    : `Sits within ideal ease at ${Object.keys(map).join(", ")}.`;
  return { size: best.s, confidence: c, level, reason, alt: second.s };
}

export const DEFAULT_BODY = { height: 165, bust: 88, waist: 70, hip: 96, skin: "#C99A7A" };

// Rough starting point from height only — used before the user refines measurements.
export function bodyFromHeight(height) {
  const k = height / 165;
  return { height, bust: Math.round(88 * k), waist: Math.round(70 * k), hip: Math.round(96 * k) };
}
