#!/usr/bin/env python3
"""Pull exam-acceptance EVIDENCE off a college admissions page.

Deliberately does not decide anything. It finds where an exam is named and hands
back the sentence around it, so a human can judge in seconds without opening the
site. A bare regex hit is not evidence: "CAT" appears inside "certificate", in
nav bars, and in unrelated boilerplate.

What it cannot know, ever, and what the reviewer must supply:
  - whether the college actually fills seats through that exam, or only mops up
  - the cutoff, which most colleges do not publish at all
"""
import html as htmllib
import re
import sys
import urllib.request

UA = "LearnCrewBot/0.1 (+https://learncrew.org/about)"

# Word-boundary patterns. GMAT before MAT, or "GMAT" reports a MAT hit.
EXAMS = [
    ("gmat",   r"\bGMAT\b"),
    ("cmat",   r"\bCMAT\b"),
    ("nmat",   r"\bNMAT\b"),
    ("xat",    r"\bXAT\b"),
    ("cat",    r"\bCAT\b"),
    ("mat",    r"(?<![GCN])\bMAT\b"),
    ("snap",   r"\bSNAP\b"),
    ("atma",   r"\bATMA\b"),
    ("pgcet",  r"\bPGCET\b|\bKarnataka\s+PGCET\b"),
    ("mahcet", r"\bMAH[\s-]?CET\b|\bMBA\s?CET\b"),
    ("kmat",   r"\bKMAT\b"),
    ("tancet", r"\bTANCET\b"),
    ("nimcet", r"\bNIMCET\b"),
]

# Words that mean the sentence is about admission, not decoration.
ADMISSION_HINT = re.compile(
    r"score|percentile|cut[\s-]?off|eligib|admis|accept|valid|shortlist|qualif|entrance", re.I)


def visible_text(page: str) -> str:
    page = re.sub(r"<(script|style|noscript)[^>]*>.*?</\1>", " ", page, flags=re.S | re.I)
    page = re.sub(r"<[^>]+>", " ", page)
    page = htmllib.unescape(page)
    return re.sub(r"[ \t\xa0]+", " ", page)


def sentences(text: str):
    for chunk in re.split(r"(?<=[.!?])\s+|\n{2,}", text):
        c = re.sub(r"\s+", " ", chunk).strip()
        if 20 <= len(c) <= 420:
            yield c


def extract(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        page = r.read().decode("utf-8", "ignore")
    text = visible_text(page)

    found = {}
    for sent in sentences(text):
        if not ADMISSION_HINT.search(sent):
            continue
        for exam, pat in EXAMS:
            if re.search(pat, sent):
                # Keep the most informative sentence per exam.
                if exam not in found or len(sent) > len(found[exam]):
                    found[exam] = sent
    return found


if __name__ == "__main__":
    url = sys.argv[1]
    hits = extract(url)
    print(f"{url}\n{len(hits)} exam(s) with evidence:\n")
    for exam, sent in sorted(hits.items()):
        print(f"  [{exam.upper()}]")
        print(f"     {sent[:250]}\n")
