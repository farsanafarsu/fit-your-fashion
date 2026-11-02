"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// Lavender ring that grows over interactive items. Elements opt into a label with data-cursor="View".
export default function Cursor() {
  const ring = useRef(null);
  const [label, setLabel] = useState("");
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setOn(true);
    document.body.classList.add("has-cursor");
    const el = ring.current;
    const x = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });
    let hovering = null;

    const move = (e) => {
      x(e.clientX);
      y(e.clientY);
      const t = e.target.closest?.("[data-cursor], a, button, input, textarea, select, [role=button]");
      if (t === hovering) return;
      hovering = t;
      const text = t?.dataset?.cursor ?? "";
      const isField = t && /INPUT|TEXTAREA|SELECT/.test(t.tagName);
      setLabel(text);
      gsap.to(el, { scale: !t ? 1 : text ? 4.2 : isField ? 0.6 : 2.2, duration: 0.5, ease: "expo.out" });
      el.dataset.dark = t?.closest(".on-dark") ? "1" : document.elementFromPoint(e.clientX, e.clientY)?.closest(".on-dark") ? "1" : "";
    };
    const leave = () => gsap.to(el, { opacity: 0, duration: 0.3 });
    const enter = () => gsap.to(el, { opacity: 1, duration: 0.3 });
    const down = () => gsap.to(el, { scale: "*=0.85", duration: 0.15 });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointerenter", enter);
    return () => {
      document.body.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointerenter", enter);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      className={`${on ? "" : "hidden"} pointer-events-none fixed left-0 top-0 z-[300] -ml-3 -mt-3 flex h-6 w-6 items-center justify-center rounded-full border border-lavender mix-blend-normal backdrop-blur-[1px] data-[dark=1]:border-mist ${label ? "bg-white/70" : ""}`}
      style={{ boxShadow: "0 0 18px rgba(201,182,228,.55)" }}
    >
      <span className="label-sm whitespace-nowrap text-[3px] tracking-[0.2em] text-amethyst" style={{ fontSize: 2.6 }}>
        {label}
      </span>
    </div>
  );
}
