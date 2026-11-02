# FIT YOUR FASHION

A cinematic, editorial homepage for a luxury-meets-future fashion house, with a working AI Dressing Room and AI Stylist prototype.

```bash
npm install
npm run dev     # http://localhost:3000
```

## Pages

| Route | What it is |
| --- | --- |
| `/` | The homepage film: intro → hero → Chapters 01–03 → AI Atelier → moods → Shop the Film → Picked for you → craft → UGC → Inner Circle → footer |
| `/dressing-room` | Full AI Dressing Room: avatar (photo / scan / measurements), 3D try-on, layering, sizes, fit heatmap, poses + walk, 360°, Live Mirror, Lookbook + share. Accepts `?look=id,id`, `?mood=id`, `&campaign=1` |
| `/style-guide` | Colours, type scale, spacing, motion rules, AI element styling |

## Stack

Next.js (App Router) · React · Tailwind CSS v4 · GSAP + ScrollTrigger · Lenis · Three.js / React Three Fiber · Framer Motion.

## Where things live

- `lib/catalog.js` — products, moods, size chart, media sources. **All placeholders live here.**
- `lib/sizing.js` — AI Size Predictor (best size + confidence from measurements and return history) and per-zone fit used by the heatmap.
- `lib/stylist.js` — on-device stylist (occasion, place, month, height, colour → complete outfits). Swap `styleRequest` for an LLM-backed `/api/stylist` route returning the same `{ text, outfits }` shape.
- `components/dressing/AvatarScene.jsx` — parametric avatar and garment shells; size changes move the garment away from / onto the body.
- `components/sections/*` — one file per homepage chapter.

## Placeholders to replace before launch

- **Hero & campaign films**: set `MEDIA.heroFilm.landscape/portrait` and `MEDIA.campaignFilm` in `lib/catalog.js`. Until then a generative WebGL silk film stands in. Captions: `public/media/hero-captions.vtt`.
- **Product photography**: `GarmentArt` draws labelled silhouettes; replace with front + second-angle photos.
- **Prices** (`₹ XX,XXX`), **size chart**, social links, newsletter provider, soundtrack.
- **UGC wall**: tiles are empty slots for real, consented customer looks. No reviews or stats are invented anywhere.
- **AI models**: body estimation from photo/scan, pose tracking for Live Mirror, vision-based visual search, generative campaign renders and live weather are marked in the UI as prototype steps.

## Privacy

Photos, scans and the webcam stream are processed in the browser and never uploaded in this prototype. Measurements are stored only in `localStorage` and can be deleted from the dressing room. Shared look links contain garment IDs only.

## Accessibility & motion

Keyboard focus styles, skip link, labelled controls, alt text on imagery, and a calmer `prefers-reduced-motion` version (no smooth scroll, pins, parallax or grain).
