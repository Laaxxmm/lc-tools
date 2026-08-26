# College → programme → exam pipeline

Builds the relational dataset behind the "which exam gets me into this college,
and which route is softest" tool. Designed to be run in phases: every stage is
resumable and nothing is published without a human decision.

## Why a database and not a spreadsheet

The relation is genuinely three-deep. Acceptance belongs to a **programme**, not
a college: Great Lakes PGPM takes CAT/XAT/GMAT/NMAT and wants 2+ years of work
experience, while freshers are pushed to PGDM under different rules. Flatten that
to `college → exam` and you lose the part a student needs.

SQLite is the store. CSV is the review format. JSON is what ships.

## Phases

| # | Command | What it does |
|---|---|---|
| 1 | `python seed_db.py` | Load AIMA's 141 MAT institutes and KEA's 496 Karnataka entries |
| 2 | `python crawl.py --limit 20 --region South` | Find each college's admissions page, harvest evidence |
| 3 | `python export_review.py` | Write the review CSV, weakest evidence flagged |
| 4 | *(human)* | Fill `DECISION_yes_no` and `strength_...` |
| 5 | `python import_review.py` | Fold decisions back in; only these ship |

Re-run 2 and 3 as often as you like. Crawled colleges are skipped, so the work
accumulates instead of restarting.

## The crawler gathers evidence; it never decides

A regex hit is not proof. From one real run:

- **AIMS IBS** — *"They must also have appeared for any national-level management
  entrance test such as CAT, MAT, XAT, CMAT, KMAT, PGCET."* → about this college.
- **ABBS** — *"Additionally, most institutions require scores from entrance exams
  such as CAT, MAT, XAT, or GMAT."* → a generic sentence on a blog page. True of
  the sector, evidence of nothing.

Both produce the same regex hits. Only the sentence separates them, which is why
every row carries the sentence and a confidence flag, and why nothing publishes
itself.

## What no crawler can ever supply

- **Route strength** — does the college actually fill seats through this exam, or
  only mop up leftovers? No public page says this. It decides whether the answer
  helps or misleads, and it is the reviewer's call.
- **Cutoffs** — most colleges never publish them.

## Conduct

Honours `robots.txt`, one request every 3s per host, identifies itself, caches,
and abandons a college rather than hammering it.
