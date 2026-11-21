# Live virtual try-on (Decart)

Shoppers tap **Try it on**, allow the camera, and see the piece on themselves live. It's powered by Decart's realtime virtual try-on model (`lucy-vton-latest`, SDK `@decartai/sdk` 0.2.14).

| Part | Where |
| --- | --- |
| Settings: on/off flag, token URL, 3-min limit, `track()` for analytics | `components/tryon/config.js` |
| The modal | `components/tryon/TryOnModal.jsx` |
| Opens the modal from any `.tryon-btn`; mounted once in `app/layout.jsx` | `components/tryon/TryOnRoot.jsx` |
| Products in the strip under the video (edit freely) | `public/tryon/products.json` |
| Token service: the only place the API key lives | `tryon-api/` |

**The API key never reaches the browser.** The site asks the token service for a Decart *client token*. That token:
- lasts 60 seconds, which is just long enough to connect;
- works only with the try-on model;
- works only from your site's origin;
- carries a 3-minute session limit, enforced by Decart.

## 1. Put the key on a token service (Vercel)

1. On vercel.com: **Add New → Project**, then import this GitHub repo.
2. Set **Root Directory** to `tryon-api`. Leave the framework as "Other".
3. Under **Environment Variables**, add the values from `tryon-api/.env.example`:
   - `DECART_API_KEY`: your key from platform.decart.ai.
   - `ALLOWED_ORIGINS`: `https://farsanafarsu.github.io`, plus your own domain later. Add `http://localhost:3000` only on a preview or dev project.
   - Optional limits: `RATE_LIMIT_PER_IP` (default 5 per 10 min), `DAILY_TOKEN_CAP` (default 100 a day), `MAX_SESSION_SECONDS` (default 180).
   - **Recommended:** `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from a free Upstash Redis database. Without them the limits are counted in memory, which resets whenever Vercel starts a new instance.
4. Deploy. Your token URL is `https://<project>.vercel.app/api/tryon-token`.

## 2. Point the site at it

- **Live site (GitHub Pages):**
  1. In the repo, open **Settings → Secrets and variables → Actions → Variables** and add `TRYON_TOKEN_URL` with the URL from step 1.
  2. Push to `main`. The deploy workflow passes the URL into the build.
- **Locally:**
  1. Copy `.env.example` to `.env.local`.
  2. Copy `tryon-api/.env.example` to `tryon-api/.env` and fill in the key.
  3. Run `cd tryon-api && npm install && npm run dev`. The token service starts on port 3001.
  4. Run `npm run dev` at the project root.

The camera needs HTTPS, or `localhost`.

## 3. Add the button to a product

Any element with class `tryon-btn` and a `data-image` opens the try-on. This works in React components and in plain HTML:

```html
<button class="tryon-btn" data-id="lune-slip" data-name="Lune Slip Dress" data-image="/products/lune-slip.webp">Try it on</button>
```

- `data-id` should match a catalogue id (`lib/catalog.js`) so **Add to bag** puts it in the real bag.
- `components/ProductCard.jsx` already has the button, so every product card on the site shows it.
- **Best results:** Decart recommends a clean garment photo on a plain background, at least 512×512. Your current photos show models wearing the clothes, so expect weaker results until you have garment-only shots.

To change what Add to bag does, edit `onAddToCart` in `TryOnRoot.jsx`.

## 4. On/off and analytics

- **Turn it off:** set `TRYON_ENABLED = false` in `components/tryon/config.js`. The buttons disappear, and neither the SDK nor the camera ever loads.
- **Analytics:** `track(name, data)` in the same file receives every event:
  - `tryon_opened`, `tryon_started`, `tryon_live`, `tryon_swapped`;
  - `tryon_snapshot`, `tryon_add_to_cart`, `tryon_ended`, `tryon_error`.

  Add `window.gtag?.("event", name, data)` or `window.fbq?.("trackCustom", name, data)` there.

## 5. Costs and guards

- **Price:** Decart's pricing page lists **$0.02 per second** for the try-on model at 720p. That's about $1.20 a minute, so a full 3-minute session costs about $3.60.
- **Default worst case:** 100 sessions a day, about $360 a day, if every one runs the full 3 minutes. Set `DAILY_TOKEN_CAP` to what you're happy to spend.
- **What the token service checks, in order:**
  1. The origin is on the allow-list.
  2. The IP hasn't hit its rate limit.
  3. The daily cap isn't reached.
  4. Only then does it mint a token.

  If the limit store fails, it refuses to mint ("fails closed") rather than handing out unmetered tokens.
- **What the browser does:** sessions stop at 3:00, when the modal closes, or when the tab is hidden.
- **Origin checks only stop other websites.** A script can fake its Origin header. Against scripts, the real protection is the rate limit, the daily cap and the 60-second, model-only tokens.

## 6. Netlify or Cloudflare instead of Vercel

- **Netlify:**
  - Move the file to `netlify/functions/tryon-token.mjs`.
  - Netlify functions receive a web `Request` and return a `Response`. Wrap the logic: read `req.headers.get("origin")`, then return `new Response(JSON.stringify(body), { status, headers })` instead of `res.end(...)`.
  - Read the IP from `context.ip`.
  - The URL becomes `/.netlify/functions/tryon-token`.
- **Cloudflare Workers:**
  - Use `export default { async fetch(request, env) { … } }`, with the same Request/Response changes.
  - Store the key as a secret: `wrangler secret put DECART_API_KEY`.
  - Read it as `env.DECART_API_KEY`, and the IP from `request.headers.get("CF-Connecting-IP")`.
  - For counters, use Workers KV or a Durable Object instead of the in-memory map.
  - You may need `compatibility_flags = ["nodejs_compat"]` for the SDK.

## 7. What was tested, and what wasn't

**Tested locally:**
- **Token service:**
  - an allowed site gets through, other sites and requests with no origin get 403, the wrong method gets 405;
  - the 4th request from one IP in a window gets 429, as does the request past the daily cap;
  - it really calls Decart: a fake key got Decart's "Invalid or expired API key".
- **Site, with a fake camera, against a production build:**
  - 27 buttons on the homepage, and the SDK is not downloaded until **Try it on** is clicked;
  - the consent screen comes first, the camera starts, and a token failure shows a friendly error and switches the camera off;
  - tap-to-swap and drag-onto-video both change the outfit, and Snapshot is disabled until live;
  - Add to bag shows its toast, Esc closes the modal and stops the camera, and the tab being hidden stops the session;
  - reopening starts automatically after consent;
  - no page errors.

**Not verified (needs a real `DECART_API_KEY`):**
- the live edited video, swapping the outfit mid-session, and Snapshot of the live frame;
- the countdown reaching 0:00;
- how Decart behaves when a session hits `maxSessionDuration`;
- whether listing both `lucy-vton-latest` and `lucy-vton-3.6` in `allowedModels` is what Decart expects for the alias.

**Not stated in Decart's docs:**
- whether the camera's audio is needed (this sends video only);
- the try-on output resolution and fps;
- mobile browser support;
- concurrency limits.

**Not tested:**
- real phones (front camera, portrait), Safari, deployment to Vercel, and Upstash. Upstash's pipeline call follows its documented REST API but hasn't been run.
