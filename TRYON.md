# Virtual try-on

Shoppers tap **Try it on** and get two ways to see a piece on themselves:

| | **Live (default)** | **HD photo ✦** |
| --- | --- | --- |
| What they see | Their camera, with the garment following their shoulders and hips as they move | A realistic AI photo of them wearing it |
| Speed | Instant (after a few seconds of loading the first time) | 20–60 s, longer if busy |
| Cost / limits | Free, unlimited: it runs in the shopper's own browser | Free, but shared GPU: may queue, a few per visitor per day |
| Privacy | Video never leaves the device | One photo is sent to the AI model on Hugging Face, not kept |
| Tech | MediaPipe Pose (Google, Apache-2.0) + garment cutouts | FASHN VTON v1.5 (Apache-2.0) on a Hugging Face Space |

The live mode works like a filter. The piece is laid over the shopper's own clothes, so it looks like a well-placed overlay, not a photo. **HD photo** is for the realistic picture. It uses the current camera frame, or a photo they upload.

## Files

| Part | Where |
| --- | --- |
| Settings: on/off, HD Space, HD quality, `track()` for analytics | `components/tryon/config.js` |
| The modal (both modes) | `components/tryon/TryOnModal.jsx` |
| Live engine: camera → pose → draw | `components/tryon/live.js` |
| Fitting maths (where the garment goes) | `components/tryon/fit.js` |
| Garment cutouts + body anchors | `public/tryon/garments/` (`<id>.webp`, `meta.json`) |
| Script that makes the cutouts | `scripts/make-garments.py` |
| Products in the strip, with `category` | `public/tryon/products.json` |
| Your own Hugging Face Space for HD (optional) | `hf-space/` |

## Adding a product to live try-on

1. Add it to `public/tryon/products.json` with `id`, `name`, `image`, and a `category`: `tops`, `bottoms` or `one-pieces`.
2. Run `python scripts/make-garments.py <id>`. The script's header lists the one-time `pip install`.
3. Open `public/tryon/garments/<id>.webp` and check the cutout. If it's poor, set `"instant": false` for that id in `meta.json`. The piece then shows an **HD** badge and offers only the HD photo.
   - Poor cutouts usually come from arms or hair covering the garment, a side-on pose, or a busy background.
   - Right now `nocturne-blazer` and `halo-cape` are HD-only for these reasons.

**Best photos for live try-on:** the model faces the camera, arms slightly away from the body, on a plain background.

## HD photo: making it faster

HD uses the free public Space `fashn-ai/fashn-vton-1.5` by default. It's shared with everyone, so at busy times there's a queue ("In line: 18").

For your own queue, host `hf-space/` on Hugging Face:
1. Get HF PRO ($9/month), then create a **New Space** → **Gradio** → **ZeroGPU** and upload the three files.
2. Set the repo variable `TRYON_SPACE` (Settings → Secrets and variables → Actions → Variables) to `your-name/your-space`.
3. In `.github/workflows/deploy.yml`, pass it to the build as `NEXT_PUBLIC_TRYON_SPACE: ${{ vars.TRYON_SPACE }}`.

`TIMESTEPS` in `config.js` trades quality for speed: 20 fast, 30 default, 50 best.

## Privacy and analytics

- **Consent:** shoppers agree once. The consent screen explains both modes.
- **HD photos** are shrunk to 1024 px and re-encoded, which drops location metadata. They're kept in memory for that page visit only.
- **Analytics:** `track(name, data)` in `config.js` receives every event:
  - `tryon_opened`, `tryon_live`, `tryon_snapshot`, `tryon_photo_added`, `tryon_started`;
  - `tryon_done`, `tryon_swapped`, `tryon_download`, `tryon_add_to_cart`, `tryon_error`.

## What's tested

- **Fitting maths:** the cutouts were placed on other model photos using the same `fit.js` code, and they landed on the shoulders and hips at the right size.
- **The production build passes.**
- **Not yet tested on a real camera or phone.** MediaPipe's engine and model load from jsDelivr and Google's model storage, which this workspace can't reach.
