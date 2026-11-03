// Product image. With a catalogue photo it shows the look on a model (angle 1 = a detail crop of it);
// otherwise it falls back to a ghost-mannequin silhouette of the garment, lit like a studio shot.
import Image from "next/image";
import { useId } from "react";

export const SHAPES = {
  gown: "M122 58 Q150 70 178 58 L188 122 Q174 152 181 182 Q228 300 262 386 L38 386 Q72 300 119 182 Q126 152 112 122 Z",
  slip: "M126 64 L174 64 L186 132 Q200 250 212 346 L88 346 Q100 250 114 132 Z",
  blazer: "M100 62 L132 50 L150 128 L168 50 L200 62 L240 92 L252 266 L226 270 L214 146 L212 306 L88 306 L86 146 L74 270 L48 266 L60 92 Z",
  trousers: "M104 52 L196 52 L218 384 L166 384 L150 146 L134 384 L82 384 Z",
  cape: "M150 40 Q182 40 192 62 Q272 222 282 362 Q150 384 18 362 Q28 222 108 62 Q118 40 150 40 Z",
  drape: "M118 52 L180 52 L190 122 L232 62 L252 82 L200 204 Q216 300 232 384 L68 384 Q84 282 108 132 Z",
  top: "M108 72 L192 72 L242 112 L226 144 L202 128 L202 254 L98 254 L98 128 L74 144 L58 112 Z",
  skirt: "M114 72 L186 72 Q240 252 266 364 L34 364 Q60 252 114 72 Z",
  necklace: "M90 120 Q150 230 210 120",
};

export default function GarmentArt({ product, angle = 0, className = "", bg = "light", tag = true, sizes = "(max-width: 768px) 70vw, 28vw" }) {
  const uid = useId().replace(/:/g, "");
  if (product.photo) {
    const { src, focus } = product.photo;
    return (
      // callers that pin it with `absolute inset-0` must not also get `relative`, or the box collapses
      <div className={`overflow-hidden bg-mist ${/\babsolute\b/.test(className) ? "" : "relative"} ${className}`}>
        <Image
          src={src}
          alt={`${product.name} in ${product.colourName}${angle ? ", detail" : ""}`}
          fill
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition: focus, transformOrigin: focus, transform: angle ? "scale(1.45)" : undefined }}
        />
        {tag && <span className="label-sm absolute bottom-3 left-3 rounded-full bg-white/70 px-2 py-1 text-[10px] text-plum/60 backdrop-blur">Stock placeholder{angle ? " · detail" : ""}</span>}
      </div>
    );
  }
  const d = SHAPES[product.type];
  const backdrop = bg === "dark" ? ["#2A1F44", "#1E1530"] : angle ? ["#F3EEF9", "#E2D6F1"] : ["#FFFFFF", "#ECE4F6"];
  const isLine = product.type === "necklace";
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <svg viewBox="0 0 300 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${product.name} in ${product.colourName} — placeholder image${angle ? ", second angle" : ""}`}>
        <defs>
          <radialGradient id={`bg${uid}`} cx="50%" cy={angle ? "70%" : "35%"} r="80%">
            <stop offset="0" stopColor={backdrop[0]} />
            <stop offset="1" stopColor={backdrop[1]} />
          </radialGradient>
          <linearGradient id={`sheen${uid}`} x1={angle ? "1" : "0"} y1="0" x2={angle ? "0" : "1"} y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".55" />
            <stop offset=".35" stopColor="#fff" stopOpacity="0" />
            <stop offset=".7" stopColor="#1E1530" stopOpacity=".18" />
            <stop offset="1" stopColor="#fff" stopOpacity=".25" />
          </linearGradient>
          <filter id={`soft${uid}`}><feGaussianBlur stdDeviation="10" /></filter>
        </defs>
        <rect width="300" height="400" fill={`url(#bg${uid})`} />
        <ellipse cx="150" cy="392" rx="120" ry="10" fill="#1E1530" opacity=".12" filter={`url(#soft${uid})`} />
        <g transform={angle ? "translate(300 0) scale(-1 1) rotate(-3 150 200)" : "rotate(1.5 150 200)"}>
          {isLine ? (
            <g fill="none" stroke={product.colour} strokeLinecap="round">
              <path d={d} strokeWidth="3" stroke="#d8cde8" />
              {Array.from({ length: 13 }).map((_, i) => {
                const t = i / 12;
                const x = 90 + 120 * t;
                const y = 120 + 2 * t * (1 - t) * 110; // follows the quadratic curve above
                return <circle key={i} cx={x} cy={y + 2} r={i % 3 === 0 ? 8 : 5.5} fill={product.colour} stroke="#cfc3e3" strokeWidth="1" />;
              })}
            </g>
          ) : (
            <>
              <path d={d} fill={product.colour} />
              <path d={d} fill={`url(#sheen${uid})`} />
              <path d={d} fill="none" stroke="#1E1530" strokeOpacity=".12" />
            </>
          )}
        </g>
      </svg>
      {tag && <span className="label-sm absolute bottom-3 left-3 rounded-full bg-white/60 px-2 py-1 text-[10px] text-plum/60 backdrop-blur">Photo placeholder{angle ? " · angle 2" : ""}</span>}
    </div>
  );
}
