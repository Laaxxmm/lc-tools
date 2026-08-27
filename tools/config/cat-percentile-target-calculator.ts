import { CTA, type ToolConfig } from '../lib/types.ts';

const tool: ToolConfig = {
  slug: 'cat-percentile-target-calculator',
  title: 'CAT Percentile Target Calculator: the score you need',
  tagline:
    'Pick a target tier. Get the percentile it usually takes, the raw score band behind it, and how many questions each section needs at your own accuracy.',
  eyebrow: 'CAT 2026',
  family: 'cat',
  description:
    'Pick your target B-school tier and see the CAT percentile, raw score band and attempts per section it needs at your own accuracy. The answer is free.',
  keywords: [
    'cat percentile calculator',
    'cat score vs percentile',
    'cat 2026 target percentile',
    'percentile required for iim',
    'cat attempts per section',
    'cat accuracy calculator',
    'raw score for 99 percentile cat',
  ],
  shortName: "Percentile target",
  icon: 'target',
  oneLiner: "The score your target college needs",
  readMinutes: 6,
  faq: [
    {
      q: 'Do the IIMs publish a score-to-percentile table?',
      a: 'No. Your scorecard shows your scaled score and your percentile, and that is the only mapping the IIMs release. They do not publish the normalisation formula either. Every score-to-percentile chart you find online, including the bands in this tool, is built from scorecards candidates chose to share after results. Treat all of them as estimates.',
    },
    {
      q: 'What raw score is 99 percentile in CAT?',
      a: 'On the recent 68-question paper it has usually taken somewhere around 86 to 92 marks out of 204. The band moves year to year with paper difficulty and with how many people write the exam, so plan against the top of it rather than the bottom.',
    },
    {
      q: 'How accurate is this estimate?',
      a: 'It is good enough to plan a mock strategy and not good enough to bet an application on. The band is drawn from reported scorecards across recent cycles, and a harder paper pushes every percentile down while an easier one pushes it up. If your mock series publishes its own percentile projections, compare the two and take the more conservative number.',
    },
    {
      q: 'What accuracy should I assume?',
      a: 'Use your real number from your last three or four full-length mocks, section by section, not the number you would like to have. Correct answers divided by attempted questions in that section. Most people who reach 99 percentile sit somewhere between 70 and 85 percent, and it varies a lot by section.',
    },
    {
      q: 'Why does the tool refuse to work below 25 percent accuracy?',
      a: 'A correct MCQ is worth 3 marks and a wrong one costs 1, so an attempt at accuracy a is worth 4a minus 1 on average. That hits zero at 25 percent. Below it, every extra question you touch drags your score down, so there is no attempt target that gets you anywhere.',
    },
    {
      q: 'Do I need a sectional percentile as well as an overall one?',
      a: 'Yes, and it is the part people forget. Every IIM sets a sectional minimum alongside the overall one, and a strong QA score cannot rescue a VARC percentile that sits below the bar. If one section is far behind the other two, fix that before you chase more marks in your strongest one.',
    },
    {
      q: 'Is 99 percentile enough for IIM Ahmedabad?',
      a: 'It puts you in the conversation rather than in the class. IIM Ahmedabad publishes a minimum near 80 percentile overall, but that is the eligibility floor, not the shortlist bar, and for a general-category engineering male the real bar has sat close to 99 and above in recent cycles. Your Class 10, Class 12 and graduation marks, work experience and academic diversity all move the composite score after that.',
    },
  ],
  related: [
    'cat-mat-study-plan-generator',
    'mba-exam-dates-2026',
    'mba-exam-eligibility-checker',
    'mba-cost-and-roi-calculator',
  ],
  gate: 'email',
  cta: CTA.matMocks,
  updated: '2026-08-26',
  sources: [
    { label: 'CAT 2026 official site (iimcat.ac.in)', href: 'https://iimcat.ac.in/' },
    { label: 'IIM Ahmedabad', href: 'https://www.iima.ac.in/' },
    { label: 'IIM Bangalore', href: 'https://www.iimb.ac.in/' },
    { label: 'IIM Calcutta', href: 'https://www.iimcal.ac.in/' },
    { label: 'FMS Delhi', href: 'https://www.fms.edu/' },
  ],
};

export default tool;
