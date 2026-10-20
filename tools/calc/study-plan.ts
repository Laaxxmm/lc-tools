// Week-by-week study plan for CAT, MAT and Karnataka PGCET (MBA and MCA).
//
// The plan changes SHAPE with the runway; it does not scale. Thirteen weeks buys a
// foundation phase. Three weeks does not, and pretending otherwise is how students
// spend their last fortnight learning a topic they never get to use. So the phase
// map is chosen by weeks-remaining and then capped by how far along the student says
// they are — never by multiplying one template up or down.

import { TOPICS } from './study-topics.ts';

export type Exam = 'cat' | 'mat' | 'pgcet-mba' | 'pgcet-mca';
export type Level = 'fresh' | 'revising' | 'sprint';
export type Shape = 'sprint' | 'condensed' | 'build';

export type Phase =
  | 'foundation' | 'repair' | 'application' | 'sectional'
  | 'triage' | 'mock-block' | 'mock-density' | 'taper';

export type SectionId =
  | 'varc' | 'dilr' | 'quant'                     // CAT
  | 'lc' | 'ms' | 'da' | 'icr' | 'ige'            // MAT
  | 'comp' | 'reason' | 'english' | 'gk'          // PGCET MBA (+ 'quant')
  | 'maths' | 'ga';                               // PGCET MCA (+ comp, reason, english)

export interface Section {
  id: SectionId;
  label: string;
  short: string;
  /** Share of drill time before the weak-section adjustment. Each exam sums to 1. */
  base: number;
}

// CAT gives every section the same 40 minutes, so time is split by how much syllabus
// sits behind each one rather than by marks. QA carries the widest syllabus.
// MAT weights the four sections that feed the composite score; Indian & Global
// Environment sits outside that score, so it gets a token slice and nothing more.
export const SECTIONS: Record<Exam, readonly Section[]> = {
  cat: [
    { id: 'varc', label: 'Verbal Ability & Reading Comprehension', short: 'VARC', base: 0.32 },
    { id: 'dilr', label: 'Data Interpretation & Logical Reasoning', short: 'DILR', base: 0.32 },
    { id: 'quant', label: 'Quantitative Ability', short: 'QA', base: 0.36 },
  ],
  mat: [
    { id: 'lc', label: 'Language Comprehension', short: 'LC', base: 0.26 },
    { id: 'ms', label: 'Mathematical Skills', short: 'MS', base: 0.28 },
    { id: 'da', label: 'Data Analysis & Sufficiency', short: 'DA', base: 0.24 },
    { id: 'icr', label: 'Intelligence & Critical Reasoning', short: 'ICR', base: 0.16 },
    { id: 'ige', label: 'Indian & Global Environment', short: 'IGE', base: 0.06 },
  ],
  // KEA publishes the PGCET syllabus but not the section sizes, and the booklet prints
  // no section breaks. These are counted from the 2026 papers on KEA's question-paper
  // page (100 one-mark questions, no negative marking):
  //   MBA  computer 1-25, reasoning 26-40, quant 41-55, English 56-70, GK 71-100
  //   MCA  maths 1-30, computer 31-55, reasoning 56-70, general awareness 71-90, English 91-100
  // Time follows marks per hour of study, not marks alone. GK and general awareness
  // move slowly and reward a daily news habit, so they sit below their mark share;
  // MBA quant leaned on statistics in 2026 and sits above it.
  'pgcet-mba': [
    { id: 'comp', label: 'Computer Awareness', short: 'Comp', base: 0.24 },
    { id: 'reason', label: 'Analytical Ability & Logical Reasoning', short: 'LR', base: 0.18 },
    { id: 'quant', label: 'Quantitative Analysis', short: 'QA', base: 0.20 },
    { id: 'english', label: 'English Language', short: 'Eng', base: 0.14 },
    { id: 'gk', label: 'General Knowledge', short: 'GK', base: 0.24 },
  ],
  'pgcet-mca': [
    { id: 'maths', label: 'Mathematics', short: 'Maths', base: 0.36 },
    { id: 'comp', label: 'Computer Awareness', short: 'Comp', base: 0.26 },
    { id: 'reason', label: 'Analytical Ability & Logical Reasoning', short: 'LR', base: 0.16 },
    { id: 'ga', label: 'General Awareness', short: 'GA', base: 0.12 },
    { id: 'english', label: 'General English', short: 'Eng', base: 0.10 },
  ],
};

