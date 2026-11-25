"""
Generates the example photos for the demo collection with Pollinations (free, no account).
The free tier allows one image every ~45 s, so this takes a few minutes.

    python scripts/demo-photos.py

Images go to public/demo/ (git-ignored). The bottom strip is cropped off because the
free tier stamps a small watermark there.
"""

import json
import pathlib
import time
import urllib.parse
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "demo"
PIECES = json.loads((ROOT / "src" / "app" / "(app)" / "demo" / "pieces.json").read_text(encoding="utf-8"))

STYLE = (
    "photorealistic catalog photograph of a highly detailed HO scale model railway miniature, "
    "on a short section of model track with ballast, neutral soft grey studio background, "
    "soft diffused light, sharp focus, 3/4 side view, no text, no people"
)


def fetch(prompt: str, seed: int) -> bytes:
    query = urllib.parse.urlencode({"width": 1280, "height": 960, "seed": seed, "nologo": "true"})
    url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}?{query}"
    with urllib.request.urlopen(url, timeout=180) as res:
        if not res.headers.get("Content-Type", "").startswith("image/"):
            raise RuntimeError(res.read()[:200])
        return res.read()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for piece in PIECES:
        target = OUT / f"{piece['slug']}.jpg"
        if target.exists():
            print("skip", target.name)
            continue
        for attempt in range(4):
            try:
                raw = OUT / "_raw.jpg"
                raw.write_bytes(fetch(f"{piece['prompt']}, {STYLE}", piece.get("seed", 7)))
                img = Image.open(raw).convert("RGB")
                w, h = img.size
                img.crop((0, 0, w, int(h * 0.92))).save(target, quality=90)
                raw.unlink()
                print("ok", target.name, img.size, flush=True)
                break
            except Exception as err:  # rate limit or a hiccup: wait and retry
                print("retry", piece["slug"], str(err)[:120], flush=True)
                time.sleep(50)
        time.sleep(48)


if __name__ == "__main__":
    main()
