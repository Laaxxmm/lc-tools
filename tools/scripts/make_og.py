#!/usr/bin/env python3
"""Render a tool's Open Graph card in the Learn Crew house style.

    python3 tools/scripts/make_og.py <slug> <eyebrow> <title> <subtitle>

1200x630 on the forest ground, amber rule down the left edge, Poppins throughout.
Matches the six cards already in tools/public/og/ so a shared link never gives
away which tool shipped first. Poppins is fetched once into a local cache; the
fonts are not committed.
"""
import pathlib, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
FOREST, AMBER, CREAM = (14, 59, 46), (232, 163, 61), (250, 247, 242)
SUB = (183, 201, 192)          # cream dimmed, for body copy on the dark ground
FOOT = (122, 148, 136)

HERE = pathlib.Path(__file__).resolve().parent
CACHE = HERE / ".fonts"
OUT = HERE.parent / "public" / "og"
FONTS = {
    "Poppins-SemiBold.ttf": "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6V1s.ttf",
    "Poppins-Bold.ttf":     "https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7V1s.ttf",
    "Poppins-ExtraBold.ttf":"https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLDD4V1s.ttf",
}

def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    CACHE.mkdir(exist_ok=True)
    path = CACHE / name
    if not path.exists():
        req = urllib.request.Request(FONTS[name], headers={"User-Agent": "Mozilla/5.0"})
        path.write_bytes(urllib.request.urlopen(req, timeout=30).read())
    return ImageFont.truetype(str(path), size)

def tracked(draw, xy, text, fnt, fill, extra):
    """Letter-spaced text. Pillow has no tracking, so step glyph by glyph."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + extra
    return x

def wrap(draw, text, fnt, width):
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if draw.textlength(trial, font=fnt) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines

def main() -> None:
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    slug, eyebrow, title, subtitle = sys.argv[1:5]

    img = Image.new("RGB", (W, H), FOREST)
    # Two soft discs, lighter than the ground, for depth. Drawn on their own layer
    # so they blend rather than sit on top as flat shapes.
    glow = Image.new("RGB", (W, H), FOREST)
    gd = ImageDraw.Draw(glow)
    gd.ellipse((640, -170, 1330, 520), fill=(22, 74, 58))
    gd.ellipse((545, 470, 1195, 1120), fill=(19, 67, 52))
    img = Image.blend(img, glow, 0.85)

    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 11, H), fill=AMBER)          # left rule

    x = 80
    tracked(d, (x, 100), eyebrow.upper(), font("Poppins-Bold.ttf", 23), AMBER, 4.5)

    f_title = font("Poppins-ExtraBold.ttf", 72)
    y = 145
    for line in wrap(d, title, f_title, 560)[:3]:
        d.text((x, y), line, font=f_title, fill=CREAM)
        y += 82

    f_sub = font("Poppins-SemiBold.ttf", 30)
    y = max(y + 22, 318)
    for line in wrap(d, subtitle, f_sub, 560)[:2]:
        d.text((x, y), line, font=f_sub, fill=SUB)
        y += 38

    tracked(d, (x, 552), "LEARN CREW", font("Poppins-Bold.ttf", 20), FOOT, 5)
    f_foot = font("Poppins-Bold.ttf", 24)
    tail = "Free · learncrew.org/tools"
    d.text((W - 80 - d.textlength(tail, font=f_foot), 550), tail, font=f_foot, fill=AMBER)

    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{slug}.png"
    img.save(dest, "PNG", optimize=True)
    print(f"{dest.relative_to(HERE.parent.parent)}  {dest.stat().st_size // 1024} KB")

if __name__ == "__main__":
    main()