export interface ExamMeta {
  name: string;
  paper: string;
  source: string;
}

export const EXAM_META: Record<Exam, ExamMeta> = {
  cat: {
    name: 'CAT 2026',
    paper: '120 minutes, three sections, 40 minutes each, and the sectional timer locks.',
    source: 'https://iimcat.ac.in/',
  },
  mat: {
    name: 'MAT 2026',
    paper: '150 minutes, five sections, 200 questions, and you move between sections freely.',
    source: 'https://mat.aima.in/',
  },
  'pgcet-mba': {
    name: 'PGCET 2027 (MBA)',
    paper: '120 minutes, 100 one-mark questions on an OMR sheet, no negative marking. That was the 2026 format; check the 2027 bulletin, because KEA can change it.',
    source: 'https://cetonline.karnataka.gov.in/kea/',
  },
  'pgcet-mca': {
    name: 'PGCET 2027 (MCA)',
    paper: '120 minutes, 100 one-mark questions on an OMR sheet, no negative marking. That was the 2026 format; check the 2027 bulletin, because KEA can change it.',
    source: 'https://cetonline.karnataka.gov.in/kea/',
  },
};

/** Dates published by the exam body. Anything else the user types is unverified.
 *  PGCET 2027 has none yet: KEA has not announced it. */
export interface ExamDateOption { exam: Exam; date: string; label: string; }
export const CONFIRMED_DATES: readonly ExamDateOption[] = [
  { exam: 'cat', date: '2026-11-29', label: 'CAT 2026 — Sunday 29 November 2026' },
  { exam: 'mat', date: '2026-12-20', label: 'MAT December 2026 paper-based — Sunday 20 December 2026' },
  { exam: 'mat', date: '2026-12-27', label: 'MAT December 2026 computer-based — Sunday 27 December 2026' },
];

export const PHASE_LABEL: Record<Phase, string> = {
  foundation: 'Foundation',
  repair: 'Concept repair',
  application: 'Application',
  sectional: 'Sectional depth',
  triage: 'Triage & revision',
  'mock-block': 'Mock block',
  'mock-density': 'Mock density',
  taper: 'Taper',
};

