"""Make the instant try-on cutouts: one transparent .webp per product plus body anchors in meta.json.

Run from the project root after adding products to public/tryon/products.json:
    pip install rembg onnxruntime ultralytics pillow numpy
    python scripts/make-garments.py              # all products
    python scripts/make-garments.py lune-slip    # just these ids
Then look at each new public/tryon/garments/<id>.webp. If a cutout is poor (garment hidden by arms or hair,
side-on pose), set "instant": false for it in meta.json: that piece then offers only the HD AI try-on.
Best source photos: the model facing the camera, arms away from the body, plain background.
"""
import json, os, sys, numpy as np
from PIL import Image, ImageFilter
from rembg import new_session
from ultralytics import YOLO
SRC = "."; OUT = "public/tryon/garments"
os.makedirs(OUT, exist_ok=True)
prods = json.load(open(f"{SRC}/public/tryon/products.json"))
cloth = new_session("u2net_cloth_seg"); pose = YOLO("yolo11m-pose.pt")
NAMES = {5:"ls",6:"rs",11:"lh",12:"rh",13:"lk",14:"rk",15:"la",16:"ra"}  # person's left/right (COCO)
meta = {}
ONLY = set(sys.argv[1:])
for p in prods:
    if ONLY and p["id"] not in ONLY: continue
    im = Image.open(f"{SRC}/public{p["image"]}").convert("RGB"); W,H = im.size
    masks = cloth.predict(im)  # upper, lower, full
    arr = [np.array(m.convert("L"), np.float32)/255 for m in masks]
    if p["category"]=="tops": m = arr[0]
    elif p["category"]=="bottoms": m = arr[1]
    else: m = np.maximum.reduce(arr)
    if (m>0.16).mean() < 0.03: m = np.maximum.reduce(arr)  # category mask empty: use any clothing
    r = pose(im, verbose=False)[0]
    if r.keypoints is None or len(r.keypoints.xy)==0: print("NO POSE", p["id"]); continue
    i = int(r.boxes.conf.argmax()); xy = r.keypoints.xy[i].numpy(); cf = r.keypoints.conf[i].numpy()
    kp = {n:[round(float(xy[k][0])/W,4), round(float(xy[k][1])/H,4), round(float(cf[k]),2)] for k,n in NAMES.items()}
    if p["category"]=="bottoms":  # never keep anything above the waist (tops worn with the piece)
        hy = int(min(kp["lh"][1], kp["rh"][1]) * H - 0.04 * H); m[:max(hy,0), :] = 0
    alpha = Image.fromarray((np.clip(m,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    bbox = alpha.point(lambda v:255 if v>40 else 0).getbbox()
    rgba = im.copy(); rgba.putalpha(alpha)
    rgba.save(f"{OUT}/{p['id']}.webp", quality=88)
    cover = float((np.array(alpha)>40).mean())
    meta[p["id"]] = {"w":W,"h":H,"kp":kp,"bbox":[round(bbox[0]/W,4),round(bbox[1]/H,4),round(bbox[2]/W,4),round(bbox[3]/H,4)] if bbox else None,"cover":round(cover,3)}
    print(p["id"], p["category"], "cover", round(cover,3), {k:v[2] for k,v in kp.items()})
old = json.load(open(f"{OUT}/meta.json")) if os.path.exists(f"{OUT}/meta.json") else {}; [m_.setdefault("instant", True) for m_ in meta.values()]; old.update(meta)
json.dump(old, open(f"{OUT}/meta.json","w"), separators=(",",":"))
