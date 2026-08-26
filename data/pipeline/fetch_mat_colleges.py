#!/usr/bin/env python3
"""Extract MAT-accepting institutes from AIMA's own participating B-schools page.

AIMA conducts MAT, so this is the exam body's own list — not an aggregator's.
Each institute arrives with its MI code, name, website and city, grouped into
AIMA's four regions.

The page is Elementor tabs with no headings, so the region labels are read from
the tab strip's declared order (--n-tabs-title-order) and matched to the tables
in document order. That ordering is verified against the cities before anything
is written: an East table full of Bengaluru colleges means AIMA changed the
layout and the run aborts rather than mislabelling 141 institutes.
"""
import json, pathlib, re, sys, urllib.request

URL = "https://aima.in/mat/participating-b-schools/"
UA = "LearnCrewBot/0.1 (+https://learncrew.org/about)"
OUT = pathlib.Path(__file__).resolve().parent.parent.parent / "tools" / "data" / "mat-colleges.json"

# A city that unambiguously belongs to each region, used only to sanity-check the
# tab-order mapping — never to assign the region itself.
SENTINEL = {
    "East": ("kolkata", "bhubaneswar", "patna", "guwahati", "ranchi"),
    "West": ("mumbai", "pune", "ahmedabad", "nagpur", "indore", "goa"),
    "North": ("delhi", "noida", "gurugram", "gurgaon", "jaipur", "lucknow", "chandigarh"),
    "South": ("bengaluru", "bangalore", "chennai", "hyderabad", "kochi", "coimbatore"),
}


def clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    for a, b in (("&amp;", "&"), ("&nbsp;", " "), ("&#8211;", "–"),
                 ("&#039;", "'"), ("&quot;", '"'), ("&#8217;", "’")):
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s).strip()


def main() -> int:
    req = urllib.request.Request(URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        html = r.read().decode("utf-8", "ignore")

    # Region order, straight from the tab strip. The label sits in a nested
    # span, and the strip is rendered twice (desktop and mobile), so dedupe.
    tabs = re.findall(
        r"--n-tabs-title-order:\s*(\d+);.*?e-n-tab-title-text[^>]*>\s*([A-Za-z]+)",
        html, re.S)
    seen: dict[int, str] = {}
    for order, name in tabs:
        seen.setdefault(int(order), name)
    regions = [seen[k] for k in sorted(seen)]
    if len(regions) != 4:
        print(f"Expected 4 region tabs, found {regions}. Aborting.", file=sys.stderr)
        return 1

    tables = re.findall(r"<table.*?</table>", html, re.S | re.I)
    if len(tables) != len(regions):
        print(f"{len(tables)} tables vs {len(regions)} regions. Layout changed; aborting.", file=sys.stderr)
        return 1

    out, problems = [], []
    for region, table in zip(regions, tables):
        rows = re.findall(r"<tr.*?</tr>", table, re.S | re.I)
        cities = []
        for row in rows:
            cells = [clean(c) for c in re.findall(r"<t[dh].*?</t[dh]>", row, re.S | re.I)]
            if len(cells) < 4 or cells[0].lower() in ("mi code", ""):
                continue
            code, name, site, city = cells[0], cells[1], cells[2], cells[3]
            if not re.fullmatch(r"\d{3,5}", code):
                continue
            if site and not site.startswith("http"):
                site = "https://" + site.lstrip("/")
            cities.append(city.lower())
            out.append({"miCode": code, "name": name, "site": site, "city": city, "region": region})

        # Does this table actually look like the region the tab order claims?
        hits = sum(1 for c in cities if any(s in c for s in SENTINEL.get(region, ())))
        if cities and hits / len(cities) < 0.25:
            problems.append(f"{region}: only {hits}/{len(cities)} cities match that region")

    if problems:
        print("Region mapping failed its sanity check — AIMA has changed the layout:", file=sys.stderr)
        for p in problems:
            print("  " + p, file=sys.stderr)
        return 1

    OUT.write_text(json.dumps({
        "source": URL,
        "exam": "mat",
        "note": "AIMA's own list of institutes accepting MAT. Acceptance only — AIMA does not publish per-institute cutoffs.",
        "colleges": out,
    }, separators=(",", ":")))

    by_region: dict[str, int] = {}
    for c in out:
        by_region[c["region"]] = by_region.get(c["region"], 0) + 1
    print(f"{OUT.name}: {OUT.stat().st_size/1024:.0f} KB | {len(out)} institutes")
    for r in regions:
        print(f"  {r:6} {by_region.get(r, 0)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