const FOCUS: Record<Phase, Record<Exam, string>> = {
  foundation: {
    cat: 'Build the topics you do not have yet. One QA area and one DILR set type a week, plus an hour of unfamiliar non-fiction most days — reading width moves VARC further right now than any question bank does.',
    mat: 'Learn what you skipped. Arithmetic and algebra carry most of Mathematical Skills, and Data Analysis rewards calculation speed you build once and then keep.',
    'pgcet-mba': 'Build the two blocks most graduates never studied: computer awareness and statistics. One computer topic a week — number systems, binary arithmetic, memory, operating systems — one quant area alongside, and twenty minutes of business news every day for GK.',
    'pgcet-mca': 'Maths is 30 of the 100 marks, so it gets the foundation. One chapter a week from KEA\'s list — matrices and determinants, coordinate geometry, probability and statistics — with one computer topic alongside, starting with number systems and Boolean algebra, which feed both sections.',
  },
  repair: {
    cat: 'Fix only what is breaking. Take the three topics that cost you the most in your diagnostic, rebuild those, and leave the rest of the syllabus alone.',
    mat: 'Repair two weak areas, not five. Breadth beats depth on MAT, because a section you half know still returns marks across 40 questions.',
    'pgcet-mba': 'Fix only what your diagnostic exposed. Rebuild the two weakest areas and leave the rest alone. Computer awareness and statistics repay repair fastest, because their question types repeat year to year.',
    'pgcet-mca': 'Repair two areas, not five. If maths is one of them, work chapter by chapter down KEA\'s syllabus list rather than a textbook\'s order, since the paper samples every chapter lightly.',
  },
  application: {
    cat: 'Stop learning and start applying. Timed sets of 20 to 25 minutes, then a written note on every wrong question saying which of the three it was: technique, calculation, or reading.',
    mat: 'Move to timed sets. MAT asks for steady accuracy across 200 questions rather than depth on any one, so practise at the pace the paper actually demands.',
    'pgcet-mba': 'Stop learning and start timing. A hundred questions in 120 minutes is 72 seconds each, and there is no negative marking, so practise finishing every question and guessing the ones you cannot crack.',
    'pgcet-mca': 'Timed sets from here. Maths questions on this paper are short calculations, not proofs, so drill them at about a minute each and keep the clock for the 70 marks that come after them.',
  },
  sectional: {
    cat: 'Full sections on the clock, one at a time. Forty minutes, no pausing, then half an hour of analysis before you open anything else.',
    mat: 'Full sections on the clock. Thirty minutes a section is the real budget, so practise finishing rather than perfecting.',
    'pgcet-mba': 'Full sections on the clock, in paper order: computer awareness, reasoning, quant, English, then the 30 GK questions. Note where the minutes go, because GK sits last and a slow start steals from it.',
    'pgcet-mca': 'Full sections on the clock. Try two orders across the week — the paper\'s own, maths first, and the quick sections first — and keep whichever finishes more questions.',
  },
  triage: {
    cat: 'Revise what you already own. New topics this close cost more than they return. Drill your strong areas until they are automatic and take only the easy marks in the weak one.',
    mat: 'Revise, do not rebuild. Work through your own notes and formula sheet, then drill the question types you recognise on sight.',
    'pgcet-mba': 'Revise what you already own. Computer facts and English idioms are pure recall, so they go on flashcards now. Leave any new quant topic alone.',
    'pgcet-mca': 'Revise, do not rebuild. One page of maths formulas, one of computer facts — number systems, memory, operating-system terms — then drill the question types you recognise on sight.',
  },
  'mock-block': {
    cat: 'Two to three full mocks this week, each followed by an analysis longer than the mock. Your attempt-versus-accuracy pattern per section tells you more than the percentile does.',
    mat: 'Two to three full mocks with the analysis written down. Watch accuracy section by section rather than the composite.',
    'pgcet-mba': 'Two to three full papers this week on a printed OMR sheet, each followed by an analysis longer than the paper. With no negative marking, your blank count should be zero.',
    'pgcet-mca': 'Two to three full papers on a printed OMR sheet, with the analysis written down. Count marks lost to the clock separately from marks lost to mistakes.',
  },
  'mock-density': {
    cat: 'Mocks are the syllabus now. Take them at your slot time, analyse the same day, and carry exactly one fix into the next one.',
    mat: 'Take mocks at the time of day your paper runs. Same-day analysis, one correction carried forward each time.',
    'pgcet-mba': 'Full papers at the time of day your paper runs, analysed the same day, with one fix carried into the next.',
    'pgcet-mca': 'Full papers at the time of day your paper runs, analysed the same day, with one fix carried into the next.',
  },
  taper: {
    cat: 'Volume drops, sharpness holds. Two mocks early in the week, revision after that, and nothing new once the last one is done.',
    mat: 'Cut the volume. Two mocks early in the week, formula and vocabulary revision after that, and an early night before the paper.',
    'pgcet-mba': 'Cut the volume. Two papers early in the week, flashcards after that, and nothing new. Pack the admit card, photo ID and two blue or black ballpoint pens the night before.',
    'pgcet-mca': 'Cut the volume. Two papers early in the week, flashcards after that, and nothing new. Pack the admit card, photo ID and two blue or black ballpoint pens the night before.',
  },
};

