#!/usr/bin/env python3
"""Build the Karnataka half of the college -> exam route dataset from KEA cutoffs.

PGCET publishes closing RANKS, while CAT/MAT publish PERCENTILES, so a rank is
converted before the two can sit in the same ranking:

    percentile = (1 - rank / ranked_pool) * 100

`ranked_pool` is taken as the highest closing rank seen in the year's data, which
is the last rank that was actually allotted a seat. That is a derivation, not a
published figure, and it is labelled as such wherever it is shown.
"""
import json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parent.parent / "tools" / "data" / "pgcet-cutoffs.json"
OUT = HERE.parent.parent / "tools" / "data" / "colleges-karnataka.json"

# College names carry their postal address. Cut at the first address-looking token.
ADDR = re.compile(
    r"\s+(?:CA[- ]?\d|NO\.?\s*\d|#\d|POST BOX|P\.?B\.?\s*NO|SY\.?\s*NO|\d{1,4}(?:ST|ND|RD|TH)\s+(?:CROSS|MAIN)"
    r"|RING ROAD|OPP\b|NEAR\b|BEHIND\b|\d{6}\b).*$", re.I)

def clean(name: str) -> str:
    n = ADDR.sub("", name).strip(" ,.-")
    return re.sub(r"\s{2,}", " ", n).title()

def main() -> int:
    d = json.loads(SRC.read_text())
    out = []
    for course in ("MBA", "MCA"):
        by_college = d["ranks"].get(course, {})
        pool = max((v for c in by_college.values() for cat in c.values() for v in cat.values()), default=0)
        if not pool:
            continue
        for code, by_cat in by_college.items():
            gm = by_cat.get("GM") or {}
            year = next((y for y in ("2025", "2024", "2023") if y in gm), None)
            if not year:
                continue
            rank = gm[year]
            pct = round((1 - rank / pool) * 100, 1)
            out.append({
                "id": f"ka-{code.lower()}-{course.lower()}",
                "name": clean(d["colleges"].get(code, code)),
                "city": "Karnataka",
                "course": course,
                "routes": [{
                    "exam": "pgcet",
                    "cutoffPercentile": pct,
                    "cutoffLabel": f"Closing rank {rank:,} ({year} general merit)",
                    "strength": "primary",
                    "note": f"Derived percentile: rank {rank:,} of about {pool:,} ranked candidates.",
                }],
                "source": "https://cetonline.karnataka.gov.in/kea/",
                "collegeCode": code,
            })
    out.sort(key=lambda c: (c["course"], -c["routes"][0]["cutoffPercentile"]))
    OUT.write_text(json.dumps({"pool": "KEA PGCET published cutoffs", "colleges": out}, separators=(",", ":")))
    kb = OUT.stat().st_size / 1024
    mba = sum(1 for c in out if c["course"] == "MBA")
    print(f"{OUT.name}: {kb:.0f} KB | {len(out)} entries ({mba} MBA, {len(out)-mba} MCA)")
    print("\ntop MBA by derived percentile:")
    for c in [x for x in out if x["course"] == "MBA"][:6]:
        print(f"  {c['routes'][0]['cutoffPercentile']:>5} pct  {c['name'][:54]}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
