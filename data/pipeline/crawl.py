#!/usr/bin/env python3
"""Phase crawler: find each college's admissions page, harvest exam evidence.

Run in batches so the work is incremental and re-runnable:

    ./.venv/bin/python crawl.py --limit 20
    ./.venv/bin/python crawl.py --limit 20 --region South

Every run is resumable: colleges already crawled are skipped, so you can stop
whenever and pick up later. Nothing it writes is ever published — rows land as
'extracted' and wait for a human.

Conduct: honours robots.txt, one request every 3s per host, real user agent,
and gives up on a college rather than hammering it.
"""
from __future__ import annotations

import argparse, re, sqlite3, sys, time, urllib.parse, urllib.robotparser, urllib.request
from datetime import date
from extract_exams import extract, EXAMS as EXAM_PATTERNS, UA

DB = "colleges.db"
DELAY = 3.0

# Paths worth trying when a college has no admissions URL yet.
GUESSES = ["/admissions", "/admission", "/admissions/", "/apply",
           "/mba/admissions", "/admission-process", "/eligibility"]

_robots: dict[str, urllib.robotparser.RobotFileParser] = {}


def allowed(url: str) -> bool:
    host = urllib.parse.urlsplit(url)
    base = f"{host.scheme}://{host.netloc}"
    if base not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(base + "/robots.txt")
        try:
            rp.read()
        except Exception:                                   # noqa: BLE001
            rp = None                                       # no robots -> allowed
        _robots[base] = rp
    rp = _robots[base]
    return True if rp is None else rp.can_fetch(UA, url)


def links_from(url: str, pattern: str, limit: int = 4) -> list[str]:
    """Links on `url` whose text or href matches `pattern`."""
    try:
        if not allowed(url):
            return []
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=45) as r:
            page = r.read().decode("utf-8", "ignore")
    except Exception:                                       # noqa: BLE001
        return []
    out, seen = [], set()
    for href, text in re.findall(r'href=["\']([^"\']+)["\'][^>]*>(.{0,140}?)</a>', page, re.S | re.I):
        label = re.sub(r"<[^>]+>", " ", text)
        if not re.search(pattern, label + " " + href, re.I):
            continue
        full = urllib.parse.urljoin(url, href.split("#")[0])
        if full in seen or not full.startswith("http"):
            continue
        seen.add(full)
        out.append(full)
        if len(out) >= limit:
            break
    return out


def find_admissions(site: str) -> str | None:
    """Prefer a real link on the homepage; fall back to common paths."""
    try:
        if not allowed(site):
            return None
        req = urllib.request.Request(site, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=45) as r:
            home = r.read().decode("utf-8", "ignore")
    except Exception:                                       # noqa: BLE001
        home = ""

    for href, text in re.findall(r'href=["\']([^"\']+)["\'][^>]*>(.{0,120}?)</a>', home, re.S | re.I):
        label = re.sub(r"<[^>]+>", " ", text)
        if re.search(r"admission|eligibilit|how to apply", label + " " + href, re.I):
            return urllib.parse.urljoin(site, href)

    for path in GUESSES:
        cand = urllib.parse.urljoin(site, path)
        try:
            if not allowed(cand):
                continue
            req = urllib.request.Request(cand, headers={"User-Agent": UA}, method="HEAD")
            with urllib.request.urlopen(req, timeout=25) as r:
                if r.status == 200:
                    return cand
        except Exception:                                   # noqa: BLE001
            continue
        time.sleep(DELAY)
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=10)
    ap.add_argument("--region", default=None)
    args = ap.parse_args()

    con = sqlite3.connect(DB)
    sql = ("SELECT id, name, website FROM college "
           "WHERE website IS NOT NULL AND website != '' AND last_crawled IS NULL")
    params: list = []
    if args.region:
        sql += " AND region = ?"
        params.append(args.region)
    sql += " ORDER BY name LIMIT ?"
    params.append(args.limit)

    todo = con.execute(sql, params).fetchall()
    if not todo:
        print("Nothing left to crawl for that filter.")
        return 0
    print(f"crawling {len(todo)} college(s)\n")

    new_rows = 0
    for cid, name, site in todo:
        print(f"  {name[:48]:50}", end=" ", flush=True)
        url = find_admissions(site)
        if not url:
            con.execute("UPDATE college SET last_crawled=date('now') WHERE id=?", (cid,))
            con.commit()
            print("no admissions page found")
            time.sleep(DELAY)
            continue
        # An /admissions landing page is usually marketing. The eligibility
        # criteria sit a level deeper, on the programme's own page — which is
        # exactly where Great Lakes states its four accepted exams. So crawl the
        # landing page AND the programme pages it links to.
        pages = [url] + links_from(url, r"mba|pgdm|pgpm|eligib|criteria|admission")
        hits: dict[str, str] = {}
        best_url = url
        for page_url in pages[:5]:
            try:
                found = extract(page_url)
            except Exception:                               # noqa: BLE001
                continue
            for exam, sentence in found.items():
                if exam not in hits or len(sentence) > len(hits[exam]):
                    hits[exam] = sentence
                    best_url = page_url
            time.sleep(DELAY)

        pid = f"{cid}-mba"
        con.execute("INSERT OR IGNORE INTO programme (id,college_id,name) VALUES (?,?,?)",
                    (pid, cid, "MBA/PGDM"))
        added = 0
        for exam, sentence in hits.items():
            cur = con.execute(
                """INSERT OR IGNORE INTO acceptance
                   (programme_id,exam_id,evidence,source_url,extracted_at,status)
                   VALUES (?,?,?,?,?, 'extracted')""",
                (pid, exam, sentence[:400], best_url, date.today().isoformat()))
            added += cur.rowcount
        con.execute("UPDATE college SET admissions_url=?, last_crawled=date('now') WHERE id=?", (url, cid))
        con.commit()
        new_rows += added
        print(f"{len(hits)} exam(s), {added} new")
        time.sleep(DELAY)

    left = con.execute("SELECT COUNT(*) FROM college WHERE last_crawled IS NULL AND website != ''").fetchone()[0]
    print(f"\n{new_rows} new rows to review. {left} college(s) still uncrawled.")
    con.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
