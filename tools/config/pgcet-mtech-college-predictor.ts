import { CTA, type ToolConfig } from '../lib/types.ts';

// Separate from the MBA/MCA predictor on purpose. M.Tech is a different exam
// paper, a different rank scale (closing ranks top out near 8,400 against MBA's
// 31,000) and a different question: the branch matters more than the college,
// because one institution runs up to 21 specialisations with their own cut-offs.
const tool: ToolConfig = {
  slug: 'pgcet-mtech-college-predictor',
  title: 'PGCET M.Tech College Predictor: your rank, branch by branch',
  tagline:
    'Enter your Karnataka PGCET M.Tech rank and category. You get every specialisation that closed near it in KEA’s 2025 allotments — filterable by branch and city, both rounds shown, and downloadable in full as a PDF for option entry.',
  eyebrow: 'PGCET · M.Tech predictor',
  family: 'pgcet',
  description:
    'Enter your Karnataka PGCET M.Tech rank to see which colleges and specialisations closed near it in KEA 2025, tagged Safe, Moderate or Reach. Filter by branch and city.',
  keywords: [
    'pgcet mtech college predictor',
    'karnataka pgcet m.tech cutoff',
    'pgcet mtech rank wise college list',
    'kea mtech cutoff rank 2025',
    'pgcet mtech computer science cutoff',
    'pgcet mtech structural engineering cutoff',
    'pgcet mtech vlsi cutoff',
    'pgcet mtech option entry',
    'm.tech colleges in karnataka by rank',
    'pgcet mtech branch wise cutoff',
  ],
  shortName: 'M.Tech predictor',
  icon: 'target',
  oneLiner: 'Which M.Tech branch your rank reaches',
  readMinutes: 6,
  faq: [
    {
      q: 'Why is M.Tech a separate predictor from MBA and MCA?',
      a: 'Because the question is a different shape. An MBA applicant is choosing a college; an M.Tech applicant is choosing a branch, and the branch is what carries the cut-off. One Karnataka college in KEA’s 2025 tables runs twenty-one separate M.Tech specialisations, each allotted from its own seat pool with its own closing rank — Computer Science and Structural Engineering at the same institution can sit thousands of ranks apart. The rank scale differs too: M.Tech closing ranks top out near 8,400 statewide where MBA runs past 31,000, so a number that means “comfortable” in one exam means “nowhere near” in the other. Mixing them into one tool would make both worse.',
    },
    {
      q: 'Which cut-offs does this use?',
      a: 'KEA’s published seat allotment tables for PGCET 2025 M.Tech, both the first and second rounds, across 123 colleges and 362 college-and-branch combinations. Every row prints both rounds so you can see whether a boundary moved, held, or appeared only in the second round. The round selector defaults to round 2, which is what a late entrant is actually choosing from.',
    },
    {
      q: 'Can I filter to just my branch?',
      a: 'Yes, and it is the first thing worth doing. There are about 120 distinct specialisations in the data, from Computer Science and Engineering through Structural Engineering, VLSI Design, Machine Design, Power Electronics and Data Science. The filter only lists branches that actually have a seat in your category and round, so it can never offer you a specialisation that returns nothing.',
    },
    {
      q: 'Why does the same college appear several times?',
      a: 'Because each row is a branch, not a college. That is the whole point of the tool: KEA allots M.Tech seats per specialisation, and a college being “within reach” is meaningless without saying which course. Forty-six colleges in the data run a single M.Tech programme, but most run several and one runs twenty-one.',
    },
    {
      q: 'What do Safe, Moderate and Reach mean?',
      a: 'Safe means your rank is comfortably inside where that seat closed — ahead of it by fifteen per cent or more. Moderate means you are inside the closing rank but near it. Reach means you are just past it, within about fifteen per cent, close enough that a year with more seats or a harder paper could bring it to you. Anything further out is left off the list rather than padded in to make the result look generous.',
    },
    {
      q: 'Does the non-Karnataka seat type apply to M.Tech?',
      a: 'No, and the tool does not offer it. KEA publishes a non-Karnataka column (NKN) for MBA and MCA but not for M.Tech, so there is nothing to show — rather than present an option that can only ever return an empty list, the seat type is simply absent here. If you hold a 371(j) Kalyana Karnataka certificate, that seat type is available and is a genuinely separate pool with its own closing ranks.',
    },
    {
      q: 'Will 2026 match these numbers?',
      a: 'No. Three things move a closing rank between cycles: how many candidates sat the paper, how hard it was, and whether the seat matrix changed because a college added an intake or withdrew a branch. M.Tech is especially sensitive to the last one, because a single specialisation withdrawn or added shifts a whole branch’s boundary. Use last year’s numbers as a map of the terrain, then confirm on KEA’s own site.',
    },
    {
      q: 'How should I order my options?',
      a: 'By the branch you actually want to study, then by college. KEA reads your list top down and gives you the first option your rank reaches, so putting a Safe seat in a branch you do not want above a Moderate one in the branch you do costs you the course you came for. Two years in the wrong specialisation is a worse outcome than a slightly less known college in the right one.',
    },
  ],
  related: [
    'pgcet-college-predictor',
    'mba-exam-eligibility-checker',
    'cgpa-percentage-converter',
    'mba-exam-dates-2026',
  ],
  gate: 'none',
  cta: CTA.pgcetMocks,
  updated: '2026-09-20',
  sources: [
    { label: 'KEA Karnataka PGCET', href: 'https://cetonline.karnataka.gov.in/kea/' },
    { label: 'KEA seat allotment results', href: 'https://cetonline.karnataka.gov.in/keawebentry456/' },
  ],
};

export default tool;
