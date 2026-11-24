// ─── Try-on settings ─────────────────────────────────────────────────────────
// Two modes: INSTANT (live camera, runs in the shopper's browser: free, unlimited, no queue)
// and HD (a realistic AI picture from a Hugging Face Space: slower, may queue).
// The one switch: false hides every "Try it on" button and never loads the try-on code.
export const TRYON_ENABLED = true;

// The Hugging Face Space that makes the try-on picture (FASHN VTON v1.5, Apache-2.0).
// Default: the official public Space, free to call. Each visitor uses their own small daily GPU allowance there.
// Your own Space (hf-space/ folder): set NEXT_PUBLIC_TRYON_SPACE=your-username/your-space at build time.
export const SPACE = process.env.NEXT_PUBLIC_TRYON_SPACE || "fashn-ai/fashn-vton-1.5";
export const ENDPOINT = "/try_on";

// Quality vs speed: 20 fast, 30 balanced, 50 best. Fewer steps = more try-ons per visitor's daily GPU allowance.
export const TIMESTEPS = 30;
export const GUIDANCE = 1.5;
export const PHOTO_MAX_SIDE = 1024; // the person photo is shrunk to this before upload

// Products for the strip under the picture. Edit public/tryon/products.json
// ("category": "tops" | "bottoms" | "one-pieces").
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const PRODUCTS_URL = `${BASE}/tryon/products.json`;
// Instant try-on cutouts (one transparent .webp per product id) and their body anchors, made by
// scripts/make-garments.py. A product without a cutout offers only the HD AI try-on.
export const GARMENTS_URL = `${BASE}/tryon/garments`;
// Site-relative paths like /products/x.webp need the GitHub Pages prefix; full URLs pass through.
export const assetUrl = (src) => (src?.startsWith("/") && !src.startsWith("//") ? `${BASE}${src}` : src);

// The model needs to know which part of the outfit to replace. Used when a product has no "category".
export function guessCategory(name = "") {
  const n = name.toLowerCase();
  if (/trouser|pant|jean|skirt|short|legging|palazzo/.test(n)) return "bottoms";
  if (/top|shirt|blouse|blazer|jacket|coat|cape|knit|sweater|tee|kurta|cardigan/.test(n)) return "tops";
  return "one-pieces"; // dresses, gowns, sarees, jumpsuits, sets
}

// ─── Analytics: every try-on event goes through here ─────────────────────────
// Events: tryon_opened, tryon_live, tryon_snapshot, tryon_photo_added, tryon_started, tryon_done, tryon_swapped,
// tryon_download, tryon_add_to_cart, tryon_error. Point it at Google Analytics or Meta Pixel when you're ready, e.g.
//   window.gtag?.("event", name, data);
//   window.fbq?.("trackCustom", name, data);
export function track(name, data = {}) {
  if (process.env.NODE_ENV !== "production") console.info("[tryon]", name, data);
}
