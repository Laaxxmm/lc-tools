#!/usr/bin/env python3
"""Compact the normalised cutoffs into a payload small enough to ship to a browser.

The verbose JSON repeats college names on every row. Here names are deduped into a
lookup and ranks become nested arrays, which is what makes a client-side predictor
viable on a static site with no backend.
"""
import json, pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROWS = json.loads((HERE.parent / "normalised" / "cutoffs.json").read_text())
OUT = HERE.parent.parent / "tools" / "data"

def main():
    colleges, ranks = {}, {}
    for r in ROWS:
        code = r["college_code"]
        # Names drift slightly between years; keep the longest as canonical.
        if len(r["college_name"]) > len(colleges.get(code, "")):
            colleges[code] = r["college_name"]
        ranks.setdefault(r["course"], {}).setdefault(code, {}) \
             .setdefault(r["category"], {})[r["year"]] = r["closing_rank"]

    payload = {
        "source": "Karnataka Examinations Authority (KEA), official cutoff PDFs",
        "years": sorted({r["year"] for r in ROWS}),
        "colleges": colleges,
        "ranks": ranks,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / "pgcet-cutoffs.json"
    dest.write_text(json.dumps(payload, separators=(",", ":")))
    kb = dest.stat().st_size / 1024
    print(f"{dest.name}: {kb:.0f} KB | {len(colleges)} colleges | "
          f"courses {list(ranks)} | years {payload['years']}")

if __name__ == "__main__":
    main()