const PHASE_MILESTONE: Record<Phase, Record<Exam, string>> = {
  foundation: {
    cat: 'Checkpoint: by the end of this phase you should name the topic behind any question in about ten seconds, even when you cannot solve it yet.',
    mat: 'Checkpoint: you should be able to start every Mathematical Skills question without hunting for the method first.',
    'pgcet-mba': 'Checkpoint: you convert between binary, decimal and hexadecimal without a table, and start any mean, median or correlation question without hunting for the formula.',
    'pgcet-mca': 'Checkpoint: you can start a question from every maths chapter on KEA\'s list, Boolean algebra and conics included, without opening the textbook.',
  },
  repair: {
    cat: 'Checkpoint: write down the three costliest topics from your diagnostic. They are the only new work you take on.',
    mat: 'Checkpoint: name the two sections dragging your composite down, and cap your new learning to those.',
    'pgcet-mba': 'Checkpoint: name the two sections costing you the most marks in your diagnostic. They are the only new work you take on.',
    'pgcet-mca': 'Checkpoint: name the two sections costing you the most marks in your diagnostic. They are the only new work you take on.',
  },
  application: {
    cat: 'Checkpoint: every set from here runs on a clock. When you cannot finish, record what you would have skipped instead of finishing anyway.',
    mat: 'Checkpoint: you finish a 40-question section inside 30 minutes, even if the accuracy is not there yet.',
    'pgcet-mba': 'Checkpoint: 100 questions inside 120 minutes with every bubble filled, even if the accuracy is not there yet.',
    'pgcet-mca': 'Checkpoint: 100 questions inside 120 minutes with every bubble filled, even if the accuracy is not there yet.',
  },
  sectional: {
    cat: 'Checkpoint: one full section, real clock, no pausing, start to finish.',
    mat: 'Checkpoint: one full section at exam pace, then the analysis, on the same day.',
    'pgcet-mba': 'Checkpoint: one full section at exam pace, then the analysis, on the same day.',
    'pgcet-mca': 'Checkpoint: one full section at exam pace, then the analysis, on the same day.',
  },
  triage: {
    cat: 'Checkpoint: your formula sheet and error log exist and are one page each. If they do not exist yet, that is this week’s first job.',
    mat: 'Checkpoint: one page of formulas, one page of errors. Build them now, because you will read nothing else in the last three days.',
    'pgcet-mba': 'Checkpoint: one page of computer facts, one of quant formulas, one of errors. You will read nothing else in the last three days.',
    'pgcet-mca': 'Checkpoint: one page of maths formulas, one of computer facts, one of errors. You will read nothing else in the last three days.',
  },
  'mock-block': {
    cat: 'Checkpoint: your mock scores should stop swinging. A steady band beats one high score you cannot repeat.',
    mat: 'Checkpoint: sectional accuracy should be steady across your last three mocks.',
    'pgcet-mba': 'Checkpoint: your last three papers sit in a narrow band, and none of them has a blank answer.',
    'pgcet-mca': 'Checkpoint: your last three papers sit in a narrow band, and none of them has a blank answer.',
  },
  'mock-density': {
    cat: 'Checkpoint: same slot, same rules, same-day analysis. Treat every mock as the real thing from here.',
    mat: 'Checkpoint: same start time as your paper, full 150 minutes, no breaks.',
    'pgcet-mba': 'Checkpoint: same start time as your paper, the full 120 minutes, an OMR sheet, no breaks.',
    'pgcet-mca': 'Checkpoint: same start time as your paper, the full 120 minutes, an OMR sheet, no breaks.',
  },
  taper: {
    cat: 'Checkpoint: no new topic and no new material. Rehearse exam morning, including travel time, food, and the admit card.',
    mat: 'Checkpoint: nothing new. Rehearse the morning of the paper, including travel and the documents you have to carry.',
    'pgcet-mba': 'Checkpoint: nothing new. Rehearse exam morning, including travel to the centre and the documents you carry.',
    'pgcet-mca': 'Checkpoint: nothing new. Rehearse exam morning, including travel to the centre and the documents you carry.',
  },
};

const DIAGNOSTIC: Record<Exam, string> = {
  cat: 'Take one full mock this week before anything else. Record section-wise accuracy and time per question. The score is not the point; the pattern is.',
  mat: 'Take one full mock this week before anything else. Record accuracy per section. You need to know which four sections carry your composite before you spend a single hour.',
  'pgcet-mba': 'Sit KEA\'s own 2026 MBA paper this week before anything else; it is free on the KEA website. Score it section by section. The total is not the point; which block loses you marks is.',
  'pgcet-mca': 'Sit KEA\'s own 2026 MCA paper this week before anything else; it is free on the KEA website. Score it section by section, and time the maths block on its own.',
};

const SHAPE_NOTE: Record<Shape, string> = {
  build: 'Long enough to build. You get a foundation phase, then application, then a mock block, then a taper.',
  condensed: 'Not long enough to start from zero, long enough to repair. Targeted repair first, then full sections, then mocks.',
  sprint: 'Too close for new topics. Triage what you already own, raise mock density, then taper.',
};

const PLANNED_MOCKS: Record<Phase, number> = {
  foundation: 1, repair: 1, application: 2, sectional: 2,
  triage: 2, 'mock-block': 3, 'mock-density': 3, taper: 2,
};

