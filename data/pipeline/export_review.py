#!/usr/bin/env python3
"""Export the review queue to CSV, weakest evidence flagged.

The reviewer's job is to read one sentence and set one column. Everything else on
the row exists to make that judgement fast.
"""
from __future__ import annotations
import csv, pathlib, re, sqlite3

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "review" / "acceptance-review.csv"

# Sentences that talk about colleges in general rather than THIS college. The
# ABBS page said "most institutions require scores from CAT, MAT, XAT or GMAT" —
# true of the sector, and evidence of nothing about ABBS.
GENERIC = re.compile(
    r"most (institutions|colleges|b-?schools)|colleges in india|top \d+|"
    r"various (colleges|institutes)|such as .*\bor equivalent\b.*\bcolleges\b|"
    r"across india|in general|typically require", re.I)
# Sentences that clearly bind the exam to this institution.
SPECIFIC = re.compile(
    r"\bwe\b|\bour\b|\bthey must\b|candidates? (must|should|are required)|"
    r"applicants? (must|should)|admission to (this|the) (programme|program|course)|"
    r"is required for admission|shortlist", re.I)


def confidence(evidence: str) -> str:
    # The exam body's own participating list outranks anything scraped from a
    # college's marketing pages.
    if evidence.startswith("Listed by AIMA"):
        return "HIGH-exam-body-list"
    if GENERIC.search(evidence):
        return "LOW-generic-sentence"
    if SPECIFIC.search(evidence):
        return "HIGH-names-this-college"
    return "MEDIUM"


def main() -> int:
    con = sqlite3.connect(HERE / "colleges.db")
    rows = con.execute("SELECT id, college, city, region, programme, exam, evidence, source_url "
                       "FROM v_review_queue").fetchall()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    scored = [(confidence(r[6]), *r) for r in rows]
    order = {"HIGH-exam-body-list": 0, "HIGH-names-this-college": 1, "MEDIUM": 2, "LOW-generic-sentence": 3}
    scored.sort(key=lambda t: (order[t[0]], t[2], t[6]))

    with OUT.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["row_id", "confidence", "college", "city", "region", "programme", "exam",
                    "DECISION_yes_no", "strength_primary_secondary_vacant", "cutoff_if_known",
                    "evidence_sentence", "source_url"])
        for conf, rid, college, city, region, prog, exam, ev, url in scored:
            w.writerow([rid, conf, college, city, region, prog, exam, "", "", "",
                        re.sub(r"\s+", " ", ev)[:300], url])

    counts: dict[str, int] = {}
    for c, *_ in scored:
        counts[c] = counts.get(c, 0) + 1
    print(f"{OUT}\n{len(scored)} rows to review")
    for k in ("HIGH-exam-body-list", "HIGH-names-this-college", "MEDIUM", "LOW-generic-sentence"):
        print(f"  {k:26} {counts.get(k, 0)}")
    con.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
