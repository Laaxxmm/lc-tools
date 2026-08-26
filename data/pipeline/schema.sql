-- Working database for the college -> programme -> exam relation.
--
-- SQLite, not CSV, because this is genuinely relational and built up over many
-- runs: one college has several programmes, one programme accepts several exams,
-- and each fact needs its own provenance and review state. CSV is the human
-- review format and JSON is the shipping format; neither is the store.
--
-- The central rule: nothing reaches the site until a human has moved a row from
-- 'extracted' to 'confirmed'.

CREATE TABLE IF NOT EXISTS exam (
  id                TEXT PRIMARY KEY,          -- cat, mat, xat, ...
  name              TEXT NOT NULL,
  body              TEXT,                      -- IIM, AIMA, XLRI, NTA, KEA
  attempts_per_year INTEGER NOT NULL DEFAULT 1,
  site              TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS college (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  city           TEXT,
  state          TEXT,
  region         TEXT,                         -- AIMA's East/West/North/South
  website        TEXT,
  admissions_url TEXT,                         -- found in the discovery phase
  mi_code        TEXT,                         -- AIMA institute code, where known
  source         TEXT NOT NULL,                -- where this college came from
  last_crawled   TEXT
);

-- Acceptance varies BY PROGRAMME, not by college. Great Lakes PGPM takes
-- CAT/XAT/GMAT/NMAT and wants 2+ years of work experience, while freshers are
-- pushed to PGDM under different rules. Flattening that to the college loses the
-- part a student needs.
CREATE TABLE IF NOT EXISTS programme (
  id            TEXT PRIMARY KEY,
  college_id    TEXT NOT NULL REFERENCES college(id),
  name          TEXT NOT NULL,                 -- PGPM, PGDM, MBA
  duration      TEXT,
  min_work_exp_months INTEGER,
  UNIQUE (college_id, name)
);

CREATE TABLE IF NOT EXISTS acceptance (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  programme_id TEXT NOT NULL REFERENCES programme(id),
  exam_id      TEXT NOT NULL REFERENCES exam(id),

  -- The crawler can never know these two. A human fills them.
  strength     TEXT CHECK (strength IN ('primary','secondary','vacant')),
  cutoff_label TEXT,
  cutoff_percentile REAL,

  -- Provenance. Every claim is auditable back to a sentence on a page.
  evidence     TEXT NOT NULL,                  -- the sentence the crawler found
  source_url   TEXT NOT NULL,
  extracted_at TEXT NOT NULL,

  -- extracted -> confirmed -> published, or rejected. Only 'confirmed' ships.
  status       TEXT NOT NULL DEFAULT 'extracted'
               CHECK (status IN ('extracted','confirmed','rejected')),
  reviewed_by  TEXT,
  reviewed_at  TEXT,
  note         TEXT,
  UNIQUE (programme_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_acc_status ON acceptance(status);
CREATE INDEX IF NOT EXISTS idx_prog_college ON programme(college_id);
CREATE INDEX IF NOT EXISTS idx_college_region ON college(region);

-- What is ready to ship, with everything the site needs in one row.
CREATE VIEW IF NOT EXISTS v_publishable AS
SELECT c.name AS college, c.city, c.region, p.name AS programme,
       p.min_work_exp_months, e.id AS exam, e.name AS exam_name,
       e.attempts_per_year, a.strength, a.cutoff_label, a.cutoff_percentile,
       a.source_url
FROM acceptance a
JOIN programme p ON p.id = a.programme_id
JOIN college   c ON c.id = p.college_id
JOIN exam      e ON e.id = a.exam_id
WHERE a.status = 'confirmed' AND a.strength IS NOT NULL;

-- The review queue, longest-waiting first.
CREATE VIEW IF NOT EXISTS v_review_queue AS
SELECT a.id, c.name AS college, c.city, c.region, p.name AS programme,
       e.name AS exam, a.evidence, a.source_url
FROM acceptance a
JOIN programme p ON p.id = a.programme_id
JOIN college   c ON c.id = p.college_id
JOIN exam      e ON e.id = a.exam_id
WHERE a.status = 'extracted'
ORDER BY c.region, c.name, e.name;
