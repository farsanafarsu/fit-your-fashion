"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOODS } from "@/lib/catalog";
import { useApp } from "@/lib/store";

// One continuous page colour instead of section blocks: every [data-chapter] declares its colour and
// the fixed backdrop blends to it while that chapter's top travels up the screen (scrubbed, so the
// change is tied to the scroll — no hard edges, no sudden cuts). Hovering a mood tints it too.
export default function Backdrop() {
  const el = useRef(null);
  const chapter = useRef("#FAF8FD");
  const { mood } = useApp();

  useEffect(() => {
    let triggers = [];
    const build = () => {
      triggers.forEach((t) => t.kill());
      triggers = [];
      const chapters = gsap.utils.toArray("[data-chapter]");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      chapters.forEach((c, i) => {
        const from = i ? chapters[i - 1].dataset.chapter : "#FAF8FD";
        const to = c.dataset.chapter;
        if (from === to && i) return;
        // Light ↔ dark crossings pass through lavender rather than a flat RGB grey.
        const lum = (h) => parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16);
        const viaLavender = Math.abs(lum(from) - lum(to)) > 300;
        const tween = gsap.timeline({
            scrollTrigger: {
              trigger: c,
              start: "top 92%",
              end: "top 38%",
              scrub: reduce ? false : 0.6,
              toggleActions: reduce ? "play none none reverse" : undefined,
              onEnter: () => (chapter.current = to),
              onLeaveBack: () => (chapter.current = from),
            },
          })
          .fromTo(el.current, { backgroundColor: from }, { backgroundColor: viaLavender ? "#A792CC" : to, ease: "none", immediateRender: i === 0 });
        if (viaLavender) tween.to(el.current, { backgroundColor: to, ease: "none" });
        triggers.push(tween.scrollTrigger);
      });
      ScrollTrigger.refresh();
    };
    // wait one frame so pinned sections have inserted their spacers
    const id = requestAnimationFrame(build);
    return () => {
      cancelAnimationFrame(id);
      triggers.forEach((t) => t.kill());
    };
  }, []);

  useEffect(() => {
    const tint = MOODS.find((m) => m.id === mood)?.tint;
    gsap.to(el.current, { backgroundColor: tint ?? chapter.current, duration: 1.1, ease: "power2.out", overwrite: "auto" });
  }, [mood]);

  return <div ref={el} className="pointer-events-none fixed inset-0 -z-10" style={{ backgroundColor: "#FAF8FD" }} aria-hidden />;
}