/** One mock plus the analysis that makes it worth taking. */
const MOCK_HOURS: Record<Exam, number> = { cat: 4.5, mat: 5, 'pgcet-mba': 4.5, 'pgcet-mca': 4.5 };
/** One rest day a week is built in. A plan without one is a plan you abandon. */
const REST_FACTOR = 6 / 7;
const BOOST: Record<Shape, number> = { build: 0.10, condensed: 0.07, sprint: 0.04 };
/** IGE sits outside the MAT composite, so it never earns a full weak-section boost. */
const IGE_BOOST_CAP = 0.02;
const MAX_DAYS = 400;
const MAX_HOURS_PER_DAY = 14;

const DAY = 86_400_000;

// Learning phases spend a section's hours walking down its topic list. A repair pass
// costs half, because the student has met the topic before.
const LEARN_COST: Partial<Record<Phase, number>> = { foundation: 1, repair: 0.5 };
// Later phases loop over topics instead: timed sets, or recall only in a sprint.
const LOOP_MODE: Partial<Record<Phase, TopicMode>> = { application: 'practise', sectional: 'practise', triage: 'revise' };
/** Roughly one topic's timed set per this many hours, capped at three a week. */
const HOURS_PER_SET = 1.5;

/**
 * Hands out topics week by week. Topics carry over between weeks when a section's
 * hours run out mid-topic, so a six-hour topic on two hours a week spans three weeks.
 */
function topicScheduler(exam: Exam, shape: Shape) {
  const all = (id: SectionId) => (TOPICS[exam][id] ?? []).map((t) => t.name);
  const queue = new Map<SectionId, { name: string; left: number; started: boolean }[]>();
  const learned = new Map<SectionId, string[]>();
  const cursor = new Map<SectionId, number>();
  for (const s of SECTIONS[exam]) {
    queue.set(s.id, (TOPICS[exam][s.id] ?? []).map((t) => ({ name: t.name, left: t.hours, started: false })));
    learned.set(s.id, []);
    cursor.set(s.id, 0);
  }

  function learn(id: SectionId, budget: number, cost: number): string[] {
    const q = queue.get(id)!;
    const names: string[] = [];
    while (budget > 0 && q.length) {
      const t = q[0];
      names.push(t.started ? `${t.name} (continued)` : t.name);
      t.started = true;
      if (t.left * cost <= budget) {
        budget -= t.left * cost;
        learned.get(id)!.push(t.name);
        q.shift();
      } else {
        t.left -= budget / cost;
        budget = 0;
      }
    }
    return names;
  }

  function loop(id: SectionId, hours: number): string[] {
    // A fresh student practises only what the plan taught. Anyone revising or in a
    // sprint already owns the syllabus, so the loop runs over all of it.
    const pool = shape === 'build' ? learned.get(id)! : all(id);
    if (!pool.length || hours <= 0) return [];
    const n = Math.min(3, Math.max(1, Math.floor(hours / HOURS_PER_SET)), pool.length);
    const at = cursor.get(id)!;
    cursor.set(id, at + n);
    return Array.from({ length: n }, (_, k) => pool[(at + k) % pool.length]);
  }

  function week(phase: Phase, split: SectionSplit[]): WeekTopics[] {
    const cost = LEARN_COST[phase];
    const mode = LOOP_MODE[phase];
    const out: WeekTopics[] = [];
    const add = (s: SectionSplit, m: TopicMode, topics: string[]) => {
      if (topics.length) out.push({ id: s.id, short: s.short, mode: m, topics });
    };
    for (const s of split) {
      const left = queue.get(s.id)!.length > 0;
      if (cost !== undefined && left) {
        add(s, phase === 'repair' ? 'repair' : 'learn', learn(s.id, s.hours, cost));
      } else if (phase === 'application' && shape === 'build' && left) {
        // Topics the foundation weeks did not reach still get taught, on half the
        // hours, rather than silently vanishing once the timed sets start.
        add(s, 'learn', learn(s.id, s.hours / 2, 1));
        add(s, 'practise', loop(s.id, s.hours / 2));
      } else if (cost !== undefined || mode !== undefined) {
        add(s, mode ?? 'practise', loop(s.id, s.hours));
      }
    }
    return out;
  }

  /** Topics a fresh student never reached, in list order. */
  const dropped = () => [...queue.values()].flat().map((t) => t.name);
  return { week, dropped };
}

function parseIso(s: string): number | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  // Rejects 2026-02-31 and friends, which Date.UTC silently rolls forward.
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t;
}

