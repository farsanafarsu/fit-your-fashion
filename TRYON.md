# Photo virtual try-on (Hugging Face)

Shoppers tap **Try it on**, add a photo of themselves (upload or camera), and get a picture of themselves wearing the piece in about 20–60 seconds. Tapping another piece re-uses the same photo.

It runs **FASHN VTON v1.5**, an open model under the **Apache-2.0** licence, so a shop can use it commercially. It runs on a Hugging Face Space. There's no API key and no token server.

| Part | Where |
| --- | --- |
| Settings: on/off, which Space, quality (steps), `track()` for analytics | `components/tryon/config.js` |
| The modal | `components/tryon/TryOnModal.jsx` |
| Opens the modal from any `.tryon-btn`; mounted once in `app/layout.jsx` | `components/tryon/TryOnRoot.jsx` |
| Products in the strip, with their `category` | `public/tryon/products.json` |
| Your own Hugging Face Space (optional) | `hf-space/` |

## 1. How it runs today: free, no setup

By default the site calls the official public Space **`fashn-ai/fashn-vton-1.5`**. It costs you nothing.

The limit is per visitor, not per shop. Hugging Face's ZeroGPU gives each visitor a small daily GPU allowance: about **2 minutes a day without an HF login**. Each try-on uses roughly 15–40 seconds of it, so that's a few try-ons per visitor per day. After that the site says "You've used today's free try-ons… come back later".

The catch: you depend on FASHN keeping that Space online and public, and you share its queue with everyone else.

## 2. Your own Space (when you're ready)

Hugging Face currently requires a paid plan to host a Gradio Space. Free accounts can't.

1. Get **HF PRO** ($9/month) on huggingface.co.
2. **New Space** → SDK **Gradio** → hardware **ZeroGPU**. Upload the three files in `hf-space/`.
   - With ZeroGPU, visitors still use *their own* daily allowance, not yours. An idle Space costs nothing.
   - Prefer no per-visitor limit? Pick a paid GPU (8 GB+) instead. You then pay by the hour while it's switched on.
3. Point the site at it:
   - **Locally:** put `NEXT_PUBLIC_TRYON_SPACE=your-name/your-space` in `.env.local`.
   - **GitHub Pages:** add the repository variable `TRYON_SPACE` (Settings → Secrets and variables → Actions → Variables), then push to `main`.

Your Space has the same `/try_on` endpoint as the official one, so nothing else changes.

## 3. Add the button to a product

Any element with class `tryon-btn` and a `data-image` opens the try-on:

```html
<button class="tryon-btn" data-id="lune-slip" data-name="Lune Slip Dress" data-image="/products/lune-slip.webp" data-category="one-pieces">Try it on</button>
```

- `data-category`: `tops`, `bottoms` or `one-pieces`. It tells the model which part of the outfit to replace.
  - If you leave it out, it's taken from `products.json` by `data-id`.
  - If it's not there either, it's guessed from the name (`guessCategory` in `config.js`).
- `data-id` should match a catalogue id (`lib/catalog.js`) so **Add to bag** puts the piece in the real bag.
- **Photos:** product photos of the piece being worn work (`garment_photo_type: "model"`). Flat-lay shots work too. Change that value in `TryOnModal.jsx` if you switch to flat-lays.

## 4. Settings, privacy, analytics

- **Off switch:** set `TRYON_ENABLED = false` in `config.js`.
- **Speed vs quality:** `TIMESTEPS` in `config.js`: 20 fast, 30 balanced (default), 50 best. Fewer steps means more try-ons per visitor per day.
- **Privacy:**
  - Shoppers agree once before anything is sent.
  - The photo is shrunk to 1024 px and re-encoded, which drops location metadata. It's then sent to the Space only to make the picture.
  - It's kept in memory for that page visit and never saved to storage.
- **Analytics:** `track(name, data)` in `config.js` receives every event:
  - `tryon_opened`, `tryon_photo_added`, `tryon_started`, `tryon_done`;
  - `tryon_swapped`, `tryon_download`, `tryon_add_to_cart`, `tryon_error`.

## 5. Not tested yet

- A real call to the Space from the site. The code follows the Space's published `/try_on` API, and the modal bundles without errors, but this workspace couldn't reach Hugging Face.
- The exact wording of Hugging Face's quota error. The site matches words like "quota" and "ZeroGPU" to show its friendly message.
- `hf-space/app.py` hasn't been deployed. It mirrors the official Space's code and weight downloads.
- Saree and draped pieces. FASHN supports tops, bottoms and one-pieces. Draped sarees are outside what it was built for, so expect weaker results.

## Old live try-on (Decart)

The Decart live-video try-on has been removed from the site and `@decartai/sdk` from `package.json`. The `tryon-api/` folder (Decart token service) is no longer used and can be deleted, along with its Vercel project and the `TRYON_TOKEN_URL` repo variable.
