"use client";
import Link from "next/link";
import { useState } from "react";
import { PRODUCTS } from "@/lib/catalog";
import GarmentArt from "../ui/GarmentArt";
import { Button, Scramble } from "../ui/primitives";

// Social proof: a wall reserved for real, consented customer try-on looks. No invented reviews.
export function UGCWall() {
  const tiles = PRODUCTS.slice(0, 8);
  return (
    <section className="overflow-hidden bg-pearl py-24 md:py-32" aria-labelledby="ugc-h">
      <div className="mx-auto max-w-[1500px] px-[var(--gutter)] text-center">
        <p className="label text-amethyst">Worn by you</p>
        <h2 id="ugc-h" className="display mx-auto mt-6 max-w-4xl text-[12vw] md:text-[5.5vw]">The Inner Circle, <span className="display-i">in the mirror.</span></h2>
        <p className="mx-auto mt-6 max-w-md text-[14px] text-ink-soft">Real try-on looks shared by customers with #FitYourFashion appear here once they opt in.</p>
      </div>
      <div className="relative mt-14" data-reveal="curtain">
        <div className="flex w-max gap-4" style={{ animation: "pan 60s linear infinite" }}>
          {[...tiles, ...tiles].map((p, i) => (
            <div key={i} className="relative w-[44vw] shrink-0 sm:w-[22vw] lg:w-[15vw]" aria-hidden={i >= tiles.length}>
              <GarmentArt product={p} angle={i % 2} className={`rounded-[4px] ${i % 3 ? "aspect-[3/4]" : "aspect-[4/5] mt-10"}`} tag={false} />
              <span className="label-sm absolute left-2 top-2 rounded-full bg-white/70 px-2 py-1 text-[8px] text-plum/60">Customer look placeholder</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12 text-center">
        <Button variant="ghost" className="text-plum">Share your look</Button>
      </div>
    </section>
  );
}

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <section className="on-dark relative overflow-hidden bg-plum-2 py-28 text-pearl md:py-40" aria-labelledby="nl-h">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[50vmax] w-[50vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amethyst/40 blur-[160px]" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-[var(--gutter)] text-center">
        <p className="label text-lavender">Early access</p>
        <h2 id="nl-h" className="display mt-6 text-[14vw] md:text-[7vw]">Join the <span className="display-i iris-text">Inner Circle</span></h2>
        <p className="mx-auto mt-6 max-w-md text-[15px] text-mist/75">First look at every drop, private fittings in the AI Dressing Room, and invitations to the film premieres.</p>
        {done ? (
          <p className="display-i mt-12 text-[28px] text-lavender" role="status">You’re on the list. Watch your inbox.</p>
        ) : (
          <form
            className="mx-auto mt-12 flex max-w-lg flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              // PLACEHOLDER: connect to the email provider. Nothing is sent in this prototype.
              if (/\S+@\S+\.\S+/.test(email)) setDone(true);
            }}
          >
            <label htmlFor="nl-email" className="sr-only">Email address</label>
            <input id="nl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="flex-1 rounded-full border border-white/25 bg-white/5 px-6 py-4 text-[15px] outline-none placeholder:text-mist/50 focus:border-lavender" />
            <Button variant="light" type="submit">Request access</Button>
          </form>
        )}
        <p className="mt-5 text-[11px] text-mist/50">Unsubscribe anytime. We never share your details.</p>
      </div>
    </section>
  );
}

export function Footer() {
  const cols = {
    Shop: [["The Collection", "/#collection"], ["Shop by mood", "/#moods"], ["Picked for you", "/#collection"]],
    "AI Atelier": [["Dressing Room", "/dressing-room"], ["Stylist", "/#stylist"], ["Colour Analysis", "/#atelier"], ["Visual Search", "/#atelier"]],
    House: [["Our craft", "/#story"], ["Style guide", "/style-guide"], ["Privacy & your photos", "/#atelier"]],
  };
  return (
    <footer className="on-dark overflow-hidden bg-plum pb-6 pt-24 text-pearl">
      <div className="mx-auto grid max-w-[1500px] gap-12 px-[var(--gutter)] md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <p className="display-i max-w-xs text-[28px] leading-tight text-mist">A fashion film where an intelligent stylist dresses you.</p>
        {Object.entries(cols).map(([h, links]) => (
          <nav key={h} aria-label={h}>
            <p className="label-sm text-lavender">{h}</p>
            <ul className="mt-5 space-y-3 text-[14px] text-mist/80">
              {links.map(([t, href]) => (
                <li key={t}><Link href={href} className="hover:text-pearl"><Scramble text={t} /></Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-20 flex max-w-[1500px] flex-wrap justify-between gap-4 px-[var(--gutter)] text-[11px] text-mist/50">
        <span>© {new Date().getFullYear()} Fit Your Fashion</span>
        <span>Instagram · Pinterest · YouTube (links placeholder)</span>
      </div>
      <p className="display mt-6 select-none whitespace-nowrap text-center text-[10.8vw] leading-[0.78] tracking-[-0.05em] text-pearl/95" aria-hidden data-reveal="wipe">
        FIT YOUR FASHION
      </p>
    </footer>
  );
}
