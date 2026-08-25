#!/usr/bin/env python3
"""Download KEA PGCET cutoff PDFs into data/raw/.

Public government data. Rate limited to one request every 2s, identifies itself,
and caches to disk so re-parsing never re-hits the origin.
"""
import json, pathlib, sys, time, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
RAW = HERE.parent / "raw"
UA = "LearnCrewBot/0.1 (+https://learncrew.org/about)"
DELAY = 2.0


def fetch(url: str, dest: pathlib.Path) -> str:
    if dest.exists() and dest.stat().st_size > 0:
        return "cached"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read()
    if not body.startswith(b"%PDF"):
        return f"not-a-pdf ({len(body)}B)"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(body)
    time.sleep(DELAY)
    return f"ok {len(body)}B"


def main() -> int:
    src = json.loads((HERE / "sources.json").read_text())
    base, failures = src["base"], 0
    for year, cfg in src["years"].items():
        for course, files in cfg["files"].items():
            for fname in files:
                url = f"{base}/{cfg['dir']}/{fname}"
                dest = RAW / year / course / fname
                try:
                    status = fetch(url, dest)
                except Exception as e:                      # noqa: BLE001
                    status, failures = f"FAILED {e}", failures + 1
                print(f"{year}/{course}/{fname}: {status}")
    print(f"\n{failures} failure(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