function isoFrom(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Local calendar date, not UTC — a student at 00:30 IST is on today, not yesterday. */
export function todayIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function formatDay(iso: string, withYear = false): string {
  const t = parseIso(iso);
  if (t === null) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(new Date(t));
}

function half(n: number): number {
  return Math.round(n * 2) / 2;
}

function phaseFor(weeksToGo: number, shape: Shape): Phase {
  if (weeksToGo <= 1) return 'taper';
  if (shape === 'sprint') return weeksToGo === 2 ? 'mock-density' : 'triage';
  if (shape === 'condensed') {
    if (weeksToGo <= 3) return 'mock-block';
    if (weeksToGo <= 6) return 'sectional';
    return 'repair';
  }
  if (weeksToGo <= 4) return 'mock-block';
  if (weeksToGo <= 8) return 'application';
  return 'foundation';
}

const RANK: Record<Shape, number> = { sprint: 0, condensed: 1, build: 2 };

function ceilingFor(level: Level): Shape {
  return level === 'sprint' ? 'sprint' : level === 'revising' ? 'condensed' : 'build';
}

export function shapeFor(weeks: number, level: Level): Shape {
  const horizon: Shape = weeks <= 4 ? 'sprint' : weeks <= 8 ? 'condensed' : 'build';
  const ceiling = ceilingFor(level);
  return RANK[horizon] <= RANK[ceiling] ? horizon : ceiling;
}

/** Weak-section boost taken from the other sections in proportion to their base share. */
export function sectionShares(exam: Exam, weakest: SectionId, shape: Shape): Map<SectionId, number> {
  const sections = SECTIONS[exam];
  const boost = weakest === 'ige' ? Math.min(BOOST[shape], IGE_BOOST_CAP) : BOOST[shape];
  const otherTotal = sections.reduce((t, s) => (s.id === weakest ? t : t + s.base), 0);
  const factor = 1 - boost / otherTotal;
  return new Map(sections.map((s) => [s.id, s.id === weakest ? s.base + boost : s.base * factor]));
}

export interface SectionSplit {
  id: SectionId; label: string; short: string; share: number; hours: number;
}

/** learn = first pass; repair = check and rebuild; practise = timed sets; revise = recall only. */
export type TopicMode = 'learn' | 'repair' | 'practise' | 'revise';

export interface WeekTopics {
  id: SectionId;
  short: string;
  mode: TopicMode;
  topics: string[];
}

export interface WeekPlan {
  week: number;
  from: string;
  to: string;
  days: number;
  phase: Phase;
  phaseLabel: string;
  focus: string;
  hours: number;
  mocks: number;
  mockHours: number;
  drillHours: number;
  split: SectionSplit[];
  /** What to study this week, per section. Empty in mock and taper weeks. */
  topics: WeekTopics[];
  milestone?: string;
}

export interface StudyPlan {
  ok: true;
  exam: Exam;
  examName: string;
  examDate: string;
  dateConfirmed: boolean;
  start: string;
  daysLeft: number;
  shape: Shape;
  shapeNote: string;
  headline: string;
  weeks: WeekPlan[];
  totalHours: number;
  totalMocks: number;
  split: SectionSplit[];
  flags: string[];
}

export type PlanResult = StudyPlan | { ok: false; error: string };

export interface PlanInput {
  exam: Exam;
  /** ISO yyyy-mm-dd. The day the plan starts, normally today. */
  start: string;
  examDate: string;
  hoursPerDay: number;
  level: Level;
  weakest: SectionId;
}

export function buildPlan(input: PlanInput): PlanResult {
  const { exam, level, hoursPerDay, weakest } = input;

  const start = parseIso(input.start);
  const end = parseIso(input.examDate);
  if (start === null) return { ok: false, error: 'Pick a valid start date.' };
  if (end === null) return { ok: false, error: 'Pick a valid exam date.' };

  const daysLeft = Math.round((end - start) / DAY);
  if (daysLeft <= 0) {
    return { ok: false, error: 'That exam date is today or already past. Pick a date ahead of your start date.' };
  }
  if (daysLeft > MAX_DAYS) {
    return { ok: false, error: `That is more than ${MAX_DAYS} days away. Come back when the exam is inside a year.` };
  }
  if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0) {
    return { ok: false, error: 'Enter how many hours a day you can actually study.' };
  }
  if (hoursPerDay > MAX_HOURS_PER_DAY) {
    return { ok: false, error: `Cap it at ${MAX_HOURS_PER_DAY} hours a day. Above that it is not a plan, it is a wish.` };
  }
  if (!SECTIONS[exam].some((s) => s.id === weakest)) {
    return { ok: false, error: 'Pick a weakest section from the exam you selected.' };
  }

  const totalWeeks = Math.ceil(daysLeft / 7);
  const shape = shapeFor(totalWeeks, level);
  const shares = sectionShares(exam, weakest, shape);
  const mockHours = MOCK_HOURS[exam];
  const sections = SECTIONS[exam];

  // Weeks are aligned to the exam, not to today, so the taper is a true final seven
  // days and any short week lands at the start where it costs least.
  const firstWeekDays = daysLeft - (totalWeeks - 1) * 7;

  const weeks: WeekPlan[] = [];
  const topics = topicScheduler(exam, shape);
  let cursor = start;
  let previous: Phase | null = null;

  for (let i = 0; i < totalWeeks; i++) {
    const days = i === 0 ? firstWeekDays : 7;
    const weeksToGo = totalWeeks - i;
    const phase = phaseFor(weeksToGo, shape);
    const hours = half(days * hoursPerDay * REST_FACTOR);

    // Mock-heavy phases may spend three quarters of the week on mocks and analysis.
    // Earlier phases cap at half, otherwise drilling disappears under mock admin.
    const heavy = phase === 'mock-block' || phase === 'mock-density' || phase === 'taper';
    // A mock a fortnight through foundation. Weekly mocks while you are still learning
    // topics tell you nothing you did not already know, and eat the hours that would.
    const planned = phase === 'foundation' && i % 2 === 1 ? 0 : PLANNED_MOCKS[phase];
    let mocks = Math.min(planned, Math.floor((hours * (heavy ? 0.75 : 0.5)) / mockHours));
    if (i === 0 && mocks === 0 && hours >= mockHours) mocks = 1;

    const spentOnMocks = mocks * mockHours;
    const drillHours = Math.max(0, hours - spentOnMocks);

    const split: SectionSplit[] = sections.map((s) => ({
      id: s.id,
      label: s.label,
      short: s.short,
      share: shares.get(s.id) ?? 0,
      hours: half(drillHours * (shares.get(s.id) ?? 0)),
    }));

    weeks.push({
      week: i + 1,
      from: isoFrom(cursor),
      to: isoFrom(cursor + (days - 1) * DAY),
      days,
      phase,
      phaseLabel: PHASE_LABEL[phase],
      focus: FOCUS[phase][exam],
      hours,
      mocks,
      mockHours: spentOnMocks,
      drillHours,
      split,
      topics: topics.week(phase, split),
      milestone: i === 0
        ? DIAGNOSTIC[exam]
        : phase !== previous ? PHASE_MILESTONE[phase][exam] : undefined,
    });

    previous = phase;
    cursor += days * DAY;
  }

  const totalHours = half(weeks.reduce((t, w) => t + w.hours, 0));
  const totalMocks = weeks.reduce((t, w) => t + w.mocks, 0);
  const split: SectionSplit[] = sections.map((s) => ({
    id: s.id,
    label: s.label,
    short: s.short,
    share: shares.get(s.id) ?? 0,
    hours: half(weeks.reduce((t, w) => t + (w.split.find((x) => x.id === s.id)?.hours ?? 0), 0)),
  }));

  const flags: string[] = [];

  if (hoursPerDay > 8) {
    flags.push('Eight-plus hours a day reads well on paper and usually collapses in week two. Plan for the number you will still be doing in week six.');
  }
  if (level === 'fresh' && totalWeeks <= 4) {
    flags.push(`Starting fresh with ${daysLeft} days left, the honest answer is that you will not build a section from zero. This plan takes the marks that are reachable and protects the ones you already have.`);
  }
  if (level === 'sprint' && totalWeeks > 4) {
    flags.push('You picked final sprint with more than four weeks left, so the plan holds you in revision and mocks the whole way. If topics are still missing, switch to revising and take the repair phase instead.');
  }
  if (weeks.some((w) => (w.phase === 'mock-block' || w.phase === 'mock-density') && w.mocks === 0)) {
    flags.push(`At ${hoursPerDay} hours a day there is no room for a full mock and its analysis inside one week. Alternate instead: mock one week, drill the next, and never skip the analysis.`);
  }
  if (weakest === 'ige') {
    flags.push('AIMA builds the MAT composite score from four sections and keeps Indian & Global Environment outside it, so this plan gives IGE a small fixed slice rather than a full weak-section boost. Fifteen minutes of news a day covers it.');
  }
  const dropped = shape === 'build' ? topics.dropped() : [];
  if (dropped.length) {
    const total = SECTIONS[exam].reduce((t, s) => t + (TOPICS[exam][s.id]?.length ?? 0), 0);
    const list = dropped.length > 4 ? `${dropped.slice(0, 4).join(', ')} and ${dropped.length - 4} more` : dropped.join(', ');
    flags.push(`At ${hoursPerDay} hour${hoursPerDay === 1 ? '' : 's'} a day the plan teaches ${total - dropped.length} of ${total} topics before the mocks take over. It leaves out the lowest-priority ones: ${list}. More hours a day or an earlier start brings them back.`);
  }
  const dateConfirmed = CONFIRMED_DATES.some((d) => d.exam === exam && d.date === input.examDate);
  if (exam.startsWith('pgcet') && !dateConfirmed) {
    flags.push('KEA has not announced PGCET 2027. The 2026 paper was first set for 24 May and moved to 14 June, so plan for late May and regenerate this plan the day the bulletin is out. If the date lands later, spend the extra weeks on full papers.');
  }
  if (totalWeeks === 1) {
    flags.push('One week left, so nothing new goes in. Sleep, timing, and your own error log are the only things that still move the score.');
  }

  // The weak-section boost does not always make it the biggest slice (MCA maths
  // outweighs a boosted English), so name the section that really is.
  const heaviest = split.reduce((a, b) => (b.share > a.share ? b : a));
  const weekWord = totalWeeks === 1 ? 'week' : 'weeks';
  const headline =
    `${totalWeeks} ${weekWord} to ${EXAM_META[exam].name} at ${hoursPerDay} hours a day: about ` +
    `${totalHours} study hours, ${totalMocks} full mocks, and the heaviest slice on ${heaviest.short}.`;

  return {
    ok: true,
    exam,
    examName: EXAM_META[exam].name,
    examDate: input.examDate,
    dateConfirmed,
    start: input.start,
    daysLeft,
    shape,
    shapeNote: SHAPE_NOTE[shape],
    headline,
    weeks,
    totalHours,
    totalMocks,
    split,
    flags,
  };
}

