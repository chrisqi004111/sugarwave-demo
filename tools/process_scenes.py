"""Process /public/scenes — the homepage slider's real scene photos.

For every image in public/scenes it:
  1. backs up the untouched original into public/scenes/_originals/
  2. center-crops to a 4:5 portrait ratio (no distortion)
  3. downscales to max 1200px wide (never upscales)
  4. saves as <slug>.jpg

Filenames are normalized to a slug. If you name a file after a product
(e.g. "Boop Stool.jpg") it maps to the right slug via ALIASES; otherwise the
lowercased, space-stripped stem is used.

Run:  python tools/process_scenes.py
"""
import os
import shutil
from PIL import Image, ImageOps

SCENES = os.path.join(os.path.dirname(__file__), "..", "public", "scenes")
BACKUP = os.path.join(SCENES, "_originals")

TARGET_RATIO = 4 / 5      # width / height  (portrait)
MAX_WIDTH = 1200
JPG_QUALITY = 88
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}

# Map casual file names -> the product slug used in src/data.js
ALIASES = {
    "boop": "boop", "boop stool": "boop", "stool": "boop",
    "lianlian": "lianlian", "lianlian lamp": "lianlian", "lamp": "lianlian",
    "forest": "forest", "forest side table": "forest", "side table": "forest", "table": "forest",
    "scratch": "scratch", "scratch vase": "scratch", "vase": "scratch",
}


def slugify(stem: str) -> str:
    key = stem.strip().lower()
    if key in ALIASES:
        return ALIASES[key]
    # fall back: keep letters/digits, collapse the rest
    return "".join(c if c.isalnum() else "" for c in key) or "image"


def crop_to_ratio(img: Image.Image, ratio: float) -> Image.Image:
    w, h = img.size
    cur = w / h
    if abs(cur - ratio) < 1e-3:
        return img
    if cur > ratio:                      # too wide -> trim width
        new_w = round(h * ratio)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    new_h = round(w / ratio)             # too tall -> trim height
    top = (h - new_h) // 2
    return img.crop((0, top, w, top + new_h))


def main():
    os.makedirs(BACKUP, exist_ok=True)
    files = [
        f for f in os.listdir(SCENES)
        if os.path.isfile(os.path.join(SCENES, f))
        and os.path.splitext(f)[1].lower() in EXTS
    ]
    if not files:
        print("No images found in public/scenes.")
        return

    for f in files:
        src = os.path.join(SCENES, f)
        stem, _ = os.path.splitext(f)
        slug = slugify(stem)
        out = os.path.join(SCENES, slug + ".jpg")

        # 1. back up original (don't clobber an existing backup)
        bak = os.path.join(BACKUP, f)
        if not os.path.exists(bak):
            shutil.copy2(src, bak)

        # 2-4. crop + resize + save
        img = Image.open(src)
        img = ImageOps.exif_transpose(img)        # respect phone rotation
        img = img.convert("RGB")
        before = img.size
        img = crop_to_ratio(img, TARGET_RATIO)
        if img.width > MAX_WIDTH:
            new_h = round(img.height * MAX_WIDTH / img.width)
            img = img.resize((MAX_WIDTH, new_h), Image.LANCZOS)
        img.save(out, "JPEG", quality=JPG_QUALITY, optimize=True)

        # remove the source if it was renamed to a different file
        if os.path.abspath(src) != os.path.abspath(out):
            os.remove(src)

        kb = os.path.getsize(out) // 1024
        print(f"{f}  ->  {slug}.jpg   {before} -> {img.size}   {kb} KB")

    print("\nDone. Originals backed up in public/scenes/_originals/")


if __name__ == "__main__":
    main()
