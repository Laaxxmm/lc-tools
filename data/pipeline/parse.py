#!/usr/bin/env python3
"""Parse KEA PGCET cutoff PDFs into normalised rows.

Two layouts exist and both are handled:

2025 -- "College:" prefix, 9 categories, HK quota in a separate file:
    College: B018 CONSTITUENT COLEGE OF VTU, U B D T COLLEGE OF ENGINEERING
    Course Name 1G 2AG 2BG 3AG 3BG GM NKN SCG STG
    MASTERS IN BUSINESS ADMINISTRATION 26050 29024 -- -- 27257 30967 -- 29002 --

2023/2024 -- serial + code, 19 categories with the HK quota folded in:
      18   B018  CONSTITUENT COLLEGE OF VTU UBDT COLLEGE OF ENGG (HIGH FEE)  DAVANAGERE
                 1G   1H  2AG  2AH ... STH   XD
     MB  - MBA   --   --   --   -- ...  --   --

Both need extraction_mode="layout"; the default mode reads 2023/24 column-wise and
silently shreds every row. Categories are read from each block's header because the
set genuinely differs between years -- never hardcode them.
"""
import csv, json, pathlib, re, sys
from pypdf import PdfReader

HERE = pathlib.Path(__file__).resolve().parent
RAW, OUT = HERE.parent / "raw", HERE.parent / "normalised"

COLLEGE_2025 = re.compile(r"^College:\s*([A-Z]\d{3,4})\b\s*(.*)$")
COLLEGE_2324 = re.compile(r"^\s*\d+\s+([A-Z]\d{3,4})\s+(.+)$")
HEADER_2025 = re.compile(r"^\s*Course\s+Name\s+(.*)$")
ROUND_RE = re.compile(r"(ROUND\s*-?\s*\w+|FINAL\s+ROUND)", re.I)
CAT_TOKEN = re.compile(r"^(?:[123][ABC]?[GH]|GM|GMH|NKN|PH|SC[GH]|ST[GH]|XD|[123]H)$")
NA = {"--", "-", "—"}


def is_category_header(toks):
    """A header row is all category tokens and always contains the general merit column."""
    return len(toks) >= 3 and all(CAT_TOKEN.match(t) for t in toks) and any(
        t.startswith("GM") for t in toks)


def parse_pdf(path: pathlib.Path, year: str, course: str):
    reader = PdfReader(str(path))
    rows, code, name, cats, rnd = [], None, None, [], "unknown"

    for page in reader.pages:
        for raw_line in (page.extract_text(extraction_mode="layout") or "").splitlines():
            line = raw_line.rstrip()
            if not line.strip():
                continue
            if rnd == "unknown" and (m := ROUND_RE.search(line)) and "CUTOFF" in line.upper().replace("-", ""):
                rnd = m.group(1).upper().replace("  ", " ")

            toks = line.split()
            # 2025 prefixes its category header with "Course Name"; 2023/24 does not.
            if m := HEADER_2025.match(line):
                cats = m.group(1).split()
                continue
            if is_category_header(toks):
                cats = toks
                continue
            if m := (COLLEGE_2025.match(line.strip()) or COLLEGE_2324.match(line)):
                code, name = m.group(1), re.sub(r"\s{2,}", " ", m.group(2)).strip()
                continue
            if not (code and cats) or len(toks) <= len(cats):
                continue

            vals = toks[-len(cats):]
            if not all(v in NA or v.isdigit() for v in vals):
                continue
            prog = re.sub(r"\s{2,}", " ", " ".join(toks[: -len(cats)])).strip(" -")
            if not prog:
                continue
            for cat, v in zip(cats, vals):
                if v in NA:
                    continue
                rows.append({
                    "exam": "PGCET", "year": year, "course": course.upper(), "round": rnd,
                    "college_code": code, "college_name": name, "programme": prog,
                    "category": cat, "closing_rank": int(v), "source_pdf": path.name,
                })
    return rows


def main() -> int:
    all_rows = []
    for year_dir in sorted(p for p in RAW.iterdir() if p.is_dir()):
        for course_dir in sorted(p for p in year_dir.iterdir() if p.is_dir()):
            for pdf in sorted(course_dir.glob("*.pdf")):
                got = parse_pdf(pdf, year_dir.name, course_dir.name)
                print(f"{year_dir.name}/{course_dir.name}/{pdf.name}: {len(got)} rows")
                all_rows.extend(got)

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "cutoffs.json").write_text(json.dumps(all_rows, indent=1))
    with (OUT / "cutoffs.csv").open("w", newline="") as f:
        if all_rows:
            w = csv.DictWriter(f, fieldnames=list(all_rows[0]))
            w.writeheader(); w.writerows(all_rows)

    by_year = {}
    for r in all_rows:
        by_year.setdefault(r["year"], set()).add(r["college_code"])
    print(f"\nTOTAL {len(all_rows)} rows")
    for y in sorted(by_year):
        n = sum(1 for r in all_rows if r["year"] == y)
        print(f"  {y}: {n} rows, {len(by_year[y])} colleges")
    return 0 if all_rows else 1


if __name__ == "__main__":
    sys.exit(main())
