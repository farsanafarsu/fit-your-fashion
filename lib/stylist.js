import { PRODUCTS, byId, PAIRS } from "./catalog";

// Prototype stylist: runs on-device with simple intent parsing over the catalogue.
// In production, swap `styleRequest` for a call to an LLM-backed /api/stylist route that
// receives the same catalogue and returns the same { text, outfits } shape.

const OCCASIONS = [
  { re: /wedding|reception|sangeet|mehendi|engagement|ceremony|bride/i, mood: "bridal", label: "a wedding", formality: 3 },
  { re: /dinner|date|gala|party|cocktail|evening|night|opera/i, mood: "moonlit", label: "an evening out", formality: 2 },
  { re: /office|meeting|interview|work|pitch|presentation|conference/i, mood: "soft-power", label: "work", formality: 2 },
  { re: /weekend|brunch|travel|casual|coffee|holiday|vacation|airport/i, mood: "off-duty", label: "something off-duty", formality: 1 },
];

// General climate character only — no temperatures are claimed.
const CLIMATE = {
  kochi: { all: "warm", note: "Kochi stays warm and humid, even in winter — breathable silks and a sheer layer for air-conditioned halls." },
  mumbai: { all: "warm", note: "Mumbai is warm and humid most of the year — keep layers light." },
  chennai: { all: "warm", note: "Chennai runs hot — fluid silks over structure." },
  delhi: { dec: "cool", jan: "cool", nov: "mild", feb: "mild", default: "warm", note: "North Indian winters get properly cold after dark — plan a real outer layer." },
  bangalore: { all: "mild", note: "Bangalore is mild — a light layer for the evening is enough." },
  london: { all: "cool", note: "London calls for a structured outer layer most of the year." },
  dubai: { all: "warm", note: "Dubai is warm outdoors and cold indoors — a cape solves both." },
};
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const COLOURS = ["lavender", "lilac", "purple", "plum", "white", "pearl", "amethyst", "wisteria", "violet", "mauve"];

export function parseRequest(text) {
  const t = text.toLowerCase();
  const occ = OCCASIONS.find((o) => o.re.test(text)) ?? null;
  const placeKey = Object.keys(CLIMATE).find((k) => t.includes(k)) ?? null;
  const month = MONTHS.find((m) => new RegExp(`\\b${m}`, "i").test(t)) ?? null;
  let heightCm = null;
  const ft = t.match(/(\d)\s*(?:'|ft|foot|feet)\s*(\d{1,2})?/);
  const cm = t.match(/(\d{3})\s*cm/);
  if (ft) heightCm = Math.round(+ft[1] * 30.48 + (+ft[2] || 0) * 2.54);
  else if (cm) heightCm = +cm[1];
  const colours = COLOURS.filter((c) => t.includes(c));
  let climate = null;
  if (placeKey) {
    const c = CLIMATE[placeKey];
    climate = c.all ?? (month && c[month]) ?? c.default ?? "mild";
  }
  return { occ, placeKey, month, heightCm, colours, climate };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function rank(mood, climate, colours) {
  return [...PRODUCTS]
    .map((p) => {
      let s = 0;
      if (mood && p.moods.includes(mood)) s += 3;
      if (climate && p.season.includes(climate)) s += 1;
      if (colours.length && colours.some((c) => p.colourName.toLowerCase().includes(c) || (c === "lilac" || c === "purple" || c === "violet" || c === "mauve") && /lavender|wisteria|amethyst|mist/i.test(p.colourName))) s += 2;
      return { p, s };
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
}

function buildOutfits(ranked, climate) {
  const outfits = [];
  const used = new Set();
  for (const base of ranked) {
    if (outfits.length >= 3) break;
    if (used.has(base.id) || base.slot === "accessory" || base.slot === "outer") continue;
    const items = [base.id];
    if (base.slot === "top" || base.slot === "bottom") {
      const other = ranked.find((p) => p.slot === (base.slot === "top" ? "bottom" : "top"));
      if (other) items.push(other.id);
    }
    const outer = (PAIRS[base.id] ?? []).map(byId).find((p) => p.slot === "outer" && (climate !== "warm" || p.id === "halo-cape"));
    if (outer) items.push(outer.id);
    if (base.formality >= 2) items.push("pearl-collar");
    items.forEach((i) => used.add(i));
    outfits.push({ title: base.name.split(" ").slice(0, 1)[0] + " look", items: [...new Set(items)] });
  }
  return outfits;
}

export function styleRequest(text, profile = {}) {
  const q = parseRequest(text);
  const mood = q.occ?.mood ?? profile.topMood ?? null;
  const ranked = rank(mood, q.climate, q.colours);
  const outfits = buildOutfits(ranked, q.climate);

  const lines = [];
  const what = q.occ ? q.occ.label : "this";
  const where = q.placeKey ? ` in ${cap(q.placeKey)}` : "";
  const when = q.month ? ` in ${MONTH_NAMES[MONTHS.indexOf(q.month)]}` : "";
  lines.push(`For ${what}${where}${when}, here’s what I’d dress you in.`);
  if (q.placeKey) lines.push(CLIMATE[q.placeKey].note);
  if (q.heightCm && q.heightCm < 165) lines.push("At your height, an unbroken column of one colour and a defined waist lengthen the line — I’ve kept hems fluid and close to the floor.");
  else if (q.heightCm) lines.push("You can carry volume well — I’ve let the cape and pleats do the talking.");
  if (q.colours.length) lines.push(`Kept it in your ${q.colours.join(" and ")} family.`);
  if (!q.occ && !q.placeKey) lines.push("Tell me the occasion, place and month and I’ll refine this.");
  return { text: lines.join(" "), outfits, parsed: q };
}

export const STYLIST_EXAMPLE = "I have a wedding in Kochi in December, I'm 5'4, I love lavender";
