import { CTA, type ToolConfig } from '../lib/types.ts';

const tool: ToolConfig = {
  slug: 'cat-mat-study-plan-generator',
  title: 'CAT, MAT & PGCET Study Plan Generator: weeks to exam day',
  tagline:
    'Give it your exam date, the hours you actually have, and your weakest section. It returns a week-by-week plan with the sectional split and the mock checkpoints already placed.',
  eyebrow: 'CAT · MAT · PGCET · Study planner',
  family: 'cat',
  alsoServes: ['mat', 'pgcet'],
  description:
    'Free study plan generator for CAT, MAT and Karnataka PGCET MBA and MCA. Enter exam date, daily hours and weakest section for a week-by-week plan.',
  keywords: [
    'cat study plan',
    'mat study plan',
    'cat 2026 study plan',
    'mat december 2026 preparation',
    'pgcet 2027 study plan',
    'pgcet mba preparation plan',
    'pgcet mca preparation plan',
    'cat 3 month preparation plan',
    'mat 3 week plan',
    'study plan generator mba entrance',
    'cat sectional time split',
  ],
  shortName: "Study plan generator",
  icon: 'calendar',
  oneLiner: "Your weeks to exam day, mapped",
  readMinutes: 6,
  faq: [
    {
      q: 'How many hours a day do I need for CAT 2026?',
      a: 'There is no single number, and anyone quoting one is guessing. What matters is that the hours are real and repeatable. Three focused hours a day from 26 August to the CAT on 29 November comes to roughly 245 study hours and about 22 full mocks, which is enough to build a section you do not have yet. Two hours a day still works if you cut the syllabus down and stop trying to cover everything. Put in the number you will still be doing in week six, not the number you feel guilty about.',
    },
    {
      q: 'Can I still do something useful for MAT with three weeks left?',
      a: 'Yes, and the plan looks nothing like a three-month plan. Eighteen days out — where MAT December’s paper-based test sits from the start of December — is one triage week, one high-density mock week, and a taper. You revise what you already own, drill the question types you recognise on sight, and take mocks at the time of day your paper runs. What you do not do is start a new topic. Three weeks is not enough to build Mathematical Skills from scratch, and the hours spent trying come out of the sections that were already going to score.',
    },
    {
      q: 'Should I spend most of my time on my weakest section?',
      a: 'Early on, yes. Close to the exam, no. The generator moves ten percentage points of your time into your weakest section when the exam is more than eight weeks away, and only four when it is under a month. That is deliberate. Far out, a weak section is the highest-return place to put an hour. Near the exam, the same hour returns more if it keeps a strong section automatic, because a section you stop practising decays faster than a weak one improves.',
    },
    {
      q: 'How many mocks should I take before the exam?',
      a: 'Take as many as you can analyse properly, which is the real limit. The plan budgets four and a half hours for a CAT or PGCET mock and five for a MAT mock, because the analysis has to be longer than the paper. One mock a fortnight during foundation is enough while you are still learning topics. Two a week once you are applying them, three a week in the mock block, and two in the final week with nothing new after the last one.',
    },
    {
      q: 'Does the plan cover MAT’s Indian & Global Environment section?',
      a: 'It gives it a small fixed slice and refuses to give it more. AIMA builds the MAT composite score from four sections and keeps Indian & Global Environment outside it, so hours moved there do not move your percentile. Fifteen minutes of news a day covers what you need. If you pick IGE as your weakest section the plan says so rather than quietly handing it a tenth of your preparation.',
    },
    {
      q: 'Does it plan for Karnataka PGCET MBA and MCA?',
      a: 'Yes, as two separate papers, because they share almost nothing but the format: 100 one-mark questions in 120 minutes on an OMR sheet, with no negative marking. KEA does not publish section sizes, so the plan uses the 2026 papers on its own website. MBA ran 25 computer awareness, 15 reasoning, 15 quantitative, 15 English and 30 general knowledge questions. MCA ran 30 maths, 25 computer awareness, 15 reasoning, 20 general awareness and 10 English. KEA has not announced PGCET 2027. The 2026 paper was first set for 24 May and moved to 14 June, so the plan aims at late May and tells you so. Regenerate it the day the bulletin is out.',
    },
    {
      q: 'Why does the plan ask for my WhatsApp number?',
      a: 'The shape of the plan is free: days left, total hours, the section split and the first two weeks are on this page before you type anything. The remaining weeks and the printable PDF sit behind one short form — your name and WhatsApp number — so we can send you the plan and exam updates. You fill it once and it unlocks every Learn Crew tool for 30 days. Reply STOP on WhatsApp any time, or ask us to delete your details.',
    },
    {
      q: 'I am writing both CAT and MAT. Which one do I plan for?',
      a: 'Generate the nearer one first. CAT on 29 November comes before MAT December, so run the CAT plan, let it own the weeks up to CAT day, then generate the MAT plan starting the day after — three weeks to the paper-based test on 20 December, four to the computer-based one on the 27th. The overlap is smaller than it looks: CAT rewards depth inside a locked 40-minute section, MAT rewards speed and breadth across 200 questions, and the three weeks you then spend on MAT speed cost CAT nothing because CAT is already behind you.',
    },
  ],
  related: [
    'cat-percentile-target-calculator',
    'mba-exam-dates-2026',
    'mba-exam-eligibility-checker',
    'mba-cost-and-roi-calculator',
    'cgpa-percentage-converter',
    'pgcet-college-predictor',
  ],
  gate: 'soft',
  cta: CTA.matMocks,
  updated: '2026-10-20',
  sources: [
    { label: 'IIM CAT 2026 — official site', href: 'https://iimcat.ac.in/' },
    { label: 'AIMA MAT 2026 — official site', href: 'https://mat.aima.in/' },
    { label: 'KEA — PGCET 2026 question papers', href: 'https://cetonline.karnataka.gov.in/kea/QP2026' },
  ],
};

export default tool;
