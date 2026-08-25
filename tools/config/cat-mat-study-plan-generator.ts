import { CTA, type ToolConfig } from '../lib/types.ts';

const tool: ToolConfig = {
  slug: 'cat-mat-study-plan-generator',
  title: 'CAT & MAT Study Plan Generator: your weeks mapped to exam day',
  tagline:
    'Give it your exam date, the hours you actually have, and your weakest section. It returns a week-by-week plan with the sectional split and the mock checkpoints already placed.',
  eyebrow: 'CAT & MAT · Study planner',
  family: 'cat',
  alsoServes: ['mat'],
  description:
    'Free CAT and MAT study plan generator. Enter your exam date, daily hours and weakest section for a week-by-week plan with mock checkpoints.',
  keywords: [
    'cat study plan',
    'mat study plan',
    'cat 2026 study plan',
    'mat september 2026 preparation',
    'cat 3 month preparation plan',
    'mat 3 week plan',
    'study plan generator mba entrance',
    'cat sectional time split',
  ],
  readMinutes: 6,
  faq: [
    {
      q: 'How many hours a day do I need for CAT 2026?',
      a: 'There is no single number, and anyone quoting one is guessing. What matters is that the hours are real and repeatable. Three focused hours a day from 26 August to the CAT on 29 November comes to roughly 245 study hours and about 22 full mocks, which is enough to build a section you do not have yet. Two hours a day still works if you cut the syllabus down and stop trying to cover everything. Put in the number you will still be doing in week six, not the number you feel guilty about.',
    },
    {
      q: 'Can I still do something useful for MAT with three weeks left?',
      a: 'Yes, and the plan looks nothing like a three-month plan. With MAT on 13 September you get roughly 18 days, which is one triage week, one high-density mock week, and a taper. You revise what you already own, drill the question types you recognise on sight, and take mocks at the time of day your paper runs. What you do not do is start a new topic. Three weeks is not enough to build Mathematical Skills from scratch, and the hours spent trying come out of the sections that were already going to score.',
    },
    {
      q: 'Should I spend most of my time on my weakest section?',
      a: 'Early on, yes. Close to the exam, no. The generator moves ten percentage points of your time into your weakest section when the exam is more than eight weeks away, and only four when it is under a month. That is deliberate. Far out, a weak section is the highest-return place to put an hour. Near the exam, the same hour returns more if it keeps a strong section automatic, because a section you stop practising decays faster than a weak one improves.',
    },
    {
      q: 'How many mocks should I take before the exam?',
      a: 'Take as many as you can analyse properly, which is the real limit. The plan budgets four and a half hours for a CAT mock and five for a MAT mock, because the analysis has to be longer than the paper. One mock a fortnight during foundation is enough while you are still learning topics. Two a week once you are applying them, three a week in the mock block, and two in the final week with nothing new after the last one.',
    },
    {
      q: 'Does the plan cover MAT’s Indian & Global Environment section?',
      a: 'It gives it a small fixed slice and refuses to give it more. AIMA builds the MAT composite score from four sections and keeps Indian & Global Environment outside it, so hours moved there do not move your percentile. Fifteen minutes of news a day covers what you need. If you pick IGE as your weakest section the plan says so rather than quietly handing it a tenth of your preparation.',
    },
    {
      q: 'What do I get if I enter my email and phone number?',
      a: 'The downloadable copy of the plan, and nothing else is held back. Every week, every hour split, every checkpoint and every warning is on this page before you type anything. The download exists so the plan lives somewhere other than a browser tab. The WhatsApp checkbox is separate and unticked; leave it alone if you do not want exam updates.',
    },
    {
      q: 'I am writing both CAT and MAT. Which one do I plan for?',
      a: 'Generate the nearer one first. MAT on 13 or 20 September sits inside your CAT foundation phase, so run the MAT plan, let it own those weeks, then generate the CAT plan starting the day after your MAT. The overlap is smaller than it looks: MAT rewards speed and breadth across 200 questions, CAT rewards depth inside a locked 40-minute section, and the fortnight you spend on MAT speed does no harm to CAT.',
    },
  ],
  related: [
    'cat-percentile-target-calculator',
    'mba-exam-dates-2026',
    'mba-exam-eligibility-checker',
    'mba-cost-and-roi-calculator',
    'cgpa-percentage-converter',
  ],
  gate: 'email+phone',
  cta: CTA.matMocks,
  updated: '2026-08-26',
  sources: [
    { label: 'IIM CAT 2026 — official site', href: 'https://iimcat.ac.in/' },
    { label: 'AIMA MAT 2026 — official site', href: 'https://mat.aima.in/' },
  ],
};

export default tool;
