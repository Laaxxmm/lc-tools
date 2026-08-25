import type { Metadata } from 'next';
import ToolShell from '../../components/ToolShell';
import tool from '../../config/mba-exam-dates-2026';
import { toolUrl } from '../../lib/shell';
import Tracker from './Tracker';

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: toolUrl(tool.slug) },
};

// Page-local styling. Every value is a token from globals.css — the shared sheet
// stays the source of truth and picks up nothing that only one page uses.
const css = `
.xd-standfirst { max-width: 62ch; font-size: 17px; }
.xd-controls {
  display: flex; flex-wrap: wrap; align-items: flex-end;
  gap: var(--s3); margin: var(--s4) 0;
}
.xd-controls .field { margin: 0; min-width: 220px; }
.xd-toggle { margin: 0 0 6px; }
.xd-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--s2); }
.xd-row {
  display: grid; grid-template-columns: 116px 1fr;
  gap: var(--s3); align-items: start; padding: var(--s3);
}
.xd-count {
  text-align: center; padding: var(--s2) var(--s1); border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--forest) 6%, transparent);
}
.xd-n { display: block; font-size: 40px; font-weight: 800; line-height: 1; color: var(--burnt); }
.xd-u {
  display: block; margin-top: 4px; font-size: 12.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .12em; color: var(--muted);
}
.xd-soon { border-color: var(--amber); box-shadow: var(--shadow); }
.xd-soon .xd-count { background: color-mix(in srgb, var(--amber) 18%, transparent); }
.xd-kind {
  margin: 0 0 4px; font-size: 12.5px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .1em; color: var(--muted);
}
.xd-line { margin: 8px 0 0; font-size: 15.5px; max-width: 60ch; }
.xd-k { color: var(--muted); }
.xd-tag {
  display: inline-block; margin-left: 8px; padding: 1px 10px; border-radius: 999px;
  font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
  white-space: nowrap; vertical-align: 2px;
}
.xd-yes { background: var(--forest); color: var(--cream); }
.xd-no { background: color-mix(in srgb, var(--amber) 26%, transparent); color: var(--ink); }
.xd-note { margin: 10px 0 0; font-size: 14px; color: var(--muted); max-width: 60ch; }
.xd-src { color: var(--forest); font-weight: 700; }
.xd-foot { margin-top: var(--s3); max-width: 62ch; }
@media (max-width: 560px) {
  .xd-row { grid-template-columns: 92px 1fr; padding: var(--s2); }
  .xd-n { font-size: 33px; }
}
`;

export default function Page() {
  // Static export: this runs once, at build. The component reseeds from the
  // reader's own clock after hydration, so a stale cache cannot lie about days.
  const builtOn = new Date().toISOString().slice(0, 10);

  return (
    <>
      <style>{css}</style>
      <ToolShell tool={tool} explainer={<Explainer />}>
        <Tracker builtOn={builtOn} />
      </ToolShell>
    </>
  );
}

