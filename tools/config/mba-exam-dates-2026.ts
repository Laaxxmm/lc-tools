import { CTA, type ToolConfig } from '../lib/types.ts';

const config: ToolConfig = {
  slug: 'mba-exam-dates-2026',
  title: 'MBA & MCA Exam Dates 2026-27: confirmed vs expected',
  tagline:
    'Every MBA and MCA entrance with its exam date, registration window and days left, sorted by whatever closes first.',
  eyebrow: 'Deadline tracker',
  family: 'general',
  description:
    'MBA and MCA entrance exam dates for 2026-27 with registration deadlines and days left. Confirmed dates kept separate from expected ones.',
  keywords: [
    'mba exam dates 2026',
    'cat 2026 exam date',
    'mat 2026 exam date',
    'mba entrance exam calendar 2027',
    'mca entrance exam dates 2027',
    'cat registration last date',
    'mba exam registration deadlines',
  ],
  shortName: "Exam dates & deadlines",
  icon: 'clock',
  oneLiner: "Every deadline, soonest first",
  readMinutes: 6,
  faq: [
    {
      q: 'Which dates on this page are actually confirmed?',
      a: 'Three. CAT 2026 on 29 November, MAT paper-based on 13 September 2026 and MAT computer-based on 20 September 2026. CAT registration opening on 3 August 2026 is confirmed too. Everything else is our expectation from the usual cycle and is tagged Expected on the row, including every registration closing date. We would rather show you a labelled estimate than an unlabelled guess.',
    },
    {
      q: 'When does CAT 2026 registration close?',
      a: 'The IIMs have not published the closing date. Registration opened on 3 August 2026, and recent cycles have closed in the middle of September, which is what the countdown here assumes. Check iimcat.ac.in before you rely on it. CAT does not reopen, so treat the earliest credible date as your deadline rather than the latest.',
    },
    {
      q: 'Can I still write MAT if I have not registered?',
      a: 'Probably, if you move now. AIMA runs MAT several times a year and usually closes registration about a week before each test date, so the September paper-based and computer-based sittings are the near-term options. If both close, the next MAT cycle follows within a few months, which is the main reason MAT works as a backup when CAT timing goes wrong.',
    },
    {
      q: 'Why is the countdown showing a registration date instead of the exam date?',
      a: 'Because that is the date that can end your year. Missing an exam by a day and missing a form by a day have the same result, and the form usually comes first. The tracker counts down to whichever milestone is nearest, so a row switches to the exam date only once its registration window has passed.',
    },
    {
      q: 'How often do these numbers get updated?',
      a: 'The list rebuilds with the site, and the day counts recompute in your browser from your own date, so the countdown is right even if the page has been sitting in a cache. What does not self-correct is the table itself. When an exam body publishes a date, we change the row and move it from Expected to Confirmed.',
    },
    {
      q: 'Where is Karnataka PGCET on this list?',
      a: 'At the bottom, pointed at 2027. The 2026 cycle has concluded and the live activity now is KEA counselling and seat allotment, not the exam. If you are in that queue, your dates come from the KEA portal, not from an entrance calendar.',
    },
    {
      q: 'Why are KMAT, TANCET and other state exams missing?',
      a: 'Because we have nothing solid to put in the row. A tracker earns its place by being right about what it lists, and a page padded with invented dates for exams we have not verified is worth less than a shorter honest one. When the notifications appear we will add them.',
    },
  ],
  related: [
    'mba-exam-eligibility-checker',
    'cat-mat-study-plan-generator',
    'cat-percentile-target-calculator',
    'mba-cost-and-roi-calculator',
  ],
  gate: 'none',
  cta: CTA.matMocks,
  updated: '2026-08-26',
  sources: [
    { label: 'IIM CAT (iimcat.ac.in)', href: 'https://iimcat.ac.in/' },
    { label: 'AIMA MAT (mat.aima.in)', href: 'https://mat.aima.in/' },
    { label: 'XAT (xatonline.in)', href: 'https://xatonline.in/' },
    { label: 'NMAT by GMAC', href: 'https://www.mba.com/exams/nmat' },
    { label: 'SNAP (snaptest.org)', href: 'https://www.snaptest.org/' },
    { label: 'NTA CMAT', href: 'https://exams.nta.ac.in/CMAT/' },
    { label: 'NTA CUET PG', href: 'https://exams.nta.ac.in/CUET-PG/' },
    { label: 'NIMCET', href: 'https://www.nimcet.in/' },
    { label: 'Maharashtra State CET Cell', href: 'https://cetcell.mahacet.org/' },
    { label: 'Karnataka Examinations Authority', href: 'https://cetonline.karnataka.gov.in/kea/' },
  ],
};

export default config;
