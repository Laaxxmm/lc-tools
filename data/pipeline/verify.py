#!/usr/bin/env python3
"""Spot-check parsed rows against values read by eye from the source PDFs.

Guards the parser against silent shape drift: a layout change that shifts every
value one column left still produces a plausible row count, and only a known-value
assertion catches it.
"""
import json, pathlib, sys

ROWS = json.loads((pathlib.Path(__file__).parent.parent / "normalised" / "cutoffs.json").read_text())

# Read manually from the PDFs on 2026-08-26.
EXPECT = [
    # 2025 MBA, B018 (Course Name 1G 2AG 2BG 3AG 3BG GM NKN SCG STG)
    ("2025", "MBA", "B018", "1G", 26050),
    ("2025", "MBA", "B018", "2AG", 29024),
    ("2025", "MBA", "B018", "3BG", 27257),
    ("2025", "MBA", "B018", "GM", 30967),
    ("2025", "MBA", "B018", "SCG", 29002),
    # 2024 MBA, B019 (19 categories, HK folded in)
    ("2024", "MBA", "B019", "1G", 34867),
    ("2024", "MBA", "B019", "2AG", 29165),
    ("2024", "MBA", "B019", "3AG", 27448),
    ("2024", "MBA", "B019", "GM", 20604),
    ("2024", "MBA", "B019", "GMH", 32068),
    ("2024", "MBA", "B019", "STG", 30851),
    # 2024 MBA, B020
    ("2024", "MBA", "B020", "3BG", 15369),
    ("2024", "MBA", "B020", "GM", 14948),
]

def main() -> int:
    idx = {}
    for r in ROWS:
        idx.setdefault((r["year"], r["course"], r["college_code"], r["category"]), set()).add(r["closing_rank"])

    bad = 0
    for year, course, code, cat, want in EXPECT:
        got = idx.get((year, course, code, cat))
        ok = got is not None and want in got
        if not ok:
            bad += 1
        print(f"{'PASS' if ok else 'FAIL'}  {year} {course} {code} {cat} = {want}"
              + ("" if ok else f"   got {sorted(got) if got else 'MISSING'}"))

    # B018 must not carry a rank for a category the PDF marks "--".
    absent = idx.get(("2025", "MBA", "B018", "3AG"))
    print(f"{'PASS' if not absent else 'FAIL'}  2025 MBA B018 3AG correctly absent (PDF shows --)")
    if absent:
        bad += 1

    # Multi-round years must resolve to the LAST round. 2023 MBA published r1 and r2;
    # B051 GM closed at 28834 in r1 and 42669 in r2. Taking r1 would tell a student
    # with rank 40000 they had no chance at a seat they would comfortably have got.
    app = pathlib.Path(__file__).parent.parent.parent / "tools" / "data" / "pgcet-cutoffs.json"
    if app.exists():
        got = json.loads(app.read_text())["ranks"]["MBA"]["B051"]["GM"]["2023"]
        ok = got == 42669
        print(f"{'PASS' if ok else 'FAIL'}  app data: 2023 MBA B051 GM resolves to last round (42669), got {got}")
        if not ok:
            bad += 1

    print(f"\n{bad} failed")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
