"""
Downloads the photos for the demo collection from Wikimedia Commons. They're real,
freely licensed photos of each train; the author and licence of every one are in
pieces.json and end up in the piece's notes, which is what the licences ask for.

    python scripts/demo-photos.py

Images go to public/demo/ (git-ignored), cropped to 4:3 around the train so it fills
the card, and at most 1600 px wide.
"""

import io
import json
import pathlib
import time
import urllib.parse
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "demo"
PIECES = json.loads((ROOT / "src" / "app" / "(app)" / "demo" / "pieces.json").read_text(encoding="utf-8"))
# Wikimedia asks scripts for a descriptive User-Agent.
HEADERS = {"User-Agent": "RailodexDemo/1.0 (https://github.com/AleixAj/railodex)"}
API = "https://commons.wikimedia.org/w/api.php"


def get(url: str) -> bytes:
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as res:
        return res.read()


def download(title: str) -> Image.Image:
    # Commons can hand out a resized copy, so we never pull the 20 MB originals.
    query = urllib.parse.urlencode(
        {"action": "query", "format": "json", "titles": title, "prop": "imageinfo", "iiprop": "url", "iiurlwidth": 2000}
    )
    info = next(iter(json.loads(get(f"{API}?{query}"))["query"]["pages"].values()))["imageinfo"][0]
    return Image.open(io.BytesIO(get(info.get("thumburl") or info["url"]))).convert("RGB")


def crop(img: Image.Image, cx: float, cy: float, wf: float) -> Image.Image:
    """4:3 crop centred on (cx, cy), wf of the width wide, kept inside the picture."""
    W, H = img.size
    w = min(W * wf, H * 4 / 3)
    h = w * 3 / 4
    x0 = min(max(cx * W - w / 2, 0), W - w)
    y0 = min(max(cy * H - h / 2, 0), H - h)
    out = img.crop((round(x0), round(y0), round(x0 + w), round(y0 + h)))
    return out.resize((1600, 1200), Image.LANCZOS) if out.width > 1600 else out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for piece in PIECES:
        main = piece["photo"]
        # The cover is <slug>.jpg; any extra photos for the gallery are <slug>-2.jpg, <slug>-3.jpg...
        photos = [(piece["slug"], main)] + [
            (f"{piece['slug']}-{n}", extra) for n, extra in enumerate(main.get("extra", []), start=2)
        ]
        for name, photo in photos:
            target = OUT / f"{name}.jpg"
            if target.exists():
                print("skip", target.name)
                continue
            crop(download(photo["file"]), *photo["crop"]).save(target, quality=90)
            print("ok", target.name, "-", photo["author"], photo["license"], flush=True)
            time.sleep(1)  # be gentle with the API


if __name__ == "__main__":
    main()
