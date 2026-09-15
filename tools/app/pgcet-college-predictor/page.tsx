import type { Metadata } from 'next';
import Link from 'next/link';
import ToolShell from '../../components/ToolShell';
import tool from '../../config/pgcet-college-predictor';
import { toolUrl } from '../../lib/shell';
import Predictor from './Predictor';

export const metadata: Metadata = {
  openGraph: {
    title: tool.title,
    description: tool.description,
    url: `/tools/${tool.slug}/`,
    type: 'article',
    siteName: 'Learn Crew',
    locale: 'en_IN',
    images: [{ url: `/tools/og/${tool.slug}.png`, width: 1200, height: 630, alt: tool.title }],
  },
  twitter: { card: 'summary_large_image', title: tool.title,
    description: tool.description, images: [`/tools/og/${tool.slug}.png`] },
  title: tool.title,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: toolUrl(tool.slug) },
};

// Page-local styling. Every value is a token from globals.css.
const css = `
.pc-hint, .pc-lede, .pc-src, .pc-cross { max-width: none; }
.pc-hint { margin-top: var(--s4); font-size: var(--t-md); }
.pc-empty { margin-top: var(--s4); }
.pc-empty p { max-width: none; }
.pc-h { margin: var(--s5) 0 var(--s1); }
.pc-lede { margin: 0 0 var(--s3); font-size: var(--t-base); }
.pc-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s2); }
.pc-row { padding: var(--s3); border-left: 4px solid var(--line); }
.pc-safe { border-left-color: var(--forest); }
.pc-moderate { border-left-color: var(--amber); }
.pc-reach { border-left-color: var(--line); }
/* Grid, not flex: the tag holds its own column so a long college name wraps
   inside its half instead of shoving the tag onto a line of its own. */
.pc-head {
  display: grid; grid-template-columns: 1fr auto;
  align-items: start; gap: var(--s2);
}
/* KEA prints these in caps with the postal address run on, and we keep its exact
   wording so a student can match a row against KEA's own option-entry list. Caps
   at full weight shout, so the weight comes down and the tracking opens up. */
.pc-name {
  margin: 0; max-width: none;
  font-weight: var(--w-med); font-size: var(--t-base);
  letter-spacing: .015em; line-height: 1.45; color: var(--ink);
}
.pc-tag {
  justify-self: end; font-size: var(--t-sm); font-weight: var(--w-bold); text-transform: uppercase;
  letter-spacing: .1em; padding: 6px 14px; border-radius: 999px;
  border: 1.5px solid transparent; white-space: nowrap;
}
.pc-tag-safe { background: var(--forest); color: var(--cream); }
.pc-tag-moderate { background: var(--amber); color: var(--ink); }
.pc-tag-reach { background: transparent; border-color: var(--line); color: var(--muted); }
.pc-prog {
  margin: 6px 0 0; font-size: var(--t-base); color: var(--muted);
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px; max-width: none;
}
.pc-code, .pc-college-code {
  font-size: var(--t-sm); font-weight: var(--w-semi); letter-spacing: .06em;
  padding: 2px 8px; border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--forest) 8%, transparent); color: var(--forest);
}
.pc-years {
  margin: 10px 0 0; font-size: var(--t-sm); color: var(--muted);
  display: flex; flex-wrap: wrap; gap: var(--s3); max-width: none;
}
.pc-y { font-weight: var(--w-bold); color: var(--ink); }
.pc-more { margin: var(--s3) 0 0; }
.pc-src { margin: var(--s3) 0 0; font-size: var(--t-sm); }
.pc-cross { margin: var(--s5) 0 0; font-size: var(--t-base); }
@media (max-width: 560px) {
  .pc-row { padding: var(--s2); }
  .pc-years { gap: var(--s2); }
}
`;

export default function Page() {
  return (
    <>
      <style>{css}</style>
      <ToolShell tool={tool} explainer={<Explainer />}>
        <Predictor />
      </ToolShell>
    </>
  );
}

