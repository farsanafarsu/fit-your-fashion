// FIT YOUR FASHION — catalogue.
// Everything marked PLACEHOLDER must be replaced with real brand data before launch:
// prices, size grading, media sources. Nothing here is a real stat or review.

export const MEDIA = {
  // PLACEHOLDER: set to real encoded files (e.g. /media/hero-16x9.mp4, /media/hero-9x16.mp4).
  // While null, the hero renders a generative silk film so the page never shows a broken player.
  heroFilm: { landscape: null, portrait: null, poster: null, captions: "/media/hero-captions.vtt" },
  campaignFilm: null,
};

export const SIZES = ["XS", "S", "M", "L", "XL"];

// PLACEHOLDER size chart (body measurements in cm each size is graded for).
export const SIZE_CHART = {
  XS: { bust: 80, waist: 62, hip: 88 },
  S: { bust: 84, waist: 66, hip: 92 },
  M: { bust: 88, waist: 70, hip: 96 },
  L: { bust: 94, waist: 76, hip: 102 },
  XL: { bust: 100, waist: 82, hip: 108 },
};

export const MOODS = [
  { id: "soft-power", name: "Soft Power", line: "Tailoring that speaks quietly and is heard.", tint: "#E9DFF5", deep: "#6E4FA8" },
  { id: "moonlit", name: "Moonlit Evening", line: "Silk that holds the last light of the day.", tint: "#2A1F44", deep: "#C9B6E4" },
  { id: "off-duty", name: "Off-Duty Muse", line: "Ease, worn like a secret.", tint: "#F3EEF9", deep: "#8C6FC4" },
  { id: "bridal", name: "Bridal Lavender", line: "Heirlooms for a new kind of ceremony.", tint: "#FAF8FD", deep: "#B9A3DB" },
];

// slot: which layer the piece occupies in the dressing room.
// cut: + runs large, − runs small (cm). fit: 'fitted' | 'relaxed' changes loose tolerance.
export const PRODUCTS = [
  { id: "aurora-gown", name: "Aurora Bias Gown", type: "gown", slot: "dress", colour: "#C9B6E4", colourName: "Lavender", fabric: "Silk charmeuse", moods: ["moonlit", "bridal"], cut: 0, fit: "fitted", season: ["warm", "mild"], formality: 3 },
  { id: "halo-cape", name: "Halo Organza Cape", type: "cape", slot: "outer", colour: "#E9DFF5", colourName: "Soft Lavender", fabric: "Silk organza", moods: ["bridal", "moonlit"], cut: 4, fit: "relaxed", season: ["warm", "mild", "cool"], formality: 3 },
  { id: "nocturne-blazer", name: "Nocturne Sculpted Blazer", type: "blazer", slot: "outer", colour: "#2A1F44", colourName: "Midnight Plum", fabric: "Wool grain de poudre", moods: ["soft-power", "moonlit"], cut: 2, fit: "fitted", season: ["mild", "cool"], formality: 2 },
  { id: "vesper-trouser", name: "Vesper Wide Trouser", type: "trousers", slot: "bottom", colour: "#6E4FA8", colourName: "Deep Amethyst", fabric: "Crepe de chine", moods: ["soft-power", "off-duty"], cut: 1, fit: "relaxed", season: ["warm", "mild", "cool"], formality: 2 },
  { id: "lune-slip", name: "Lune Slip Dress", type: "slip", slot: "dress", colour: "#B9A3DB", colourName: "Wisteria", fabric: "Sandwashed silk", moods: ["moonlit", "off-duty"], cut: -1, fit: "fitted", season: ["warm", "mild"], formality: 2 },
  { id: "mist-drape", name: "Mist Drape Saree Gown", type: "drape", slot: "dress", colour: "#D9CCEE", colourName: "Mist", fabric: "Chanderi & tulle", moods: ["bridal", "moonlit"], cut: 2, fit: "relaxed", season: ["warm", "mild"], formality: 3 },
  { id: "cloud-knit", name: "Cloud Knit Top", type: "top", slot: "top", colour: "#FAF8FD", colourName: "Pearl", fabric: "Cashmere-silk knit", moods: ["off-duty", "soft-power"], cut: 3, fit: "relaxed", season: ["mild", "cool"], formality: 1 },
  { id: "orbit-skirt", name: "Orbit Pleated Skirt", type: "skirt", slot: "bottom", colour: "#8C6FC4", colourName: "Amethyst", fabric: "Plissé georgette", moods: ["off-duty", "bridal"], cut: 2, fit: "relaxed", season: ["warm", "mild"], formality: 2 },
  { id: "pearl-collar", name: "Pearl Constellation Collar", type: "necklace", slot: "accessory", colour: "#F4EFFA", colourName: "Pearl", fabric: "Freshwater pearl, recycled silver", moods: ["bridal", "moonlit", "soft-power"], cut: 0, fit: "relaxed", season: ["warm", "mild", "cool"], formality: 3 },
];

export const byId = (id) => PRODUCTS.find((p) => p.id === id);

// PLACEHOLDER price display — no real prices exist yet.
export const formatPrice = () => "₹ XX,XXX";

// Pieces that pair well — used by Complete the Look and the stylist.
export const PAIRS = {
  "aurora-gown": ["halo-cape", "pearl-collar"],
  "halo-cape": ["aurora-gown", "mist-drape"],
  "nocturne-blazer": ["vesper-trouser", "cloud-knit", "lune-slip"],
  "vesper-trouser": ["cloud-knit", "nocturne-blazer"],
  "lune-slip": ["nocturne-blazer", "pearl-collar"],
  "mist-drape": ["halo-cape", "pearl-collar"],
  "cloud-knit": ["vesper-trouser", "orbit-skirt"],
  "orbit-skirt": ["cloud-knit", "nocturne-blazer"],
  "pearl-collar": ["aurora-gown", "lune-slip"],
};
