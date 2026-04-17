"""
remove-blot-bg.py
─────────────────
Converts the 3 Rorschach inkblot JPGs in public/blots/ to transparent PNGs.
Pixels brighter than WHITE_THRESHOLD become fully transparent.
Soft edge fade over SOFT brightness range.

Run from the repo root:
    python3 scripts/remove-blot-bg.py

Requires Pillow:  pip install Pillow
"""

from PIL import Image
import os
import sys

SRC_DIR = "public/blots"
OUT_DIR = "public/blots"
WHITE_THRESHOLD = 210
SOFT = 25


def process(i: int) -> None:
    src = os.path.join(SRC_DIR, f"blot-{i}.jpg")
    dst = os.path.join(OUT_DIR, f"blot-{i}.png")
    if not os.path.exists(src):
        print(f"MISSING: {src}")
        return
    img = Image.open(src).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, _a = pixels[x, y]
            brightness = (r + g + b) / 3
            if brightness >= WHITE_THRESHOLD:
                pixels[x, y] = (r, g, b, 0)
            elif brightness >= WHITE_THRESHOLD - SOFT:
                t = (brightness - (WHITE_THRESHOLD - SOFT)) / SOFT
                alpha = int(255 * (1 - t))
                pixels[x, y] = (r, g, b, alpha)
    img.save(dst, "PNG")
    print(f"wrote {dst}")


if __name__ == "__main__":
    for i in (1, 2, 3):
        process(i)
    print("done.")
