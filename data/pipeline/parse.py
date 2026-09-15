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

College codes are case-insensitive: KEA's 2025 files print some in lower case, and
an uppercase-only pattern files those rows under the previous college rather than
failing loudly. See the COLLEGE_2025 comment.
"""
import csv, json, pathlib, re, sys
from pypdf import PdfReader

HERE = pathlib.Path(__file__).resolve().parent
RAW, OUT = HERE.parent / "raw", HERE.parent / "normalised"

# College codes are matched case-insensitively and upper-cased on the way in.
# KEA's 2025 files print 86 of them in lower case ("College: c481", and 40 per
# MBA file). An [A-Z]-only pattern skips those lines, which does not drop the
# rows -- it silently files them under the PREVIOUS college, because `code` is
# still holding it. That is how C480 came to report four different GM closing
# ranks: three of them belonged to c481, c482 and c484.
COLLEGE_2025 = re.compile(r"^College:\s*([A-Za-z]\d{3,4})\b\s*(.*)$")
COLLEGE_2324 = re.compile(r"^\s*\d+\s+([A-Za-z]\d{3,4})\s+(.+)$")
HEADER_2025 = re.compile(r"^\s*Course\s+Name\s+(.*)$")
# Name the round properly. The 2025 banner reads "PGCET-2025 SECOND ROUND
# CUT-OFF RANKS FOR MCA", and a bare ROUND\s+\w+ match takes "ROUND CUT" from it.
ROUND_RE = re.compile(
    r"((?:FIRST|SECOND|THIRD|FOURTH|FINAL|EXTENDED|\d(?:ST|ND|RD|TH))\s+ROUND"
    r"|ROUND\s*-\s*\w+)", re.I)

# Page furniture. A line that is none of these, carries no rank columns, and
# follows a programme row is the tail of a wrapped programme name.
FURNITURE = re.compile(
    r"Generated on|KARNATAKA EXAMINATIONS|Non-Interactive|PGCET-|Seat Type|Page\s+\d", re.I)
CAT_TOKEN = re.compile(r"^(?:[123][ABC]?[GH]|GM|GMH|NKN|PH|SC[GH]|ST[GH]|XD|[123]H)$")
NA = {"--", "-", "—"}


def is_category_header(toks):
    """A header row is all category tokens and always contains the general merit column."""
    return len(toks) >= 3 and all(CAT_TOKEN.match(t) for t in toks) and any(
        t.startswith("GM") for t in toks)


def parse_pdf(path: pathlib.Path, year: str, course: str):
    reader = PdfReader(str(path))
    rows, code, name, cats, rnd = [], None, None, [], "unknown"
    pending: list[dict] = []   # rows of the last programme line, for name wraps

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
                pending = []
                continue
            if is_category_header(toks):
                cats = toks
                pending = []
                continue
            if m := (COLLEGE_2025.match(line.strip()) or COLLEGE_2324.match(line)):
                code = m.group(1).upper()
                name = re.sub(r"\s{2,}", " ", m.group(2)).strip()
                pending = []
                continue
            if not (code and cats):
                continue

            vals = toks[-len(cats):] if len(toks) > len(cats) else None
            if vals is None or not all(v in NA or v.isdigit() for v in vals):
                # Carries no rank columns. If a programme row came immediately
                # before, this is the rest of its name: KEA wraps a long one onto
                # its own line, and dropping that tail is what made two distinct
                # programmes at GM University (B086) collide under "MASTER OF
                # BUSINESS". 71 such lines in the 2025 files.
                if pending and not FURNITURE.search(line):
                    tail = re.sub(r"\s{2,}", " ", line.strip())
                    for r in pending:
                        r["programme"] = f'{r["programme"]} {tail}'.strip()
                    pending = []      # a name wraps once; do not keep absorbing
                continue
            prog = re.sub(r"\s{2,}", " ", " ".join(toks[: -len(cats)])).strip(" -")
            if not prog:
                continue
            pending = []
            for cat, v in zip(cats, vals):
                if v in NA:
                    continue
                rows.append({
                    "exam": "PGCET", "year": year, "course": course.upper(), "round": rnd,
                    "college_code": code, "college_name": name, "programme": prog,
                    "category": cat, "closing_rank": int(v), "source_pdf": path.name,
                })
                pending.append(rows[-1])
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
