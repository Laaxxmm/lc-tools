import { CTA, type ToolConfig } from '../lib/types.ts';

// Pre-exam tool 1. Family is 'general': it answers for ten exam bodies at once, so
// neither PGCET nor MAT owns the page. It sits on forest and points at the mock
// ladder, because the people who land here are three months from writing something.
const tool: ToolConfig = {
  slug: 'mba-exam-eligibility-checker',
  title: 'MBA Exam Eligibility Checker: CAT, MAT, XAT and Seven More',
  tagline:
    'Enter your degree, your marks and your category. You get a straight answer for ten entrance exams, each with the rule that decided it and the official page it came from.',
  eyebrow: 'Eligibility',
  family: 'general',
  description:
    'Check which of CAT, MAT, XAT, NMAT, SNAP, CMAT, NIMCET, CUET PG, PGCET and MAH CET you can write, with the rule behind every answer. Free, no signup.',
  keywords: [
    'mba exam eligibility',
    'cat eligibility criteria',
    'mat eligibility',
    'xat eligibility',
    'snap eligibility 45 percent',
    'cmat eligibility',
    'nimcet eligibility',
    'karnataka pgcet eligibility',
    'mah cet mba eligibility',
    'final year mba entrance exam',
  ],
  shortName: "Eligibility checker",
  icon: 'check',
  oneLiner: "Which exams you can actually write",
  readMinutes: 6,
  faq: [
    {
      q: 'Can I apply while I am still in my final year of graduation?',
      a: 'Yes, and that is true for all ten exams here. You apply on the aggregate you hold now, and you produce the degree certificate or the final marks card when the institute asks for it, which is at admission rather than at application. If your current aggregate is under the bar, you are not out either — the number is not final until you graduate, so the tool tells you how many percentage points you still need.',
    },
    {
      q: 'What is the minimum percentage for MBA entrance exams?',
      a: 'There is no single number, which is why the answer on most pages is wrong for somebody. CAT, SNAP, Karnataka PGCET and MAH CET publish a bar of 50%. MAT, XAT, NMAT, CMAT and CUET PG publish none at all and leave it to the institute reading your score. NIMCET, which is the MCA route, asks for 60%. Check the exam you are actually writing rather than the average of the ten.',
    },
    {
      q: 'Do SC and ST candidates get 45% for every exam?',
      a: 'No. CAT drops to 45% for SC, ST and PwD, and SNAP drops to 45% for SC and ST, with no further condition attached. Karnataka PGCET gives 45% to SC, ST and Category-I candidates only if you hold Karnataka candidature under KEA clauses. MAH CET gives 45% to reserved categories, EWS and PwD only if you are domiciled in Maharashtra. NIMCET moves from 60% to 55%. The relaxation follows the exam, not the certificate.',
    },
    {
      q: 'Do EWS and OBC candidates get the lower percentage too?',
      a: 'Not for CAT or SNAP. Those two relax the eligibility bar for SC, ST and, in CAT, PwD. EWS and OBC non-creamy-layer candidates get reservation in seats, which is a different thing from a lower qualifying percentage, so the 50% still applies to you there. MAH CET is the exception on this list: it extends 45% to reserved categories and EWS, provided you are a Maharashtra candidate.',
    },
    {
      q: 'My marks card shows CGPA and no percentage. Which number do I enter?',
      a: 'Use your university’s own conversion, because that is the rule the exam body applies. The IIMs say so in the CAT notification: they take the university’s stated conversion, and where the university confirms it has none, they divide your CGPA by the maximum possible CGPA and multiply by 100. VTU is the one to watch in Karnataka, since it subtracts 0.75 before multiplying by 10, and that gap decides eligibility for anybody sitting near 50%.',
    },
    {
      q: 'Does work experience make me eligible or ineligible?',
      a: 'Neither. None of these ten exams asks for work experience, and every one of them admits freshers, so an empty experience column blocks you nowhere on this list. Experience earns weightage at shortlisting and interview in several institutes, and it becomes a hard requirement only on executive programmes, which these tests do not feed.',
    },
    {
      q: 'Can a B.Com or B.A. graduate write NIMCET?',
      a: 'No. NIMCET is the MCA test for the NITs, and it names the degrees it accepts: a three-year B.Sc, B.Sc (Hons), BCA or BIT, or a B.E./B.Tech. You also need Mathematics at 10+2 or in the degree. A commerce or arts graduate looking at MCA should be reading CUET PG and the state MCA CETs instead, where the degree rules are wider.',
    },
  ],
  related: [
    'cgpa-percentage-converter',
    'mba-exam-dates-2026',
    'cat-mat-study-plan-generator',
    'mba-cost-and-roi-calculator',
  ],
  gate: 'none',
  cta: CTA.matMocks,
  updated: '2026-08-26',
  sources: [
    { label: 'IIM CAT', href: 'https://iimcat.ac.in/' },
    { label: 'AIMA MAT', href: 'https://mat.aima.in/' },
    { label: 'XLRI XAT', href: 'https://xatonline.in/' },
    { label: 'NMAT by GMAC', href: 'https://www.nmat.org/' },
    { label: 'Symbiosis SNAP', href: 'https://www.snaptest.org/' },
    { label: 'NTA CMAT', href: 'https://exams.nta.ac.in/CMAT/' },
    { label: 'NIMCET', href: 'https://www.nimcet.in/' },
    { label: 'NTA CUET PG', href: 'https://exams.nta.ac.in/CUET-PG/' },
    { label: 'KEA Karnataka PGCET', href: 'https://cetonline.karnataka.gov.in/kea/' },
    { label: 'Maharashtra CET Cell', href: 'https://cetcell.mahacet.org/' },
  ],
};

export default tool;