function Explainer() {
  return (
    <>
      <hr className="rule" />
      <h2>What the countdown is actually counting</h2>
      <p>
        The big number on each card is not days until the exam. It is days until the next
        thing that exam needs from you, which for most of this list is a registration
        deadline rather than a test date. The tracker holds three dates for every entrance,
        the day the form opens, the day it closes and the exam itself, and shows you whichever
        one is nearest. Once a window shuts, that card switches to counting down the paper.
      </p>
      <p>
        The ordering is deliberate. Missing an exam by a day and missing a form by a day cost
        you the same year, and the form almost always comes first. CAT is the clearest case.
        The paper is on 29 November 2026, which feels comfortably far away in August, but the
        form closes in September and the IIMs do not reopen it. Plan around the exam date
        instead of the form date and you get ninety-five relaxed-looking days and no seat at
        the end of them.
      </p>

      <h2>Confirmed and expected are not the same thing</h2>
      <p>
        Three exam dates here are confirmed. CAT 2026 is on 29 November. MAT runs its
        paper-based test on 13 September 2026 and its computer-based test on 20 September.
        CAT registration opening on 3 August 2026 is confirmed as well. Those came from the
        exam bodies, and they carry a Confirmed tag.
      </p>
      <p>
        Everything else is expected, including every single registration closing date on this
        page. None of them have been published yet. What you get instead is the pattern from
        recent cycles, tagged Expected on the row so you can tell at a glance which numbers
        you can bank and which ones you need to verify yourself.
      </p>
      <p>
        That distinction matters more than it sounds. Plenty of exam-date pages print an
        expected date in the same weight as a published one, and a student reading in a hurry
        cannot tell them apart. The cost of that lands entirely on the student. So the tag
        sits on every row, the filter at the top strips the expected ones out completely if
        you want only hard dates, and every card links the exam body&rsquo;s own site.
      </p>

      <h2>A worked example: 26 August 2026</h2>
      <p>
        Say you are writing MAT in September as a safety net and CAT in November as the real
        attempt. Take 26 August as your today and work it through.
      </p>
      <p>
        MAT&rsquo;s paper-based test on 13 September is 18 days out. AIMA has closed
        registration roughly a week before each test date in recent cycles, which puts the
        form near 6 September, or 11 days out. The number that belongs on your wall is 11,
        not 18.
      </p>
      <p>
        CAT&rsquo;s exam on 29 November is 95 days out. Registration is open and expected to
        close around mid-September, call it 20 days. The smaller number wins again. Your CAT
        deadline this month is the form, and those 95 days are study time you only get to
        spend if you meet it.
      </p>
      <p>
        Stack the two and the next three weeks look different from how they looked a minute
        ago. Two forms close inside twenty days and one exam sits inside eighteen. The MAT
        paper is your first hard stop, the CAT form is the second, and a study plan has to
        survive both. This is why the tool sorts by urgency rather than by date. A calendar
        in date order tells you what happens next. A tracker in urgency order tells you what
        to do next, and on a month like this one they are not the same list.
      </p>
      <p>
        Run the same exercise down the rest of the rows and the shape of your year appears.
        NMAT closes in October, CMAT opens in November, SNAP closes late November, XAT closes
        in early December. February asks nothing of you. That is planning information you
        cannot get from any single exam&rsquo;s website.
      </p>

      <h2>Writing three or four exams is the normal case</h2>
      <p>
        Most aspirants sit several, and the reason is arithmetic rather than ambition. CAT is
        one paper on one day, so a fever, a traffic jam or a bad ninety minutes costs you the
        whole cycle. A second and third exam is insurance, and it is cheap insurance because
        the syllabus overlaps heavily.
      </p>
      <p>
        The overlap is not total, which is where the calendar earns its keep. XAT carries a
        decision-making section nothing else tests. NMAT lets you book your own slot inside a
        window and retake, which rewards sitting early rather than late. SNAP runs three dates
        and counts your best one. Each of those is a scheduling decision rather than a syllabus
        decision, and you can only make it while looking at every date together.
      </p>
      <p>
        If you are headed for MCA instead, your year is quieter and later. NIMCET, MAH MCA CET
        and CUET PG all sit in the March to June 2027 stretch, with registration opening from
        December onwards. Use the stream filter to drop the MBA rows. CUET PG stays in both
        lists because central universities use it for both kinds of seat.
      </p>

      <h2>What we do not know, and will not pretend to</h2>
      <p>
        Karnataka PGCET sits at the bottom of the list pointing at 2027. The 2026 cycle has
        concluded, so if you wrote it, your live dates are KEA counselling and seat allotment
        and they come from the KEA portal, not from an entrance calendar.
      </p>
      <p>
        KMAT, TANCET and several other state tests are missing. We have no verified dates for
        them yet. A row holding an invented date is worse than no row at all, because on a
        page like this it looks exactly as trustworthy as the real ones.
      </p>

      <h2>When these numbers change</h2>
      <p>
        The day counts recompute in your browser against your own date, so the countdown is
        right even if this page has been sitting in a cache for a fortnight. The table itself
        does not self-correct. When an exam body publishes a notification we edit the row and
        move it from Expected to Confirmed, and the Updated date at the top says when that
        last happened.
      </p>
      <p>
        One habit beats any tracker. Put the two nearest deadlines from this page into your
        phone calendar with an alert a week early, then close the tab. A deadline you have to
        remember to check is a deadline you can miss.
      </p>
    </>
  );
}
