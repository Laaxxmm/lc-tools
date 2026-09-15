import { CTA, type ToolConfig } from '../lib/types.ts';

// The first tool on the PGCET ground, and the one the hub's PGCET group was
// waiting for. It answers the rank-to-college half of the question; the marks-to-
// rank half lives on the main site and the explainer links to it, so the two
// pages feed each other instead of competing for the same query.
const tool: ToolConfig = {
  slug: 'pgcet-college-predictor',
  title: 'PGCET College Predictor: what your rank can actually get you',
  tagline:
    'Enter your Karnataka PGCET rank and category. You get every MBA or MCA programme that closed near it in KEA’s own 2023 and 2024 allotments, sorted safest first, with both years’ closing ranks printed next to each one.',
  eyebrow: 'PGCET · College predictor',
  family: 'pgcet',
  description:
    'Enter your Karnataka PGCET rank and category to see which MBA and MCA colleges closed near it in KEA 2023 and 2024, tagged Safe, Moderate or Reach. Free, no signup.',
  keywords: [
    'pgcet college predictor',
    'karnataka pgcet college predictor',
    'pgcet rank wise college list',
    'pgcet mba college cutoff',
    'pgcet mca college cutoff',
    'kea pgcet cutoff rank',
    'pgcet 371j kalyana karnataka cutoff',
    'which college for pgcet rank',
    'pgcet option entry college list',
    'pgcet closing rank 2024',
  ],
  shortName: 'PGCET college predictor',
  icon: 'compass',
  oneLiner: 'Which PGCET colleges your rank reaches',
  readMinutes: 7,
  faq: [
    {
      q: 'Which cut-offs does this predictor use?',
      a: 'KEA’s own published seat allotment tables for PGCET 2023 and 2024, for MBA and MCA. Both years are shown for every programme rather than one blended figure, because the gap between them is the useful part: a programme that closed at 5,000 one year and 8,400 the next is telling you its boundary moves by thousands, and no single number carries that. Where a programme published only one of the two years, the tool says so instead of inventing the other.',
    },
    {
      q: 'Why not 2025, when that is more recent?',
      a: 'KEA changed how it published the 2025 tables, and in that format the programme name is cut off at the column edge. The result is that two genuinely different courses at one college can arrive under an identical label. JSS in Mysuru reports four different General Merit closing ranks for what reads as a single programme, and there is no way from the published file to tell which belongs to which. Using it would blur two courses together and hand you a number that belongs to neither, so the tool stays on the two years that resolve cleanly.',
    },
    {
      q: 'Why does one college appear more than once in my results?',
      a: 'Because a college is not a cut-off; a programme is. Most Karnataka colleges run several — a general MBA alongside finance, marketing, fintech or an analytics stream — and KEA allots each from its own seat pool with its own closing rank. Those ranks are not close together. At one college in our data the general MBA closed at 3,683 while another programme in the same building closed at 35,266. Merging them into a single college row would tell a rank-30,000 student that the college is reachable when the course they actually want closed ten times earlier.',
    },
    {
      q: 'What do Safe, Moderate and Reach actually mean here?',
      a: 'Safe means your rank is ahead of that programme’s closing rank in both years we hold, so it stayed open past you even in its harder year. Moderate means you are inside the more generous year but not the tighter one, so it depends which way the cycle moves. Reach means you are just past the easiest year, within about fifteen per cent of it, which is close enough that a year with more seats or fewer candidates could bring it to you. Anything further out is left off the list entirely rather than padded in to make the result look longer.',
    },
    {
      q: 'What is the 371(j) seat type and should I pick it?',
      a: 'It is the Kalyana Karnataka reservation under Article 371(j) of the Constitution, covering the Kalaburagi division districts, and you hold it only if your eligibility certificate says so. It is not a second attempt at a better answer: KEA allots those seats from a separate pool with its own closing ranks, which in several colleges sit thousands of ranks apart from the Rest of Karnataka list. Pick the one your certificate actually gives you, because the list you get from the wrong one describes seats you cannot claim.',
    },
    {
      q: 'I know my marks but not my rank. Can I still use this?',
      a: 'Not directly — this tool starts from a rank. Converting marks into a likely rank is a separate calculation built on the mark-and-rank pairs observed in the last cycle, and we run that on the main Learn Crew site. Get your estimated rank there first, then bring it back here for the college list. If your result is already out, use the rank KEA printed rather than any estimate, including ours.',
    },
    {
      q: 'Will my actual 2026 allotment match this list?',
      a: 'No, and no honest tool will promise otherwise. Three things move a closing rank between cycles: how many candidates sat the paper, how hard it was, and whether the seat matrix changed because a college added an intake or withdrew a branch. Any one of those shifts a boundary by hundreds of places. Last year’s numbers are a map of the terrain, not a set of promises — use them to build a shortlist worth researching, then confirm everything on KEA’s own site.',
    },
    {
      q: 'How should I order these colleges in option entry?',
      a: 'In the order you genuinely want them, not in the order of how likely they are. KEA runs your list top down and gives you the first option your rank reaches, so a Safe college placed above a Moderate one you would rather attend costs you the better seat. The mistake that actually hurts is the opposite one: a list made only of Reach colleges, which can return nothing at all. Put what you want at the top, and make sure there is something you would accept at the bottom.',
    },
  ],
  related: [
    'mba-exam-eligibility-checker',
    'cgpa-percentage-converter',
    'mba-cost-and-roi-calculator',
    'mba-exam-dates-2026',
  ],
  gate: 'none',
  cta: CTA.pgcetMocks,
  updated: '2026-09-15',
  sources: [
    { label: 'KEA Karnataka PGCET', href: 'https://cetonline.karnataka.gov.in/kea/' },
    { label: 'KEA seat allotment results', href: 'https://cetonline.karnataka.gov.in/keawebentry456/' },
  ],
};

export default tool;
