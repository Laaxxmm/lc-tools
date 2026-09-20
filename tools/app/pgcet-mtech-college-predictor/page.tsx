import type { Metadata } from 'next';
import Link from 'next/link';
import ToolShell from '../../components/ToolShell';
import tool from '../../config/pgcet-mtech-college-predictor';
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

// Page-local styling, shared vocabulary with the MBA/MCA predictor so the two
// read as one family. Every value is a token from globals.css.
const css = `
.pc-hint, .pc-lede, .pc-src, .pc-cross { max-width: none; }
.pc-hint { margin-top: var(--s4); font-size: var(--t-md); }
.pc-empty { margin-top: var(--s4); }
.pc-empty p { max-width: none; }
.pc-h { margin: 0 0 var(--s1); }
/* Heading left, download right; they stack under the form on a narrow screen. */
.pc-bar {
  display: flex; flex-wrap: wrap; align-items: flex-end;
  justify-content: space-between; gap: var(--s3); margin: var(--s5) 0 var(--s3);
}
.pc-bar > div:first-child { flex: 1 1 22rem; min-width: 0; }
.pc-dl { flex: 0 0 auto; text-align: right; }
.pc-dl .btn { white-space: nowrap; }
.pc-dl-note { margin: 8px 0 0; font-size: var(--t-sm); max-width: 22rem; }
@media (max-width: 620px) {
  .pc-dl { text-align: left; flex: 1 1 100%; }
  .pc-dl .btn { width: 100%; }
  .pc-dl-note { max-width: none; }
}
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
.pc-code, .pc-college-code, /* The branch leads the line here: on M.Tech it is the thing being chosen. */
.pc-branch { font-weight: var(--w-semi); color: var(--ink); }
.pc-city {
  font-size: var(--t-sm); font-weight: var(--w-semi); letter-spacing: .06em;
  padding: 2px 8px; border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--forest) 8%, transparent); color: var(--forest);
}
/* The branch leads the line here: on M.Tech it is the thing being chosen. */
.pc-branch { font-weight: var(--w-semi); color: var(--ink); }
.pc-city {
  background: color-mix(in srgb, var(--amber) 16%, transparent); color: var(--ink);
}
.pc-years {
  margin: 10px 0 0; font-size: var(--t-sm); color: var(--muted);
  display: flex; flex-wrap: wrap; gap: var(--s3); max-width: none;
}
.pc-y { font-weight: var(--w-bold); color: var(--ink); }
.pc-more { margin: var(--s3) 0 0; }
.pc-field-note { margin: 6px 0 0; font-size: var(--t-sm); max-width: none; }
/* Round 2 closed at a BETTER rank than round 1 — worth spotting, not shouting. */
.pc-tight {
  font-size: var(--t-sm); font-weight: var(--w-semi);
  padding: 2px 8px; border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--amber) 20%, transparent); color: var(--ink);
}
.pc-src { margin: var(--s3) 0 0; font-size: var(--t-sm); }
.pc-cross { margin: var(--s5) 0 0; font-size: var(--t-base); }
@media (max-width: 560px) {
  .pc-row { padding: var(--s2); }
  /* The branch leads the line here: on M.Tech it is the thing being chosen. */
.pc-branch { font-weight: var(--w-semi); color: var(--ink); }
.pc-city {
  background: color-mix(in srgb, var(--amber) 16%, transparent); color: var(--ink);
}
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
      <h2>In M.Tech the branch is the cut-off, not the college</h2>
      <p>
        This is the difference that makes M.Tech its own tool rather than a third option
        on the MBA predictor. An MBA applicant is mostly choosing an institution. An
        M.Tech applicant is choosing a specialisation, and KEA allots every specialisation
        from its own pool of seats with its own closing rank.
      </p>
      <p>
        The spread inside a single campus is the proof. One college in KEA&rsquo;s 2025
        tables runs twenty-one separate M.Tech programmes; most run several; only
        forty-six of the hundred and twenty-three run just one. Computer Science and
        Structural Engineering at the same address routinely close thousands of ranks
        apart. A tool that told you &ldquo;this college is within reach&rdquo; without
        naming the course would be answering a question nobody asked.
      </p>
      <p>
        So every row here is a college and a branch together, and the specialisation
        filter is the first control worth using.
      </p>

      <h2>M.Tech ranks are not MBA ranks</h2>
      <p>
        Far fewer candidates sit the M.Tech paper, and the numbers reflect it. The widest
        closing rank in the 2025 M.Tech tables is about 8,400, where MBA runs past 31,000.
        A rank of 5,000 is mid-table for an MBA aspirant and close to the edge of the
        published M.Tech list.
      </p>
      <p>
        That matters if you have been reading MBA cut-off articles to calibrate
        expectations, or comparing notes with a friend writing a different paper. The same
        number means two different things. Judge your rank against this list, not against
        the one next door.
      </p>

      <h2>Which round you are looking at</h2>
      <p>
        The round selector defaults to round 2, and a seat appears there only if KEA
        actually allotted one in the second round. Seats that filled in round 1 and never
        reopened are removed, because they are not options for anyone entering later
        however reachable their first-round rank looks.
      </p>
      <p>
        Both rounds print on every row. &ldquo;Round 1 none&rdquo; marks a seat that
        appeared only in the second round. &ldquo;Tightened in round 2&rdquo; marks the
        case people find surprising: the second round closed at a <em>better</em> rank
        than the first. KEA re-runs allotment over everyone&rsquo;s full preference list
        each round, so stronger candidates can move into a seat that looked open. Later is
        not reliably easier.
      </p>

      <h2>Category, seat type and what M.Tech does not have</h2>
      <p>
        KEA encodes the seat type into the category code rather than publishing a separate
        column: codes ending in G, along with plain GM, are the Rest of Karnataka pool, and
        codes ending in H are the 371(j) Kalyana Karnataka pool. Those are separate pools
        with separate closing ranks, and you hold the second only if your eligibility
        certificate says so.
      </p>
      <p>
        One option you will not find here is the non-Karnataka seat type. KEA publishes
        that column for MBA and MCA but not for M.Tech, so there is nothing to show and the
        option is absent rather than present-but-empty. If you are a non-Karnataka
        candidate looking at MBA or MCA, the{' '}
        <Link href="/pgcet-college-predictor/">MBA and MCA predictor</Link> does carry it.
      </p>

      <h2>Filtering by city, and the honest gap in it</h2>
      <p>
        You are choosing somewhere to live for two years, so the list filters by city. The
        limit is worth stating plainly: KEA publishes no district column, and the M.Tech
        tables print clean institution names with no address at all, which resolves far
        fewer cities than the MBA tables do.
      </p>
      <p>
        Where a college also runs an MBA under a different code, the city is inherited from
        that longer name — which recovers most of them. The rest are grouped under
        &ldquo;Not stated&rdquo; and are never hidden from you: leave the filter on All
        cities and they appear like everything else.
      </p>

      <h2>Ordering your options</h2>
      <p>
        Put the branch you actually want to study first. KEA reads your list top down and
        gives you the first option your rank reaches, so a Safe seat in a specialisation
        you do not want, placed above a Moderate one in the specialisation you came for,
        costs you the course rather than saving you a risk.
      </p>
      <p>
        Two years in the wrong branch is a worse outcome than two years at a less famous
        college in the right one. Take the PDF, which carries every match rather than the
        forty rows on screen, and build the order offline before the portal opens.
      </p>
    </>
  );
}
