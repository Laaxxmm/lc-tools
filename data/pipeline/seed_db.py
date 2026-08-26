#!/usr/bin/env python3
"""Load everything already sourced into the working database.

Idempotent: safe to re-run after each crawl phase without duplicating rows.
"""
import json, pathlib, re, sqlite3

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE.parent.parent / "tools" / "data"
DB = HERE / "colleges.db"

EXAMS = [
    ("cat","CAT","IIM",1,"https://iimcat.ac.in/"),
    ("xat","XAT","XLRI",1,"https://xatonline.in/"),
    ("nmat","NMAT","GMAC",3,"https://www.nmat.org/"),
    ("snap","SNAP","Symbiosis",3,"https://snaptest.org/"),
    ("cmat","CMAT","NTA",1,"https://exams.nta.ac.in/CMAT/"),
    ("mat","MAT","AIMA",4,"https://mat.aima.in/"),
    ("atma","ATMA","AIMS",4,"https://www.atmaaims.com/"),
    ("gmat","GMAT","GMAC",5,"https://www.mba.com/exams/gmat"),
    ("pgcet","Karnataka PGCET","KEA",1,"https://cetonline.karnataka.gov.in/kea/"),
    ("kmat","KMAT Karnataka","KPPGCA",2,"https://kmatindia.com/"),
    ("mahcet","MAH CET","Maharashtra CET Cell",1,"https://cetcell.mahacet.org/"),
    ("tancet","TANCET","Anna University",1,"https://tancet.annauniv.edu/"),
    ("nimcet","NIMCET","NITs",1,"https://nimcet.admissions.nic.in/"),
]

def slug(s: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")[:60]

def main() -> int:
    con = sqlite3.connect(DB)
    con.executescript((HERE / "schema.sql").read_text())
    con.executemany("INSERT OR REPLACE INTO exam VALUES (?,?,?,?,?)", EXAMS)

    # --- AIMA: 141 institutes, region-tagged. Acceptance of MAT is sourced, so
    # it goes straight in as extracted evidence pointing at AIMA's own list. ---
    mat = json.loads((DATA / "mat-colleges.json").read_text())
    for c in mat["colleges"]:
        cid = f"mi-{c['miCode']}"
        con.execute(
            "INSERT OR IGNORE INTO college (id,name,city,region,website,mi_code,source) VALUES (?,?,?,?,?,?,?)",
            (cid, c["name"], c["city"], c["region"], c["site"], c["miCode"], mat["source"]))
        pid = f"{cid}-mba"
        con.execute("INSERT OR IGNORE INTO programme (id,college_id,name) VALUES (?,?,?)",
                    (pid, cid, "MBA/PGDM"))
        con.execute(
            """INSERT OR IGNORE INTO acceptance
               (programme_id,exam_id,evidence,source_url,extracted_at,status)
               VALUES (?,?,?,?,date('now'),'extracted')""",
            (pid, "mat", "Listed by AIMA as a MAT participating institute.", mat["source"]))

    # --- KEA: Karnataka colleges with real PGCET closing ranks. ---
    ka = json.loads((DATA / "colleges-karnataka.json").read_text())
    for c in ka["colleges"]:
        cid = f"ka-{c['collegeCode'].lower()}"
        con.execute(
            "INSERT OR IGNORE INTO college (id,name,city,state,region,source) VALUES (?,?,?,?,?,?)",
            (cid, c["name"], c["city"], "Karnataka", "South", c["source"]))
        pid = f"{cid}-{c['course'].lower()}"
        con.execute("INSERT OR IGNORE INTO programme (id,college_id,name) VALUES (?,?,?)",
                    (pid, cid, c["course"]))
        r = c["routes"][0]
        # PGCET is state counselling: it IS the intake route, so strength is known
        # without a human call, and these rows are confirmed on arrival.
        con.execute(
            """INSERT OR IGNORE INTO acceptance
               (programme_id,exam_id,strength,cutoff_label,cutoff_percentile,
                evidence,source_url,extracted_at,status,reviewed_by,reviewed_at)
               VALUES (?,?,'primary',?,?,?,?,date('now'),'confirmed','KEA published cutoff',date('now'))""",
            (pid, "pgcet", r["cutoffLabel"], r["cutoffPercentile"],
             "KEA publishes this closing rank for the college in its cutoff PDF.", c["source"]))

    con.commit()
    q = lambda s: con.execute(s).fetchone()[0]
    print(f"exams        {q('SELECT COUNT(*) FROM exam')}")
    print(f"colleges     {q('SELECT COUNT(*) FROM college')}")
    print(f"programmes   {q('SELECT COUNT(*) FROM programme')}")
    print(f"acceptances  {q('SELECT COUNT(*) FROM acceptance')}")
    print(f"  confirmed  {q(chr(39).join(['SELECT COUNT(*) FROM acceptance WHERE status=', 'confirmed', '']))}")
    print(f"  to review  {q(chr(39).join(['SELECT COUNT(*) FROM acceptance WHERE status=', 'extracted', '']))}")
    print(f"publishable  {q('SELECT COUNT(*) FROM v_publishable')}")
    con.close()
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
