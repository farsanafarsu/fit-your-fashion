---
title: Fit Your Fashion Try-On
emoji: 👗
colorFrom: purple
colorTo: pink
sdk: gradio
app_file: app.py
pinned: false
license: apache-2.0
short_description: Photo virtual try-on for Fit Your Fashion (FASHN VTON v1.5)
models:
  - fashn-ai/fashn-vton-1.5
  - fashn-ai/DWPose
---

# Fit Your Fashion · virtual try-on

This Space runs [FASHN VTON v1.5](https://huggingface.co/fashn-ai/fashn-vton-1.5) (Apache-2.0, commercial use allowed).
The Fit Your Fashion website calls its `/try_on` endpoint.

## Put it online

1. Hugging Face → **New Space**. SDK: **Gradio**. Hardware: **ZeroGPU** (needs HF PRO) or any GPU with at least 8 GB.
   Free accounts can't currently host Gradio Spaces.
2. Upload the three files in this folder: `app.py`, `requirements.txt`, `README.md`.
3. Wait for the build (first start downloads about 2.3 GB of weights).
4. In the website, set `NEXT_PUBLIC_TRYON_SPACE` (locally) or the repo variable `TRYON_SPACE` (GitHub Pages)
   to `your-username/your-space-name`.

## API

`/try_on(person_image, garment_image, category, garment_photo_type, num_timesteps, guidance_scale, seed, segmentation_free) -> image`

- `category`: `tops`, `bottoms` or `one-pieces`
- `garment_photo_type`: `model` (garment worn by someone) or `flat-lay`
