// ─── Live try-on settings ────────────────────────────────────────────────────
// The one switch: false hides every "Try it on" button and never loads the camera or Decart's SDK.
const TRYON_SWITCH = true;

// Where the browser asks for a short-lived Decart client token. Your API key lives only on that
// server (see tryon-api/). Set NEXT_PUBLIC_TRYON_TOKEN_URL at build time, e.g.
// https://fit-your-fashion-tryon.vercel.app/api/tryon-token
export const TOKEN_URL = process.env.NEXT_PUBLIC_TRYON_TOKEN_URL || "";

// Buttons only appear once a token service is configured, so the live site never shows a try-on
// that can only fail.
export const TRYON_ENABLED = TRYON_SWITCH && Boolean(TOKEN_URL);

export const MODEL = "lucy-vton-latest"; // Decart's realtime virtual try-on model (docs + SDK 0.2.14)
export const SESSION_SECONDS = 180; // 3 minutes; the token service also enforces this on Decart's side

// Products for the strip under the video. Edit public/tryon/products.json.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const PRODUCTS_URL = `${BASE}/tryon/products.json`;
// Site-relative paths like /products/x.webp need the GitHub Pages prefix; full URLs pass through.
export const assetUrl = (src) => (src?.startsWith("/") && !src.startsWith("//") ? `${BASE}${src}` : src);

// ─── Analytics: every try-on event goes through here ─────────────────────────
// Events: tryon_opened, tryon_started, tryon_live, tryon_swapped, tryon_snapshot, tryon_add_to_cart,
// tryon_ended, tryon_error. Point it at Google Analytics or Meta Pixel when you're ready, e.g.
//   window.gtag?.("event", name, data);
//   window.fbq?.("trackCustom", name, data);
export function track(name, data = {}) {
  if (process.env.NODE_ENV !== "production") console.info("[tryon]", name, data);
}
