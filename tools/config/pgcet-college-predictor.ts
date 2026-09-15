import { CTA, type ToolConfig } from '../lib/types.ts';

// The first tool on the PGCET ground, and the one the hub's PGCET group was
// waiting for. It answers the rank-to-college half of the question; the marks-to-
// rank half lives on the main site and the explainer links to it, so the two
// pages feed each other instead of competing for the same query.
const tool: ToolConfig = {
  slug: 'pgcet-college-predictor',
  title: 'PGCET College Predictor: what your rank can actually get you',
  tagline:
    'Enter your Karnataka PGCET rank and category. You get every MBA or MCA programme that closed near it in KEA’s 2025 second-round allotment, sorted safest first, filterable by city, and downloadable in full as a PDF to take into option entry.',
  eyebrow: 'PGCET · College predictor',
  family: 'pgcet',
  description:
    'Enter your Karnataka PGCET rank and category to see which MBA and MCA colleges closed near it in KEA 2025, tagged Safe, Moderate or Reach. Filter by city, download as PDF.',
  keywords: [
    'pgcet college predictor',
    'karnataka pgcet college predictor',
    'pgcet rank wise college list',
    'pgcet mba college cutoff',
    'pgcet mca college cutoff',
    'kea pgcet cutoff rank 2025',
    'pgcet 371j kalyana karnataka cutoff',
    'pgcet colleges in bangalore rank',
    'pgcet option entry college list',
    'pgcet college list pdf download',
  ],
  shortName: 'PGCET college predictor',
  icon: 'compass',
  oneLiner: 'Which PGCET colleges your rank reaches',
  readMinutes: 7,
  faq: [
    {
      q: 'Which cut-offs does this predictor use?',
      a: 'KEA’s own published seat allotment table for PGCET 2025, second round, covering MBA and MCA. Second round is the right one to shortlist against: closing ranks move outward as stronger candidates take their seats elsewhere, so it is the most permissive published boundary and the honest answer to whether a seat could have reached you. Every row prints the exact rank that programme closed at, so you can check the reasoning rather than trust it.',
    },
    {
      q: 'Can I see only the colleges in my city?',
      a: 'Yes. The city filter holds about twenty-five Karnataka cities, from Bengaluru and Mysuru through Hubballi, Belagavi, Mangaluru and Kalaburagi. One caveat worth knowing: KEA publishes no district column, so the city is recovered from the college name and address it does print, which resolves roughly three quarters of them. The rest sit under “Not stated” and are never hidden from you — there is simply no city we can establish without guessing, and a guessed city on a two-year decision is worse than an honest blank.',
    },
    {
      q: 'Can I download the list?',
      a: 'Yes, as a PDF, and it carries every single match rather than the page you can see. The screen stops at forty rows because a strong rank can reach three hundred programmes and nobody reads that on a phone, but the document is the complete list. It is laid out for option entry — chance, closing rank, college, programme and city in columns, ordered safest first — so you can sit with it and build your preference order before the portal opens.',
    },
    {
      q: 'Why does one college appear more than once in my results?',
      a: 'Because a college is not a cut-off; a programme is. Most Karnataka colleges run several — a general MBA alongside finance, marketing, fintech or an analytics stream — and KEA allots each from its own seat pool with its own closing rank. Those ranks are not close together. At one college in our data the general MBA closed at 3,683 while another programme in the same building closed at 35,266. Merging them into a single college row would tell a rank-30,000 student that the college is within reach when the course they actually wanted shut ten times earlier.',
    },
    {
      q: 'What do Safe, Moderate and Reach actually mean here?',
      a: 'Safe means your rank is comfortably inside where that programme closed — ahead of it by fifteen per cent or more, so an ordinary year-to-year swing should not put it out of range. Moderate means you are inside the closing rank but near it, which is realistic without being something to build a whole option list around. Reach means you are just past it, within about fifteen per cent, close enough that a year with more seats or a harder paper could bring it to you. Anything further out is left off entirely rather than padded in to make the result look longer.',
    },
    {
      q: 'What is the 371(j) seat type and should I pick it?',
      a: 'It is the Kalyana Karnataka reservation under Article 371(j) of the Constitution, covering the Kalaburagi division districts, and you hold it only if your eligibility certificate says so. It is not a second attempt at a better answer: KEA allots those seats from a separate pool with its own closing ranks, which in several colleges sit thousands of ranks away from the Rest of Karnataka list. Pick the one your certificate actually gives you, because the list you get from the wrong one describes seats you cannot claim.',
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