export const TOPIC_PREFIX: Record<TopicMode, string> = {
  learn: '', repair: 'Check and rebuild: ', practise: 'Practice sets: ', revise: 'Revise: ',
};

/** The gated deliverable: the same plan as a plain-text file the student can keep. */
export function planToText(plan: StudyPlan): string {
  const dateNote = plan.dateConfirmed
    ? ' (published by the exam body)'
    : ' (date you entered, not verified by us)';

  const lines: string[] = [
    `${plan.examName} study plan`,
    `Exam date: ${formatDay(plan.examDate, true)}${dateNote}`,
    `Plan starts: ${formatDay(plan.start, true)}   Days left: ${plan.daysLeft}`,
    plan.headline,
    '',
    plan.shapeNote,
    '',
    'Time split across the whole plan',
    ...plan.split.map((s) => `  ${s.short.padEnd(5)} ${Math.round(s.share * 100)}%  about ${s.hours}h  ${s.label}`),
    '',
  ];

  for (const w of plan.weeks) {
    lines.push(
      `Week ${w.week} — ${formatDay(w.from)} to ${formatDay(w.to)} — ${w.phaseLabel}`,
      `  ${w.hours}h available · ${w.mocks} full mock${w.mocks === 1 ? '' : 's'} (${w.mockHours}h) · ${w.drillHours}h drilling`,
      `  ${w.focus}`,
      `  ${w.split.map((s) => `${s.short} ${s.hours}h`).join(' · ')}`,
      ...w.topics.map((t) => `  ${t.short}: ${TOPIC_PREFIX[t.mode]}${t.topics.join(' · ')}`),
    );
    if (w.milestone) lines.push(`  ${w.milestone}`);
    lines.push('');
  }

  if (plan.flags.length) {
    lines.push('Worth knowing', ...plan.flags.map((f) => `  - ${f}`), '');
  }
  lines.push(
    `Paper format: ${EXAM_META[plan.exam].paper}`,
    `Official source: ${EXAM_META[plan.exam].source}`,
    'Built with the Learn Crew study plan generator — learncrew.org/tools/cat-mat-study-plan-generator/',
  );
  return lines.join('\n');
}
