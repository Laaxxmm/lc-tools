// Exam date and deadline tracker.
//
// Two rules shape this table. A date is `confirmed` only when the exam body has
// published it; everything else is our expectation and the UI says so. And the
// countdown runs off the *next* milestone rather than the exam date, because the
// deadline that costs you a seat is almost always a registration one.
//
// The table is static. Nothing here fetches, so the page exports cleanly and the
// figures stay auditable against the official sites listed on each row.

export type Stream = 'mba' | 'mca' | 'both';
export type StreamFilter = Stream | 'all';

export interface Exam {
  id: string;
  name: string;
  conductedBy: string;
  stream: Stream;
  /** Official exam body page. Every date on the row is checkable here. */
  site: string;
  /** ISO date. For an expected window this is the start of that window. */
  examDate: string;
  /** What the exam date is printed as, so a window can stay a window. */
  examLabel: string;
  examConfirmed: boolean;
  regOpens?: string;
  regCloses?: string;
  regLabel: string;
  regConfirmed: boolean;
  note?: string;
}

export type MilestoneKind = 'opens' | 'closes' | 'exam' | 'over';

export interface Milestone {
  kind: MilestoneKind;
  date: string;
  /** Days until the date. For 'over', days since the exam. Never negative. */
  days: number;
  /** False when the date behind this countdown is expected, not published. */
  confirmed: boolean;
}

export interface Row {
  exam: Exam;
  next: Milestone;
}

const DAY = 86_400_000;

/** Midnight UTC for an ISO day. Parsing as UTC keeps the count off the clock of
 *  whoever is looking, so a build machine and a phone in Bengaluru agree. */
export function parseIso(iso: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error(`Not an ISO date: ${iso}`);
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) throw new Error(`Not a real date: ${iso}`);
  return t;
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseIso(to) - parseIso(from)) / DAY);
}

/** The soonest thing still ahead of you for one exam. Earliest future date wins,
 *  with no priority order, which is what makes a rolling window like NMAT behave
 *  the same as a fixed test date. */
export function nextMilestone(e: Exam, today: string): Milestone {
  const ahead: Milestone[] = [];
  const add = (kind: MilestoneKind, date: string, confirmed: boolean): void => {
    const days = daysBetween(today, date);
    if (days >= 0) ahead.push({ kind, date, days, confirmed });
  };

  if (e.regOpens) add('opens', e.regOpens, e.regConfirmed);
  if (e.regCloses) add('closes', e.regCloses, e.regConfirmed);
  add('exam', e.examDate, e.examConfirmed);

  ahead.sort((a, b) => a.days - b.days);
  return ahead[0] ?? {
    kind: 'over',
    date: e.examDate,
    days: daysBetween(e.examDate, today),
    confirmed: e.examConfirmed,
  };
}

/** Every exam sorted by urgency: soonest deadline first, exams already held last. */
export function trackerRows(exams: Exam[], today: string, stream: StreamFilter = 'all'): Row[] {
  return exams
    .filter((e) => stream === 'all' || e.stream === stream || e.stream === 'both')
    .map((e) => ({ exam: e, next: nextMilestone(e, today) }))
    .sort((a, b) =>
      Number(a.next.kind === 'over') - Number(b.next.kind === 'over') || a.next.days - b.next.days);
}

// ── The table ────────────────────────────────────────────────────────────────
// Confirmed as of 26 Aug 2026: CAT 2026 on 29 Nov, MAT PBT on 13 Sep, MAT CBT on
// 20 Sep, and CAT registration opening on 3 Aug. Nothing else is published yet,
// so every other date below is an expectation drawn from the usual cycle and is
// flagged as one. Re-check each against the site on the row before you plan money
// or leave around it.

