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
  { id: "noir-constellation-gown", name: "Noir Constellation Gown", type: "gown", slot: "dress", colour: "#1E1A22", colourName: "Onyx & Nude", fabric: "Hand-beaded tulle", moods: ["moonlit", "soft-power"], cut: 0, fit: "fitted", season: ["mild", "cool"], formality: 3 },
  { id: "rani-cape-drape", name: "Rani Cape Drape Set", type: "drape", slot: "dress", colour: "#B0284F", colourName: "Rani Pink", fabric: "Georgette, zardozi corset", moods: ["bridal", "moonlit"], cut: 1, fit: "relaxed", season: ["warm", "mild", "cool"], formality: 3 },
  { id: "marigold-drape-saree", name: "Marigold Pre-Draped Saree", type: "drape", slot: "dress", colour: "#D2561E", colourName: "Marigold", fabric: "Chiffon, beaded corset", moods: ["bridal", "off-duty"], cut: 1, fit: "relaxed", season: ["warm", "mild"], formality: 3 },
  { id: "garnet-beaded-saree", name: "Garnet Beaded Saree", type: "drape", slot: "dress", colour: "#7A1622", colourName: "Garnet", fabric: "Hand-beaded net", moods: ["bridal", "moonlit"], cut: 0, fit: "fitted", season: ["mild", "cool"], formality: 3 },
  { id: "hearth-corset-dress", name: "Hearth Corset Dress", type: "gown", slot: "dress", colour: "#9A4A2E", colourName: "Rust & Cream", fabric: "Linen, embroidered apron", moods: ["off-duty"], cut: 2, fit: "relaxed", season: ["mild", "cool"], formality: 1 },
  { id: "rosebriar-prairie-dress", name: "Rosebriar Prairie Dress", type: "gown", slot: "dress", colour: "#F1E6D2", colourName: "Ivory Rose", fabric: "Satin, floral brocade corset", moods: ["off-duty", "bridal"], cut: 2, fit: "relaxed", season: ["warm", "mild"], formality: 2 },
];

// PLACEHOLDER photography: stock and owner-supplied reference photos (see public/products/CREDITS.md) until the product shoot.
// focus: where the second-angle detail crop zooms in.
const PHOTOS = {
  "aurora-gown": { src: "/products/aurora-gown.webp", focus: "50% 45%" },
  "halo-cape": { src: "/products/halo-cape.webp", focus: "45% 35%" },
  "nocturne-blazer": { src: "/products/nocturne-blazer.webp", focus: "45% 45%" },
  "vesper-trouser": { src: "/products/vesper-trouser.webp", focus: "50% 70%" },
  "lune-slip": { src: "/products/lune-slip.webp", focus: "50% 45%" },
  "mist-drape": { src: "/products/mist-drape.webp", focus: "50% 65%" },
  "cloud-knit": { src: "/products/cloud-knit.webp", focus: "50% 75%" },
  "orbit-skirt": { src: "/products/orbit-skirt.webp", focus: "50% 75%" },
  "pearl-collar": { src: "/products/pearl-collar.webp", focus: "45% 50%" },
  "noir-constellation-gown": { src: "/products/noir-constellation-gown.webp", focus: "50% 35%" },
  "rani-cape-drape": { src: "/products/rani-cape-drape.webp", focus: "50% 25%" },
  "marigold-drape-saree": { src: "/products/marigold-drape-saree.webp", focus: "50% 25%" },
  "garnet-beaded-saree": { src: "/products/garnet-beaded-saree.webp", focus: "45% 40%" },
  "hearth-corset-dress": { src: "/products/hearth-corset-dress.webp", focus: "50% 35%" },
  "rosebriar-prairie-dress": { src: "/products/rosebriar-prairie-dress.webp", focus: "50% 35%" },
};
PRODUCTS.forEach((p) => (p.photo = PHOTOS[p.id]));

export const byId = (id) => PRODUCTS.find((p) => p.id === id);

// Shop departments, matched on garment type (Bridal is a mood, so it cuts across types).
// image/line feed the "Shop by category" tiles; PLACEHOLDER imagery as elsewhere.
export const CATEGORIES = [
  { id: "all", name: "All", match: () => true },
  { id: "dresses", name: "Gowns & Dresses", line: "Bias cuts, slips and shimmer for after dark.", image: "/products/aurora-gown.webp", match: (p) => ["gown", "slip"].includes(p.type) },
  { id: "sarees", name: "Sarees & Drapes", line: "Chanderi, silk and heirloom colour.", image: "/products/mist-drape.webp", match: (p) => p.type === "drape" },
  { id: "tailoring", name: "Tailoring", line: "Blazers and wide trousers with a sculpted line.", image: "/products/nocturne-blazer.webp", match: (p) => ["blazer", "trousers"].includes(p.type) },
  { id: "separates", name: "Separates & Knits", line: "Pleats and knits, easy to mix.", image: "/products/orbit-skirt.webp", match: (p) => ["top", "skirt"].includes(p.type) },
  { id: "capes", name: "Capes & Layers", line: "Sheer organza to float over anything.", image: "/products/halo-cape.webp", match: (p) => p.type === "cape" },
  { id: "bridal", name: "Bridal", line: "Ceremony pieces for the bride and her circle.", image: "/editorial/bridal-runway.webp", match: (p) => p.moods.includes("bridal") },
  { id: "jewellery", name: "Jewellery", line: "Pearls and recycled silver to finish.", image: "/products/pearl-collar.webp", match: (p) => p.slot === "accessory" },
];

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
  "noir-constellation-gown": ["halo-cape", "pearl-collar"],
  "rani-cape-drape": ["pearl-collar", "garnet-beaded-saree"],
  "marigold-drape-saree": ["pearl-collar", "rani-cape-drape"],
  "garnet-beaded-saree": ["pearl-collar", "halo-cape"],
  "hearth-corset-dress": ["cloud-knit", "rosebriar-prairie-dress"],
  "rosebriar-prairie-dress": ["halo-cape", "pearl-collar"],
};
