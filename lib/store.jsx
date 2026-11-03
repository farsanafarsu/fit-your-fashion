"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_BODY } from "./sizing";

const Ctx = createContext(null);

// localStorage can throw (private mode, blocked storage) — every access is guarded.
function load(key, fallback) {
  try {
    const v = localStorage.getItem("fyf:" + key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem("fyf:" + key, JSON.stringify(value));
  } catch {}
}

function usePersisted(key, fallback) {
  const [v, setV] = useState(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setV(load(key, fallback));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (ready) save(key, v);
  }, [key, v, ready]);
  return [v, setV];
}

export function AppProvider({ children }) {
  const [bag, setBag] = usePersisted("bag", []); // [{id, size}]
  const [wishlist, setWishlist] = usePersisted("wishlist", []);
  const [lookbook, setLookbook] = usePersisted("lookbook", []);
  const [body, setBody] = usePersisted("body", DEFAULT_BODY);
  const [returnHistory, setReturnHistory] = usePersisted("returns", "none");
  const [moodWeights, setMoodWeights] = usePersisted("moods", {});
  const [viewed, setViewed] = usePersisted("viewed", []);
  const [sound, setSound] = usePersisted("sound", false);
  const [panel, setPanel] = useState(null); // 'stylist' | 'bag' | 'search' | 'wishlist' | null
  const [mood, setMood] = useState(null);
  const [ask, setAsk] = useState(null); // a question handed to the stylist panel from elsewhere on the page
  const [shopCat, setShopCat] = useState("all"); // shop grid filter, also set by the category tiles

  const addToBag = useCallback((id, size = "M") => setBag((b) => [...b.filter((x) => x.id !== id), { id, size }]), [setBag]);
  const removeFromBag = useCallback((id) => setBag((b) => b.filter((x) => x.id !== id)), [setBag]);
  const toggleWish = useCallback((id) => setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])), [setWishlist]);
  const noteMood = useCallback((m, w = 1) => setMoodWeights((s) => ({ ...s, [m]: (s[m] ?? 0) + w })), [setMoodWeights]);
  const noteView = useCallback((id) => setViewed((v) => [id, ...v.filter((x) => x !== id)].slice(0, 12)), [setViewed]);
  const saveLook = useCallback((look) => setLookbook((l) => [{ ...look, at: Date.now() }, ...l].slice(0, 24)), [setLookbook]);
  const removeLook = useCallback((at) => setLookbook((l) => l.filter((x) => x.at !== at)), [setLookbook]);
  const askStylist = useCallback((text) => { setAsk(text); setPanel("stylist"); }, []);
  const clearAsk = useCallback(() => setAsk(null), []);

  const topMood = useMemo(() => Object.entries(moodWeights).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null, [moodWeights]);

  // Ambience: the hovered mood tints a fixed light layer across the page.
  useEffect(() => {
    if (mood) document.documentElement.dataset.mood = mood;
    else delete document.documentElement.dataset.mood;
  }, [mood]);

  const value = {
    bag, addToBag, removeFromBag,
    wishlist, toggleWish,
    lookbook, saveLook, removeLook,
    body, setBody, returnHistory, setReturnHistory,
    moodWeights, noteMood, topMood, viewed, noteView,
    sound, setSound, panel, setPanel, mood, setMood,
    ask, askStylist, clearAsk, shopCat, setShopCat,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
