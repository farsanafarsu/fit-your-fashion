"""Fit Your Fashion: photo virtual try-on, running FASHN VTON v1.5 (Apache-2.0) on a Hugging Face Space.

The website calls the "/try_on" endpoint below. Its inputs match the official
fashn-ai/fashn-vton-1.5 Space, so the site can switch between that Space and this one by changing one setting.
"""
import os

import gradio as gr
import spaces  # ZeroGPU; on ordinary GPU hardware @spaces.GPU does nothing
import torch
from huggingface_hub import hf_hub_download
from PIL import Image

from fashn_vton import TryOnPipeline

WEIGHTS = os.path.abspath("weights")
CATEGORIES = ["tops", "bottoms", "one-pieces"]
PHOTO_TYPES = ["model", "flat-lay"]


def download_weights():
    """Same files as scripts/download_weights.py in the fashn-vton-1.5 repo (about 2.3 GB, once per Space start)."""
    hf_hub_download("fashn-ai/fashn-vton-1.5", "model.safetensors", local_dir=WEIGHTS)
    for name in ("yolox_l.onnx", "dw-ll_ucoco_384.onnx"):
        hf_hub_download("fashn-ai/DWPose", name, local_dir=os.path.join(WEIGHTS, "dwpose"))


download_weights()
_pipeline = None


def get_pipeline():
    global _pipeline
    if _pipeline is None:
        if not torch.cuda.is_available():
            raise gr.Error("This Space needs a GPU. In Settings, choose ZeroGPU or a GPU hardware.")
        _pipeline = TryOnPipeline(weights_dir=WEIGHTS, device="cuda")
    return _pipeline


def _rgb(img):
    return img if img.mode == "RGB" else img.convert("RGB")


@spaces.GPU(duration=60)
def try_on(
    person_image: Image.Image,
    garment_image: Image.Image,
    category: str = "tops",
    garment_photo_type: str = "model",
    num_timesteps: int = 30,
    guidance_scale: float = 1.5,
    seed: int = 42,
    segmentation_free: bool = True,
) -> Image.Image:
    """Run virtual try-on: put the garment on the person."""
    if person_image is None or garment_image is None:
        raise gr.Error("Please add both a photo of the person and a garment photo.")
    if category not in CATEGORIES:
        category = "tops"
    if garment_photo_type not in PHOTO_TYPES:
        garment_photo_type = "model"
    seed = 42 if seed is None or int(seed) < 0 else int(seed)

    result = get_pipeline()(
        person_image=_rgb(person_image),
        garment_image=_rgb(garment_image),
        category=category,
        garment_photo_type=garment_photo_type,
        num_samples=1,
        num_timesteps=int(num_timesteps),
        guidance_scale=float(guidance_scale),
        seed=seed,
        segmentation_free=bool(segmentation_free),
    )
    return result.images[0]


with gr.Blocks(title="Fit Your Fashion · Try-on") as demo:
    gr.Markdown("## Fit Your Fashion · virtual try-on\nUpload a photo of a person and a garment, then press **Try on**.")
    with gr.Row():
        person = gr.Image(label="Person", type="pil", sources=["upload", "webcam", "clipboard"])
        garment = gr.Image(label="Garment", type="pil", sources=["upload", "clipboard"])
        result = gr.Image(label="Try-On Result", type="pil", interactive=False)
    with gr.Row():
        category = gr.Dropdown(CATEGORIES, value="tops", label="Category")
        photo_type = gr.Dropdown(PHOTO_TYPES, value="model", label="Garment photo type")
    with gr.Accordion("Advanced settings", open=False):
        steps = gr.Slider(10, 50, value=30, step=5, label="Steps (20 fast · 30 balanced · 50 best)")
        guidance = gr.Slider(1.0, 3.0, value=1.5, step=0.1, label="Guidance scale")
        seed = gr.Number(value=42, precision=0, label="Seed")
        seg_free = gr.Checkbox(value=True, label="Segmentation-free (maskless)")
    run = gr.Button("Try on", variant="primary")
    run.click(
        try_on,
        inputs=[person, garment, category, photo_type, steps, guidance, seed, seg_free],
        outputs=result,
        api_name="try_on",
    )

# One job on the GPU at a time (avoids out-of-memory); up to 30 people wait in the queue.
demo.queue(default_concurrency_limit=1, max_size=30)

if __name__ == "__main__":
    demo.launch()
