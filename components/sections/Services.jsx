"use client";

// Client services strip. PLACEHOLDER: policy wording until the real delivery, returns and
// alteration terms are confirmed — nothing here is a commitment yet.
const ICONS = {
  delivery: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01",
  returns: "M4 9h12a4 4 0 0 1 0 8H9M4 9l4-4M4 9l4 4",
  needle: "M5 19 19 5M15 5h4v4M8 16l-3 3M12 6c3 0 6 3 6 6",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3",
};
const SERVICES = [
  ["delivery", "Delivered in tissue", "Hand-packed in our lavender box, tracked to your door."],
  ["returns", "Easy returns", "Changed your mind? Book a collection from your account."],
  ["needle", "Alterations atelier", "Hems and sleeves adjusted to your saved fit profile."],
  ["lock", "Secure checkout", "Encrypted payment. Your photos and measurements stay on your device."],
];

export default function Services() {
  return (
    <section data-chapter="#FAF8FD" className="border-y border-plum/10 py-16 md:py-20" aria-label="Client services">
      <ul className="mx-auto grid max-w-[1500px] grid-cols-1 gap-10 px-[var(--gutter)] sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-plum/10">
        {SERVICES.map(([icon, title, text]) => (
          <li key={title} className="flex gap-5 lg:px-8 lg:first:pl-0 lg:last:pr-0">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-mist text-amethyst">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={ICONS[icon]} />
              </svg>
            </span>
            <div>
              <p className="display text-[23px] leading-tight">{title}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">{text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="label-sm mt-10 text-center text-plum/35">Service terms are placeholders until launch</p>
    </section>
  );
}
