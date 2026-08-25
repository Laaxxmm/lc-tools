#!/usr/bin/env python3
"""Scan a KEA year page for cutoff PDFs and report candidates.

KEA changes its filename scheme every year and labels the links in Kannada, so the
URLs cannot be predicted and an English keyword scan misses them. This finds the
candidates; a human confirms them into sources.json. Deliberately does NOT auto-ingest
-- silently absorbing a mislabelled file would poison the predictor.

Usage:  ./.venv/bin/python discover.py pgcet2026
"""
import re, sys, urllib.request

BASE = "https://cetonline.karnataka.gov.in/kea"
UA = "LearnCrewBot/0.1 (+https://learncrew.org/about)"

# "ಕಟ್-ಆಫ್" / "ಕಟ್ ಆಫ್" is Kannada for "cut-off". KEA labels these links in Kannada,
# which is exactly why an English-only scan concludes the data does not exist.
LABEL_HINTS = re.compile(r"ಕಟ್\s*-?\s*ಆಫ್|cut\s*-?\s*off", re.I)
PATH_HINTS = re.compile(r"cutoff|cut_off|PROF_CODE", re.I)
ANCHOR = re.compile(r"<a[^>]+href=['\"]([^'\"]+\.pdf)['\"][^>]*>(.*?)</a>", re.I | re.S)
COURSE = [("mba", re.compile(r"\bmba\b|ಎಂಬಿಎ|_B_|_b_", re.I)),
          ("mca", re.compile(r"\bmca\b|ಎಂಸಿಎ|_C_|_c_", re.I))]


def main(year_path: str) -> int:
    url = f"{BASE}/{year_path}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        html = r.read().decode("utf-8", "ignore")

    seen, hits = set(), []
    for href, label in ANCHOR.findall(html):
        text = re.sub(r"<[^>]+>", " ", label).strip()
        if not (LABEL_HINTS.search(text) or PATH_HINTS.search(href)):
            continue
        if href in seen:
            continue
        seen.add(href)
        course = next((c for c, rx in COURSE if rx.search(href) or rx.search(text)), "?")
        mock = bool(re.search(r"mock", href, re.I))
        hits.append((course, href, re.sub(r"\s+", " ", text)[:60], mock))

    if not hits:
        print(f"No cutoff candidates on {url}.")
        print("If counselling has not run yet, no cutoffs exist — this is expected.")
        return 1

    print(f"{len(hits)} candidate(s) on {url}:\n")
    for course, href, text, mock in sorted(hits):
        flag = "  <-- MOCK ROUND, DO NOT INGEST" if mock else ""
        print(f"  [{course}] {href}{flag}\n        label: {text}")
    if any(h[3] for h in hits):
        print("\nWARNING: mock-round files present. A mock allotment is a practice run,")
        print("not a real cutoff. Ingesting one would corrupt every prediction.")
    print("\nConfirm each opens the right course/round, then add to sources.json.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "pgcet2026"))
