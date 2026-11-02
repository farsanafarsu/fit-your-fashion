// Kept separate from AvatarScene so pages can show the legend without loading three.js.
export const HEAT = { tight: "#F06A8A", perfect: "#8FD6BE", loose: "#7FB2F0" };

export default function HeatLegend({ dark = false }) {
  return (
    <div className={`flex gap-3 rounded-full px-4 py-2 text-[11px] backdrop-blur-md ${dark ? "bg-white/10 text-pearl" : "bg-white/80 text-plum"}`} aria-label="Fit heatmap legend">
      {Object.entries(HEAT).map(([k, c]) => (
        <span key={k} className="flex items-center gap-1.5 capitalize">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} /> {k}
        </span>
      ))}
    </div>
  );
}
