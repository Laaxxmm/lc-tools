import { CTA, type ToolConfig } from '../lib/types.ts';

// Evergreen tool 27. Family is 'general' — this is used by VTU engineering grads
// heading into PGCET, MAT applicants filling AIMA forms, and CAT candidates
// proving the 50% eligibility bar. None of those owns it, so it sits on forest
// and points at coaching rather than either mock ladder.
const tool: ToolConfig = {
  slug: 'cgpa-percentage-converter',
  title: 'CGPA to Percentage Converter: Your University’s Own Formula',
  tagline:
    'Convert both ways with the rule your university actually applies, because VTU, the 9.5 rule and a plain 10x give three different answers from one CGPA.',
  eyebrow: 'Marks and grades',
  family: 'general',
  description:
    'Convert CGPA to percentage and back using your own university rule: VTU, the 9.5 formula, direct 10x, Anna University or a custom multiplier.',
  keywords: [
    'cgpa to percentage',
    'percentage to cgpa',
    'vtu cgpa to percentage',
    'cgpa converter',
    '9.5 rule cgpa',
    'anna university cgpa percentage',
    'cgpa for mba application form',
  ],
  readMinutes: 6,
  faq: [
    {
      q: 'Which formula should I pick?',
      a: 'The one your own university publishes, and nothing else. Look at the back of your consolidated marks card or your programme regulations first, because most universities print the conversion rule there. If you studied at VTU, pick VTU. If your marks card shows a multiplier we have not listed, pick the custom option and type that number in.',
    },
    {
      q: 'Why does VTU subtract 0.75 before multiplying?',
      a: 'It is a fixed offset written into the VTU regulation, not something you derive. VTU sets percentage as (CGPA minus 0.75) times 10, which is roughly 7.5 marks below what a plain 10x conversion would give you. VTU does not publish a justification for the number and you do not need one. What matters is that using 10x instead inflates your percentage and can make an application form disagree with your degree certificate.',
    },
    {
      q: 'Is 9.5 a UGC rule or a CBSE rule?',
      a: 'It started with CBSE. CBSE used a 9.5 multiplier to convert its own Class 10 grade point average into an indicative percentage, and a number of universities and employers borrowed the same figure afterwards. It is not a national standard, and it is not a UGC instruction that binds your university. Use 9.5 only if your university prints 9.5.',
    },
    {
      q: 'Will CAT, MAT or PGCET accept the percentage this tool gives me?',
      a: 'They accept the percentage your university certifies, which is not always the number a converter produces. IIM CAT asks for the percentage as awarded by your university and says that where only a CGPA is awarded, the university’s own conversion applies. Use this tool to know roughly where you stand and to sanity-check what you have been given, then put the certified figure on the form.',
    },
    {
      q: 'What do I do if my university publishes no formula at all?',
      a: 'Ask the examination section for a conversion certificate in writing. Some universities will only certify the CGPA and will state that no percentage equivalent exists, which is a valid answer that application portals are built to handle. In that case enter the CGPA where the form allows it and attach the university letter. Do not convert it yourself and present the result as official.',
    },
    {
      q: 'My CGPA is out of 4, or out of 8. Can I use this?',
      a: 'Not directly. Every formula here assumes a 10-point scale, so a 3.6 on a 4-point scale will be read as 3.6 out of 10 and the answer will be badly wrong. The custom multiplier gets you an approximation if your institution has given you one, but a four-point GPA usually needs a formal equivalence letter rather than arithmetic.',
    },
    {
      q: 'Does rounding a 49.6 up to 50 matter?',
      a: 'It can decide whether your form is accepted. Most MBA entrance eligibility rules sit at 50 percent for the general category and 45 percent for reserved categories, and the checking is done against the certified figure rather than a rounded one. If you land within half a percent of a cut-off, get the university conversion certificate before you pay an application fee.',
    },
  ],
  related: [
    'mba-exam-eligibility-checker',
    'mba-exam-dates-2026',
    'cat-percentile-target-calculator',
    'mba-cost-and-roi-calculator',
  ],
  gate: 'none',
  cta: {
    ...CTA.coaching,
    note: 'Once the percentage on your form clears the eligibility bar, the next thing that decides an admission is the entrance score.',
  },
  updated: '2026-08-26',
  sources: [
    { label: 'VTU', href: 'https://vtu.ac.in/' },
    { label: 'Anna University', href: 'https://www.annauniv.edu/' },
    { label: 'CBSE', href: 'https://www.cbse.gov.in/' },
    { label: 'UGC', href: 'https://www.ugc.gov.in/' },
    { label: 'IIM CAT', href: 'https://iimcat.ac.in/' },
  ],
};

export default tool;
