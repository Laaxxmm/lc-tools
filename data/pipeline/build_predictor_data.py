#!/usr/bin/env python3
"""Build the browser payload for the PGCET college predictor.

Uses 2025, KEA's most recent published cutoffs (second round). Earlier builds of
this file avoided 2025 because 95 of its keys were ambiguous -- that turned out
to be two parser faults, not a limit of the source: lower-case college codes
("College: c481") fell through an [A-Z]-only pattern and were filed under the
previous college, and wrapped programme names lost their second line. Both are
fixed in parse.py and 2025 now resolves to a single ambiguous key out of 2,526
rows, where KEA itself printed two identically named rows at B360.

Keyed by programme, never collapsed to the college: most colleges run several
and the spread between them reaches tens of thousands of ranks.

City is recovered from the college name (see cities.py) and is best-effort --
KEA publishes no usable district column. Unresolved colleges carry no city and
the UI shows them under "Not stated" rather than guessing.
"""
import csv, json, pathlib, re, sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from cities import city_of                                    # noqa: E402

SRC = HERE.parent / "normalised" / "cutoffs.csv"
OUT_DIR = HERE.parent.parent / "tools" / "data"
# Two payloads, one per predictor. M.Tech is a separate tool with a separate
# audience -- shipping its 1,249 category slots to someone converting a CGPA for
# an MBA seat costs them bytes for data they will never open.
BUNDLES = {
    "pgcet-cutoffs.json": ("MBA", "MCA"),
    "pgcet-mtech-cutoffs.json": ("MTECH",),
}
YEAR = "2025"
# KEA publishes a cut-off table per round. Both are carried: round 2 is what a
# late entrant (a non-Karnataka candidate, or anyone who did not take a round-1
# seat) is actually choosing from, and round 1 is the context that makes a
# round-2 number readable.
ROUNDS = {"FIRST ROUND": "r1", "SECOND ROUND": "r2"}

def clean_programme(raw: str) -> str:
    """KEA's own label, tidied for display.

    M.Tech names are real specialisations (STRUCTURAL ENGINEERING, VLSI DESIGN
    AND EMBEDDED SYSTEMS) rather than one course per college, which is why the
    programme is the key: a single college runs up to 21 of them and each has
    its own closing rank.
    """
    p = re.sub(r"\s+", " ", raw).strip()
    p = re.sub(r"\s*\(\s*", " (", p)
    p = p.title()
    for wrong, right in (("Mba", "MBA"), ("Mca", "MCA"), ("(Ai", "(AI"), ("Ml", "ML"),
                         ("It", "IT"), ("Hr", "HR"), ("Vlsi", "VLSI"),
                         ("Cad", "CAD"), ("Cam", "CAM"), ("Vhdl", "VHDL")):
        p = p.replace(wrong, right)
    return p

def main() -> None:
    rows = [r for r in csv.DictReader(SRC.open())
            if r["year"] == YEAR and r["round"] in ROUNDS]
    if not rows:
        raise SystemExit(f"no {YEAR} rows in {SRC}")

    # City is decided per college from the longest name seen in ANY year: the
    # 2025 names are clean institution names and usually drop the address that
    # carries the city, while 2023/24 keep it.
    names_all = {}
    for r in csv.DictReader(SRC.open()):
        c = r["college_code"]
        if len(r["college_name"]) > len(names_all.get(c, "")):
            names_all[c] = r["college_name"]

    # Direct resolution first, from the longest name seen in any year.
    direct = {code: (city_of(name) or "") for code, name in names_all.items()}

    # Then inherit. M.Tech colleges carry T-codes that appear only in the 2025
    # M.Tech files, whose names are clean institution names with no address -- so
    # only 4 of 123 resolve directly. But most of those colleges also run an MBA
    # under a B-code whose name DOES carry the address, and the M.Tech name is a
    # prefix of it ("BMS COLLEGE OF ENGINEERING" vs the same plus a postal
    # address). Matching that way recovers 61 more. The length floor keeps a
    # short name from prefixing its way onto the wrong institution.
    def squash(n: str) -> str:
        return " ".join(re.sub(r"[^A-Z0-9]+", " ", n.upper()).split())

    donors = [(squash(names_all[c]), v) for c, v in direct.items() if v]
    for code, city in direct.items():
        if city:
            continue
        key = squash(names_all.get(code, ""))
        if len(key) < 12:
            continue
        direct[code] = next((v for dn, v in donors if dn.startswith(key)), "")

    colleges, ranks = {}, {}
    for r in rows:
        code = r["college_code"]
        if code not in colleges:
            colleges[code] = {
                "name": re.sub(r"\s+", " ", r["college_name"]).strip(),
                "city": direct.get(code, ""),
            }
        rnd = ROUNDS.get(r["round"])
        if rnd is None:
            continue                       # mock allotment and anything unlabelled
        prog = clean_programme(r["programme"])
        slot = (ranks.setdefault(r["course"], {}).setdefault(code, {})
                     .setdefault(prog, {}).setdefault(r["category"], {}))
        # Where KEA printed two identical rows (B360) the most permissive number
        # is the honest answer to "could I have got a seat".
        slot[rnd] = max(slot.get(rnd, 0), int(r["closing_rank"]))

    cities = sorted({c["city"] for c in colleges.values() if c["city"]})
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, courses in BUNDLES.items():
        mine = {c: v for c, v in ranks.items() if c in courses}
        used = {code for by_college in mine.values() for code in by_college}
        sub_colleges = {c: v for c, v in colleges.items() if c in used}
        sub_cities = sorted({c["city"] for c in sub_colleges.values() if c["city"]})
        payload = {
            "source": "Karnataka Examinations Authority (KEA), published PGCET cutoff PDFs",
            "year": YEAR,
            "rounds": list(ROUNDS.values()),
            "cities": sub_cities,
            "colleges": sub_colleges,
            "ranks": mine,
        }
        dest = OUT_DIR / name
        dest.write_text(json.dumps(payload, separators=(",", ":"), sort_keys=True))

        placed = sum(1 for c in sub_colleges.values() if c["city"])
        print(f"{name}: {dest.stat().st_size / 1024:.0f} KB | {YEAR} rounds 1 and 2")
        for course, by_college in sorted(mine.items()):
            combos = sum(len(p) for p in by_college.values())
            slots = [c for p in by_college.values() for prog in p.values() for c in prog.values()]
            r2 = sum(1 for c in slots if "r2" in c)
            print(f"  {course}: {len(by_college)} colleges, {combos} college+programme, "
                  f"{len(slots)} category slots ({r2} allotted in round 2)")
        print(f"  {len(sub_colleges)} colleges, {placed} with a city "
              f"({100 * placed // max(len(sub_colleges), 1)}%), {len(sub_cities)} cities")

if __name__ == "__main__":
    main()
