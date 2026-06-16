"""Process /public/products — transparent product cut-outs for the collection.

For every NON-png image in public/products it:
  1. backs up the untouched original into public/products/_originals/
  2. removes the background with rembg (-> transparent)
  3. crops to the subject, pads to a centered 1:1 square (with margin)
  4. saves as <slug>.png (transparent, square)

Already-processed .png files and README are skipped.

Run:  python tools/process_products.py
"""
import os
import io
import shutil
from PIL import Image
from rembg import remove, new_session

PRODUCTS = os.path.join(os.path.dirname(__file__), "..", "public", "products")
BACKUP = os.path.join(PRODUCTS, "_originals")

SUBJECT_FRAC = 0.86   # subject fills this fraction of the square (rest = margin)
MAX_SIZE = 1000
SRC_EXTS = {".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}

session = new_session("u2net")


def slugify(stem: str) -> str:
    out = "".join(c if c.isalnum() else "-" for c in stem.strip().lower())
    while "--" in out:
        out = out.replace("--", "-")
    return out.strip("-") or "image"


def square_pad(img: Image.Image) -> Image.Image:
    """Crop to the alpha bounding box, then center on a transparent square."""
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    w, h = img.size
    side = round(max(w, h) / SUBJECT_FRAC)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - w) // 2, (side - h) // 2), img)
    if side > MAX_SIZE:
        canvas = canvas.resize((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
    return canvas


def main():
    os.makedirs(BACKUP, exist_ok=True)
    files = [
        f for f in os.listdir(PRODUCTS)
        if os.path.isfile(os.path.join(PRODUCTS, f))
        and os.path.splitext(f)[1].lower() in SRC_EXTS
    ]
    if not files:
        print("No source images to process in public/products.")
        return

    for f in files:
        src = os.path.join(PRODUCTS, f)
        slug = slugify(os.path.splitext(f)[0])
        out = os.path.join(PRODUCTS, slug + ".png")

        bak = os.path.join(BACKUP, f)
        if not os.path.exists(bak):
            shutil.copy2(src, bak)

        with open(src, "rb") as fh:
            cut = remove(fh.read(), session=session)        # bytes -> bytes (RGBA PNG)
        img = Image.open(io.BytesIO(cut)).convert("RGBA")
        img = square_pad(img)
        img.save(out, "PNG", optimize=True)

        if os.path.abspath(src) != os.path.abspath(out):
            os.remove(src)

        kb = os.path.getsize(out) // 1024
        print(f"{f}  ->  {slug}.png   {img.size}   {kb} KB")

    print("\nDone. Originals backed up in public/products/_originals/")


if __name__ == "__main__":
    main()
