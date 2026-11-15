"use client";
import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

// Ambient pad + UI ticks synthesised with WebAudio (no audio files to load).
// PLACEHOLDER: swap the pad for the licensed campaign soundtrack when available.
export default function Sound() {
  const { sound, mood } = useApp();
  const ctx = useRef(null);
  const nodes = useRef(null);

  useEffect(() => {
    if (!sound) {
      if (nodes.current) {
        const { master, ac } = nodes.current;
        master.gain.setTargetAtTime(0, ac.currentTime, 0.4);
      }
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx.current) ctx.current = new AC();
    const ac = ctx.current;
    ac.resume();
    if (!nodes.current) {
      const master = ac.createGain();
      master.gain.value = 0;
      const filter = ac.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      filter.connect(master).connect(ac.destination);
      const oscs = [220, 277.18, 329.63, 440 * 1.002].map((f, i) => {
        const o = ac.createOscillator();
        o.type = i % 2 ? "triangle" : "sine";
        o.frequency.value = f / 2;
        const g = ac.createGain();
        g.gain.value = 0.05;
        o.connect(g).connect(filter);
        o.start();
        return o;
      });
      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 380;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
      nodes.current = { ac, master, filter, oscs };
    }
    nodes.current.master.gain.setTargetAtTime(0.5, ac.currentTime, 1.2);

    const tick = (e) => {
      if (!e.target.closest?.("button, a, [data-sound]")) return;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.value = 1320;
      g.gain.setValueAtTime(0.04, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12);
      o.connect(g).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.14);
    };
    window.addEventListener("click", tick);
    return () => window.removeEventListener("click", tick);
  }, [sound]);

  // Mood shifts the pad's colour.
  useEffect(() => {
    const n = nodes.current;
    if (!n) return;
    const shift = { moonlit: 0.84, bridal: 1.12, "soft-power": 0.94, "off-duty": 1.06 }[mood] ?? 1;
    const base = [220, 277.18, 329.63, 440.88];
    n.oscs.forEach((o, i) => o.frequency.setTargetAtTime((base[i] / 2) * shift, n.ac.currentTime, 0.8));
  }, [mood]);

  return null;
}