function Explainer() {
  return (
    <>
      <hr className="rule" />
      <h2>A college does not have a cut-off. A programme does.</h2>
      <p>
        This is the single thing most predictors get wrong, and it is worth understanding
        before you trust any list, including this one. Karnataka colleges rarely run one
        course. A single institution will offer a general MBA alongside finance, marketing,
        fintech or an analytics stream, and KEA allots each of those from its own pool of
        seats with its own closing rank.
      </p>
      <p>
        Those ranks are not near each other. In KEA&rsquo;s own 2024 tables there is a college
        where the general MBA closed at 3,683 while another programme in the same building
        closed at 35,266. That is a gap of thirty-one thousand ranks inside one campus. Roll
        them into a single row labelled with the college name and you have built a tool that
        tells a student at rank 30,000 the college is within reach, when the course they
        actually wanted shut almost ten times earlier.
      </p>
      <p>
        So every row here is a programme, not a college, and you will see the same college
        more than once when it runs more than one course. The two-letter code next to each
        row is KEA&rsquo;s own programme code, which is what you will be selecting against
        during option entry.
      </p>

      <h2>Which years this uses, and why not the newest one</h2>
      <p>
        The lists are built from KEA&rsquo;s published seat allotment tables for PGCET 2023 and
        2024. Both years are printed against every programme rather than averaged into one
        figure, because the distance between them is the honest signal. A programme that
        closed at 5,100 one year and 8,366 the next is telling you its boundary swings by
        three thousand ranks, and a single blended number hides exactly that.
      </p>
      <p>
        The obvious question is why 2025 is missing when it is more recent. KEA changed the
        format that year, and in the new tables the programme name is cut off at the edge of
        its column. The practical effect is that two different courses at one college can
        arrive carrying an identical label. One university in our extract reports four
        separate General Merit closing ranks &mdash; 1,018, 2,599, 7,160 and 15,801 &mdash;
        under what reads as a single programme, and nothing in the published file says which
        number belongs to which course.
      </p>
      <p>
        We could have picked one of those four and shipped it. Taking the highest would
        flatter every result and quietly overstate what your rank reaches; taking the lowest
        would scare people off colleges they would have got. Both are guesses wearing the
        authority of an official number, so the tool stays on the two years that resolve
        cleanly and says so.
      </p>

      <h2>Reading Safe, Moderate and Reach</h2>
      <p>
        <strong>Safe</strong> means your rank is ahead of that programme&rsquo;s closing rank
        in both years. It stayed open past you even in the tighter of the two, which is as
        much reassurance as historical data can honestly give.
      </p>
      <p>
        <strong>Moderate</strong> means you are inside the more generous year but not the
        tighter one. Whether it comes to you depends on which way this cycle moves, so these
        are worth listing and not worth relying on.
      </p>
      <p>
        <strong>Reach</strong> means you are past even the easier year, but by less than
        fifteen per cent. Boundaries do drift outward in a year with more seats or a harder
        paper, so these are real possibilities rather than wishes. Anything further out is
        left off the list rather than padded in to make the result look generous.
      </p>

      <h2>Category and seat type are one decision, not two</h2>
      <p>
        KEA does not publish a separate seat type column. It encodes the seat type into the
        category itself: the codes ending in G, along with plain GM, are the Rest of Karnataka
        pool, and the codes ending in H are the 371(j) Kalyana Karnataka pool. Your 2A on the
        general list is <span className="el-k">2AG</span>; the same 2A under 371(j) is{' '}
        <span className="el-k">2AH</span>. They are different pools with different closing
        ranks, often thousands of ranks apart at the same college.
      </p>
      <p>
        Which means picking the 371(j) option because the numbers look kinder is not a
        strategy, it is a list of seats you cannot claim. You hold that reservation only if
        your eligibility certificate says so. Pick the one you actually have.
      </p>

      <h2>You need a rank, not marks</h2>
      <p>
        This tool starts from a rank, because that is what KEA allots against. Turning marks
        into a likely rank is a different calculation built on the mark-and-rank pairs from
        the last cycle, and it lives on the main site: the{' '}
        <a href="https://learncrew.org/pgcet-rank-college-predictor/">
          PGCET rank predictor
        </a>{' '}
        estimates your rank first, and you bring that number back here for the college list.
      </p>
      <p>
        Once your actual result is out, use the rank KEA printed and nothing else. An
        estimate is a bridge to use while you wait, not a second opinion to weigh against the
        real thing.
      </p>

      <h2>What to do with the list you get</h2>
      <p>
        Order your options by what you genuinely want, not by how likely each one is. KEA
        reads your list from the top and gives you the first option your rank reaches, so
        placing a Safe college above a Moderate one you would rather attend costs you the
        better seat for no benefit at all.
      </p>
      <p>
        The failure that actually hurts runs the other way: a list built entirely from Reach
        rows can return nothing, and you wait for the next round with no seat in hand. Put
        what you want at the top, keep the Moderate rows in the middle, and make sure the
        bottom of your list holds something you would genuinely accept.
      </p>
      <p>
        Then research the shortlist properly before the portal opens &mdash; placement records
        for your specialisation, fees against what you can actually afford, and whether you
        would live in that city for two years. The{' '}
        <Link href="/mba-cost-and-roi-calculator/">cost and ROI calculator</Link> is built for
        the second of those, and a seat you decline in a later round is worth less than a
        slightly lower-ranked college you would actually attend.
      </p>

      <h2>What this cannot tell you</h2>
      <p>
        It cannot tell you 2026&rsquo;s closing ranks, because nobody can. Three things move
        them between cycles: how many candidates sat the paper, how hard it was, and whether
        the seat matrix changed because a college added an intake or a branch was withdrawn.
        Any one of those moves a boundary by hundreds of places.
      </p>
      <p>
        Treat last year&rsquo;s numbers as a map of the terrain rather than a set of promises.
        A programme that closed at 4,500 tells you it sits in that neighbourhood. It does not
        tell you it will close at 4,500 again, and any tool that implies otherwise is selling
        you confidence it does not have.
      </p>
    </>
  );
}
