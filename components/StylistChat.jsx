"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { byId, formatPrice } from "@/lib/catalog";
import { styleRequest, STYLIST_EXAMPLE } from "@/lib/stylist";
import { useApp } from "@/lib/store";
import { Spark } from "./ui/primitives";
import GarmentArt from "./ui/GarmentArt";

const SUGGESTIONS = [STYLIST_EXAMPLE, "Dinner date in London in January", "Something off-duty for a weekend in Bangalore", "A pitch meeting, I want to look powerful"];

function Outfit({ outfit, dark }) {
  const { addToBag } = useApp();
  const href = `/dressing-room?look=${outfit.items.join(",")}`;
  return (
    <div className={`rounded-2xl border p-3 ${dark ? "border-white/10 bg-white/5" : "border-plum/10 bg-white/70"}`}>
      <div className="flex gap-2">
        {outfit.items.map((id) => (
          <div key={id} className="w-1/3 min-w-0">
            <GarmentArt product={byId(id)} className="aspect-[3/4] rounded-lg" tag={false} />
            <p className="mt-1.5 truncate text-[11px]">{byId(id).name}</p>
            <p className="text-[10px] opacity-60">{formatPrice()}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Link href={href} className="label-sm flex-1 rounded-full bg-plum py-3 text-center text-pearl hover:bg-amethyst" data-cursor="Try on">
          Try it on
        </Link>
        <button onClick={() => outfit.items.forEach((id) => addToBag(id))} className={`label-sm flex-1 rounded-full border py-3 ${dark ? "border-white/30" : "border-plum/30"}`}>
          Add look to bag
        </button>
      </div>
    </div>
  );
}

// Chat + voice stylist. `preview` plays the brief's example once in view (homepage Chapter 03).
export default function StylistChat({ dark = false, preview = false, className = "" }) {
  const { topMood } = useApp();
  const [msgs, setMsgs] = useState([{ from: "ai", text: "I’m your stylist. Tell me where you’re going, when, and what you love — I’ll dress you from the collection." }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const list = useRef(null);
  const played = useRef(false);
  const rootRef = useRef(null);

  const send = (text) => {
    if (!text.trim() || thinking) return;
    setMsgs((m) => [...m, { from: "me", text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const r = styleRequest(text, { topMood });
      setThinking(false);
      setMsgs((m) => [...m, { from: "ai", text: r.text, outfits: r.outfits }]);
    }, 1300);
  };

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  // Homepage preview: type the example request when the chapter comes into view.
  useEffect(() => {
    if (!preview) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || played.current) return;
      played.current = true;
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setInput(STYLIST_EXAMPLE.slice(0, i));
        if (i >= STYLIST_EXAMPLE.length) {
          clearInterval(iv);
          setTimeout(() => send(STYLIST_EXAMPLE), 400);
        }
      }, 28);
    }, { threshold: 0.5 });
    io.observe(rootRef.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview]);

  // Resolved after mount so server and client render the same markup.
  const [SR, setSR] = useState(null);
  useEffect(() => setSR(() => window.SpeechRecognition || window.webkitSpeechRecognition || null), []);
  const voice = () => {
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join("");
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) send(t);
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const bubble = dark ? "bg-white/8 text-pearl" : "bg-white text-plum shadow-[0_6px_30px_-18px_rgba(30,21,48,.4)]";
  return (
    <div ref={rootRef} className={`flex min-h-0 flex-col ${dark ? "text-pearl" : "text-plum"} ${className}`}>
      <div ref={list} className="no-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-1" data-lenis-prevent aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.from === "me" ? "flex justify-end" : ""}>
            {m.from === "ai" && (
              <div className="mb-1.5 flex items-center gap-1.5 opacity-70">
                <Spark className="h-3 w-3" /> <span className="label-sm text-[10px]">Stylist</span>
              </div>
            )}
            <p className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${m.from === "me" ? "rounded-br-sm bg-amethyst text-white" : `rounded-tl-sm ${bubble}`}`}>{m.text}</p>
            {m.outfits?.length > 0 && (
              <div className="mt-3 grid gap-3">
                {m.outfits.map((o, j) => <Outfit key={j} outfit={o} dark={dark} />)}
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2">
            <Spark className="h-3 w-3" />
            <div className="ai-shimmer h-9 w-48 rounded-2xl" aria-label="Styling…" />
          </div>
        )}
      </div>
      {msgs.length < 2 && !preview && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className={`min-h-10 shrink-0 rounded-full border px-3.5 py-2 text-[13px] ${dark ? "border-white/20" : "border-plum/15 bg-white/60"}`}>
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        className={`ai-glow mt-3 flex items-center gap-2 rounded-full p-1.5 pl-5 ${dark ? "bg-white/10" : "bg-white"}`}
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label className="sr-only" htmlFor={`stylist-in-${preview ? "p" : "d"}`}>Ask the stylist</label>
        <input
          id={`stylist-in-${preview ? "p" : "d"}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Where are you going?"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:opacity-50"
        />
        {SR && (
          <button type="button" onClick={voice} aria-label="Speak to the stylist" aria-pressed={listening} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${listening ? "bg-amethyst text-white" : ""}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
          </button>
        )}
        <button type="submit" className="label-sm min-h-11 shrink-0 rounded-full bg-plum px-5 text-pearl">Ask</button>
      </form>
      <p className="mt-2 text-[10px] opacity-50">Prototype: styling runs on-device from the catalogue. Voice uses your browser’s speech recognition.</p>
    </div>
  );
}
