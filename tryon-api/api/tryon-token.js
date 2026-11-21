// POST /api/tryon-token → { apiKey, expiresAt }
// Mints a short-lived Decart client token for the browser. The permanent key (DECART_API_KEY) stays here.
// Guards, in order: origin allow-list, per-IP rate limit, daily cap on tokens, then the token itself is
// scoped to the try-on model and the caller's origin, expires in 60 s and caps a session at 3 minutes.
import { createDecartClient } from "@decartai/sdk";

const env = (k, d) => (process.env[k] ?? "").trim() || d;
const ALLOWED_ORIGINS = env("ALLOWED_ORIGINS", "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
const PER_IP = Number(env("RATE_LIMIT_PER_IP", "5")); // tokens per IP per window
const WINDOW_S = Number(env("RATE_LIMIT_WINDOW_SECONDS", "600"));
const DAILY_CAP = Number(env("DAILY_TOKEN_CAP", "100")); // tokens per UTC day, all visitors
const SESSION_S = Number(env("MAX_SESSION_SECONDS", "180"));
const MODELS = ["lucy-vton-latest", "lucy-vton-3.6"]; // the alias the site uses, and what it resolves to today

// ── counters: Upstash Redis when configured (survives cold starts, shared by all instances), else memory
const UPSTASH_URL = env("UPSTASH_REDIS_REST_URL", ""), UPSTASH_TOKEN = env("UPSTASH_REDIS_REST_TOKEN", "");
const mem = new Map();
async function hit(key, ttl) {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const r = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", key], ["EXPIRE", key, String(ttl), "NX"]]),
    });
    if (!r.ok) throw new Error(`Upstash ${r.status}`);
    return Number((await r.json())[0].result);
  }
  const now = Date.now(), e = mem.get(key);
  if (!e || e.until < now) { mem.set(key, { n: 1, until: now + ttl * 1000 }); return 1; }
  return ++e.n;
}

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

export default async function handler(req, res) {
  const origin = (req.headers.origin || "").replace(/\/$/, "");
  const allowed = ALLOWED_ORIGINS.includes(origin);
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
  }
  res.setHeader("Vary", "Origin");
  if (req.method === "OPTIONS") return json(res, allowed ? 204 : 403, {});
  if (req.method !== "POST") return json(res, 405, { message: "Use POST." });
  if (!ALLOWED_ORIGINS.length) return json(res, 500, { message: "Try-on isn't configured (ALLOWED_ORIGINS)." });
  if (!allowed) return json(res, 403, { message: "Not allowed from this site." });

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  try {
    const bucket = Math.floor(Date.now() / 1000 / WINDOW_S);
    if ((await hit(`tryon:ip:${ip}:${bucket}`, WINDOW_S)) > PER_IP) return json(res, 429, { message: "You've started a lot of sessions. Please wait a few minutes and try again." });
    const day = new Date().toISOString().slice(0, 10);
    if ((await hit(`tryon:day:${day}`, 26 * 3600)) > DAILY_CAP) return json(res, 429, { message: "Live try-on is fully booked for today. Please come back tomorrow." });
  } catch (e) {
    console.error("[tryon-token] rate limit store failed:", e.message);
    return json(res, 503, { message: "Try-on is unavailable right now." }); // fail closed: never mint unmetered
  }

  const key = env("DECART_API_KEY", "");
  if (!key) return json(res, 500, { message: "Try-on isn't configured (missing key)." });
  try {
    const client = createDecartClient({ apiKey: key });
    const token = await client.tokens.create({
      expiresIn: 60, // only needs to outlive the connect; an open session keeps running after expiry
      allowedModels: MODELS,
      allowedOrigins: [origin],
      constraints: { realtime: { maxSessionDuration: SESSION_S } },
    });
    return json(res, 200, { apiKey: token.apiKey, expiresAt: token.expiresAt });
  } catch (e) {
    console.error("[tryon-token] Decart token failed:", e?.message || e);
    return json(res, 502, { message: "Couldn't reach the try-on service. Please try again." });
  }
}
