#!/usr/bin/env python3
"""Build the browser payload for the PGCET college predictor.

Scoped to 2023 and 2024, and keyed by programme rather than college.

Why not 2025, which is newer: KEA's 2025 PDFs split by course and seat type
(PROF_CODE_B_R_FIN) and carry the programme in a column that layout extraction
truncates. 95 keys there are ambiguous -- JSS (C480) alone reports four
different GM closing ranks under one programme label (1018, 15801, 7160, 2599),
because distinct programmes collapse to the same truncated string. 2023 and
2024 use the "MB - MBA" code scheme and resolve with zero ambiguity, and share
a scheme with each other so the two years genuinely join.

Why per programme and never per college: 391 of 496 colleges run more than one,
and the spread between them reaches 31,583 ranks. Collapsing with max() would
tell a rank-30,000 student B300 is reachable when its MBA programme closed at
3,683.
"""
import csv, json, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parent / "normalised" / "cutoffs.csv"
OUT = HERE.parent.parent / "tools" / "data" / "pgcet-cutoffs.json"
YEARS = ("2023", "2024")

def split_programme(raw: str) -> tuple[str, str]:
    """KEA prints 'MB - MBA'. Return its code and a display name.

    Some names arrive truncated at the column edge ('BD - MBA IN'); that is left
    as published rather than guessed at. The code is what disambiguates two
    programmes at one college, and is the same code KEA prints in option entry.
    """
    raw = re.sub(r"\s+", " ", raw).strip()
    m = re.match(r"^([A-Z]{2})\s*-\s*(.+)$", raw)
    code, name = (m.group(1), m.group(2)) if m else ("", raw)
    name = name.rstrip(".").replace("-", " ").strip()
    name = re.sub(r"\s+", " ", name).title()
    name = name.replace("Mba", "MBA").replace("Mca", "MCA")
    return code, name

def main() -> None:
    rows = [r for r in csv.DictReader(SRC.open()) if r["year"] in YEARS]
    colleges: dict[str, str] = {}
    progs: dict[str, dict] = {}
    ranks: dict[str, dict] = {}

    for r in rows:
        code = r["college_code"]
        if len(r["college_name"]) > len(colleges.get(code, "")):
            colleges[code] = re.sub(r"\s+", " ", r["college_name"]).strip()

        pcode, pname = split_programme(r["programme"])
        key = r["programme"]                       # raw label is the stable key
        progs.setdefault(key, {"code": pcode, "name": pname})

        slot = (ranks.setdefault(r["course"], {}).setdefault(code, {})
                     .setdefault(key, {}).setdefault(r["category"], {}))
        # 2023 published two rounds. Closing ranks RISE across rounds as stronger
        # candidates take seats elsewhere, so the last round is the most permissive
        # and is the honest answer to "could I have got a seat". Take max explicitly:
        # keying by year alone let file iteration order decide the winner.
        y = r["year"]
        slot[y] = max(slot.get(y, 0), int(r["closing_rank"]))

    payload = {
        "source": "Karnataka Examinations Authority (KEA), published PGCET cutoff PDFs",
        "years": list(YEARS),
        "colleges": colleges,
        "programmes": progs,
        "ranks": ranks,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":"), sort_keys=True))

    kb = OUT.stat().st_size / 1024
    print(f"{OUT.name}: {kb:.0f} KB | years {'+'.join(YEARS)}")
    for course, by_college in sorted(ranks.items()):
        combos = sum(len(p) for p in by_college.values())
        print(f"  {course}: {len(by_college)} colleges, {combos} college+programme")
    print(f"  {len(colleges)} colleges, {len(progs)} distinct programmes")

if __name__ == "__main__":
    main()