export const EXAMS: Exam[] = [
  {
    id: 'mat-pbt',
    name: 'MAT 2026 — paper-based test',
    conductedBy: 'All India Management Association (AIMA)',
    stream: 'mba',
    site: 'https://mat.aima.in/',
    examDate: '2026-09-13',
    examLabel: '13 September 2026',
    examConfirmed: true,
    regCloses: '2026-09-06',
    regLabel: 'AIMA has closed registration roughly a week before each test date in recent cycles. Treat 6 September as a working assumption and confirm on mat.aima.in.',
    regConfirmed: false,
  },
  {
    id: 'mat-cbt',
    name: 'MAT 2026 — computer-based test',
    conductedBy: 'All India Management Association (AIMA)',
    stream: 'mba',
    site: 'https://mat.aima.in/',
    examDate: '2026-09-20',
    examLabel: '20 September 2026',
    examConfirmed: true,
    regCloses: '2026-09-13',
    regLabel: 'Expected to close about a week before the test date. The CBT slot is the later of the two, so it is the one to take if you need extra preparation days.',
    regConfirmed: false,
  },
  {
    id: 'cat',
    name: 'CAT 2026',
    conductedBy: 'The IIMs',
    stream: 'mba',
    site: 'https://iimcat.ac.in/',
    examDate: '2026-11-29',
    examLabel: '29 November 2026',
    examConfirmed: true,
    regCloses: '2026-09-15',
    regLabel: 'Registration opened on 3 August 2026, which is confirmed. The closing date is not, and mid-September is what the last several cycles suggest.',
    regConfirmed: false,
    note: 'CAT does not reopen. Miss the form and the next sitting is roughly a year away.',
  },
  {
    id: 'nmat',
    name: 'NMAT by GMAC 2026',
    conductedBy: 'Graduate Management Admission Council (GMAC)',
    stream: 'mba',
    site: 'https://www.mba.com/exams/nmat',
    examDate: '2026-10-01',
    examLabel: 'Expected October to December 2026',
    examConfirmed: false,
    regCloses: '2026-10-12',
    regLabel: 'Expected to close in the second week of October 2026, part way into the testing window.',
    regConfirmed: false,
    note: 'You book your own slot inside the window and may retake, so register early and sit early. That leaves room for a second attempt.',
  },
  {
    id: 'cmat',
    name: 'CMAT 2027',
    conductedBy: 'National Testing Agency (NTA)',
    stream: 'mba',
    site: 'https://exams.nta.ac.in/CMAT/',
    examDate: '2027-01-25',
    examLabel: 'Expected January 2027',
    examConfirmed: false,
    regOpens: '2026-11-01',
    regCloses: '2026-12-05',
    regLabel: 'Registration is expected to open in November 2026 and close in early December.',
    regConfirmed: false,
    note: 'CMAT scores are accepted by a wide set of AICTE-approved institutes, which makes it a cheap second net alongside CAT.',
  },
  {
    id: 'snap',
    name: 'SNAP 2026',
    conductedBy: 'Symbiosis International University',
    stream: 'mba',
    site: 'https://www.snaptest.org/',
    examDate: '2026-12-06',
    examLabel: 'Expected December 2026, across three test dates',
    examConfirmed: false,
    regCloses: '2026-11-22',
    regLabel: 'Expected to close in the last week of November 2026.',
    regConfirmed: false,
    note: 'You may sit more than one of the three dates. The best score is the one that counts.',
  },
  {
    id: 'xat',
    name: 'XAT 2027',
    conductedBy: 'XLRI Jamshedpur',
    stream: 'mba',
    site: 'https://xatonline.in/',
    examDate: '2027-01-03',
    examLabel: 'Expected 3 January 2027',
    examConfirmed: false,
    regCloses: '2026-12-10',
    regLabel: 'The window usually runs from around August to the second week of December.',
    regConfirmed: false,
    note: 'XAT carries a decision-making section no other exam tests. Budget separate practice for it.',
  },
  {
    id: 'cuet-pg',
    name: 'CUET PG 2027',
    conductedBy: 'National Testing Agency (NTA)',
    stream: 'both',
    site: 'https://exams.nta.ac.in/CUET-PG/',
    examDate: '2027-03-15',
    examLabel: 'Expected March 2027',
    examConfirmed: false,
    regOpens: '2026-12-15',
    regCloses: '2027-01-31',
    regLabel: 'Registration is expected around late December 2026 to the end of January 2027.',
    regConfirmed: false,
    note: 'Central universities use CUET PG for both MBA and MCA seats, so it covers you either way.',
  },
  {
    id: 'mah-cet-mba',
    name: 'MAH CET MBA / MMS 2027',
    conductedBy: 'State CET Cell, Maharashtra',
    stream: 'mba',
    site: 'https://cetcell.mahacet.org/',
    examDate: '2027-03-01',
    examLabel: 'Expected March to May 2027',
    examConfirmed: false,
    regOpens: '2026-12-20',
    regCloses: '2027-02-05',
    regLabel: 'Expected to open around late December 2026 and close in early February 2027.',
    regConfirmed: false,
  },
  {
    id: 'mah-mca-cet',
    name: 'MAH MCA CET 2027',
    conductedBy: 'State CET Cell, Maharashtra',
    stream: 'mca',
    site: 'https://cetcell.mahacet.org/',
    examDate: '2027-03-15',
    examLabel: 'Expected March to May 2027',
    examConfirmed: false,
    regOpens: '2026-12-20',
    regCloses: '2027-02-05',
    regLabel: 'Expected to share a registration window with the MBA CET.',
    regConfirmed: false,
  },
  {
    id: 'nimcet',
    name: 'NIMCET 2027',
    conductedBy: 'The NITs',
    stream: 'mca',
    site: 'https://www.nimcet.in/',
    examDate: '2027-06-01',
    examLabel: 'Expected June 2027',
    examConfirmed: false,
    regOpens: '2027-03-01',
    regCloses: '2027-04-15',
    regLabel: 'Expected to open in March 2027 and close in mid-April.',
    regConfirmed: false,
    note: 'The only route into the NIT MCA programmes. Nothing else substitutes for it.',
  },
  {
    id: 'karnataka-pgcet',
    name: 'Karnataka PGCET 2027',
    conductedBy: 'Karnataka Examinations Authority (KEA)',
    stream: 'both',
    site: 'https://cetonline.karnataka.gov.in/kea/',
    examDate: '2027-07-01',
    examLabel: 'Expected July 2027',
    examConfirmed: false,
    regOpens: '2027-04-01',
    regCloses: '2027-05-31',
    regLabel: 'Expected around April to May 2027, on the KEA portal.',
    regConfirmed: false,
    note: 'The 2026 cycle has concluded. KEA counselling and seat allotment against it are the live activity right now, not the exam.',
  },
];
