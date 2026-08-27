import type { Metadata } from 'next';
import Link from 'next/link';
import ToolShell from '../../components/ToolShell';
import tool from '../../config/mba-exam-eligibility-checker';
import { toolUrl } from '../../lib/shell';
import Checker from './Checker';

export const metadata: Metadata = {
  openGraph: {
    title: tool.title,
    description: tool.description,
    url: `/tools/${tool.slug}/`,
    type: 'article',
    siteName: 'Learn Crew',
    locale: 'en_IN',
    images: [{ url: '/tools/og-default.png', width: 1200, height: 630, alt: tool.title }],
  },
  twitter: { card: 'summary_large_image', title: tool.title,
    description: tool.description, images: ['/tools/og-default.png'] },
  title: tool.title,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: toolUrl(tool.slug) },
};

// Page-local styling. Every value is a token from globals.css — the shared sheet
// stays the source of truth and picks up nothing that only one page uses.
const css = `
.el-standfirst { max-width: none; font-size: var(--t-md); }
/* Same three-column grid every other tool uses. auto-fit was landing 5+1. */
.el-form {
  display: grid; gap: var(--s3); margin: var(--s4) 0 var(--s3);
  grid-template-columns: 1fr;
}
@media (min-width: 620px) { .el-form { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 940px) { .el-form { grid-template-columns: repeat(3, 1fr); } }
.el-form .field { margin: 0; }
.el-checks { display: grid; gap: var(--s1); margin-bottom: var(--s4); }
.el-checks .consent { margin: 0; }
.el-summary {
  max-width: none; font-size: var(--t-md); margin: 0;
  padding: var(--s3); border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--forest) 6%, transparent);
}
.el-list { list-style: none; margin: var(--s3) 0 0; padding: 0; display: grid; gap: var(--s2); }
.el-row { padding: var(--s3); }
.el-head {
  display: flex; flex-wrap: wrap; align-items: center;
  justify-content: space-between; gap: var(--s2);
}
.el-tag {
  font-size: var(--t-sm); font-weight: var(--w-bold); text-transform: uppercase;
  letter-spacing: .1em; padding: 8px 16px; border-radius: 999px;
  border: 1.5px solid transparent; white-space: nowrap;
}
.el-yes { background: var(--forest); color: var(--cream); box-shadow: 0 6px 16px -8px rgba(14,59,46,.6); }
.el-maybe { background: var(--amber); color: var(--ink); box-shadow: 0 6px 16px -8px rgba(232,163,61,.7); }
.el-no { background: transparent; border-color: var(--line); color: var(--muted); }
/* A row you clear is worth spotting from a scroll. */
.el-row { border-left: 4px solid var(--line); }
.el-row:has(.el-yes) { border-left-color: var(--forest); }
.el-row:has(.el-maybe) { border-left-color: var(--amber); }
.el-detail { margin: 10px 0 0; font-size: var(--t-base); max-width: none; }
.el-rule { margin: 8px 0 0; font-size: var(--t-sm); color: var(--muted); max-width: none; }
.el-k { font-weight: var(--w-semi); }
.el-note { margin: var(--s2) 0 0; font-size: var(--t-sm); color: var(--muted); max-width: none; }
.el-src { color: var(--forest); font-weight: 700; }
.el-foot { display: grid; gap: var(--s1); margin-top: var(--s4); }
@media (max-width: 560px) {
  .el-row { padding: var(--s2); }
}
`;

export default function Page() {
  return (
    <>
      <style>{css}</style>
      <ToolShell tool={tool} explainer={<Explainer />}>
        <Checker />
      </ToolShell>
    </>
  );
}

function Explainer() {
  return (
    <>
      <hr className="rule" />
      <h2>One question, ten rulebooks</h2>
      <p>
        Almost every page that answers this prints the same number: 50% in graduation. That
        figure is real for four of the exams on this list and imaginary for five of them, and
        the difference decides your year if your marks card sits anywhere near the line.
      </p>
      <p>
        Four bodies publish a bar of their own: CAT, SNAP, Karnataka PGCET and MAH CET all ask
        for 50% aggregate in a bachelor&rsquo;s degree of at least three years. NIMCET, the MCA
        route into the NITs, asks for 60% and Mathematics. The remaining five publish no
        percentage at all. AIMA wants a bachelor&rsquo;s degree for MAT and stops there, XLRI
        wants three years of one for XAT, GMAC sets nothing for NMAT, and NTA hands CMAT and
        CUET PG eligibility to the universities behind them.
      </p>

      <h2>Eligible to write is not the same as eligible to join</h2>
      <p>
        Two separate authorities are involved and they do not always agree. The exam body
        decides whether you may register and sit the paper. Admission afterwards belongs to
        the institute reading your score, and it can set a higher bar than the test did.
      </p>
      <p>
        A green result here means you may register. Amber on MAT or CMAT means the exam body
        will take your form and let you write, while the college behind it holds the number
        that matters. Knowing which of the two is blocking you tells you whether to fix your
        marks or change your college list.
      </p>

      <h2>The 45% relaxation is not a blanket</h2>
      <p>
        CAT drops from 50% to 45% for SC, ST and PwD candidates. SNAP does the same for SC and
        ST, and NIMCET moves from 60% to 55%. Notice who is missing: EWS and OBC non-creamy-layer
        candidates get reservation in seats, which is a different mechanism from a lower
        qualifying percentage, so 50% still applies to you at CAT and SNAP.
      </p>
      <p>
        Both state exams attach a condition on top. KEA gives 45% to SC, ST and Category-I
        candidates for Karnataka PGCET, but only where you hold Karnataka candidature under its
        eligibility clauses. Maharashtra goes wider, extending 45% to reserved categories, EWS
        and PwD, then narrows it again to candidates domiciled in the state. Live elsewhere and
        you are back at 50%.
      </p>
      <p>
        That is why some answers come back amber rather than green. Sit between 45 and 50 with
        SC ticked for Karnataka PGCET and your eligibility turns on candidature this page
        cannot verify, so printing a yes would be a guess dressed as an answer.
      </p>

      <h2>CGPA is where this goes wrong quietly</h2>
      <p>
        Your marks card may carry no percentage at all, and the conversion you pick changes the
        verdict. The IIMs publish the rule they follow: they use your university&rsquo;s own
        stated conversion, and where the university confirms it has none, they divide your CGPA
        by the maximum possible CGPA and multiply by 100. Most exam bodies work the same way.
      </p>
      <p>
        VTU is the case to watch in Karnataka, since it subtracts 0.75 before multiplying by
        ten. A 5.6 CGPA is 56% under a plain conversion and 48.5% under VTU&rsquo;s, and one of
        those clears CAT while the other does not. Use the formula your university applies, not
        the one that flatters you; the{' '}
        <Link href="/cgpa-percentage-converter/">CGPA converter</Link> lays them side by side.
      </p>

      <h2>A worked example: 5.6 CGPA at VTU, final year</h2>
      <p>
        Rahul is in the final year of a B.E. at a VTU-affiliated college in Bengaluru. Six
        semesters in, his CGPA is 5.6. General category, no work experience, Mathematics at
        10+2. VTU&rsquo;s own rule turns that into (5.6 &minus; 0.75) &times; 10, which is
        48.5%.
      </p>
      <p>
        CAT reads 48.5 against a 50% bar with no relaxation available to him, so he is short by
        1.5 points. He is not finished, though. His aggregate is not final until he graduates,
        and two more semesters at a better average close that gap, so the tool marks CAT amber
        and names the number he needs. SNAP produces the same arithmetic and the same answer.
      </p>
      <p>
        MAT, XAT, NMAT, CMAT and CUET PG come back amber for a different reason. None of them
        sets a percentage bar, so Rahul can register for all five today at 48.5%. The
        institutes he applies to afterwards will have their own numbers, and several will want
        50%. Writing the test was never his constraint. The application is.
      </p>
      <p>
        NIMCET accepts his B.E. and his Mathematics, then asks for 60%. Eleven and a half points
        in two semesters is a hard ask, and saying so beats leaving him hopeful. MAH CET wants
        50% and he is not domiciled in Maharashtra, so no relaxation reaches him. Karnataka
        PGCET wants the same 50%, and its 2026 cycle has closed regardless.
      </p>
      <p>
        Change one field and watch the answers move. Tick SC instead of general and CAT drops
        to 45%, which Rahul clears today. SNAP does the same, NIMCET drops to 55%, and Karnataka
        PGCET turns amber because its relaxation depends on candidature. One dropdown, four
        different outcomes.
      </p>

      <h2>Final year is not a disqualification</h2>
      <p>
        All ten exams take candidates who are still studying. You apply on the aggregate you
        hold today and produce the degree certificate or the final marks card when the
        institute asks, which happens at admission rather than at application. SNAP and
        Karnataka PGCET both say this explicitly, and the IIMs ask for a certificate from your
        principal or registrar confirming you are in your final year.
      </p>
      <p>
        Being under the bar mid-degree is a gap to close, not a door that has shut, and the
        tool tells you how many points you are short.
      </p>

      <h2>Work experience decides nothing here</h2>
      <p>
        None of these ten exams asks for it. Freshers write every one of them, and an empty
        experience column disqualifies you nowhere on this list. Experience earns weightage at
        shortlisting and in the interview at several institutes, and it becomes a hard
        requirement only on executive programmes, which these tests do not feed. Anyone telling
        you that two years of work is needed before you can write CAT is describing one
        college&rsquo;s preference, not a rule.
      </p>

      <h2>What this page does not check</h2>
      <p>
        Two conditions sit under every row and are assumed rather than tested: your university
        has to be recognised, and the degree itself has to run at least three years. There is
        no upper age limit on any of the ten, so that question does not need asking at all.
      </p>
      <p>
        Category certificates carry their own validity rules, particularly for OBC non-creamy
        layer, and get checked at document verification rather than at registration. Where any
        of this sits close for you, the notification for your exam is the document that
        settles it, and every row links the site it lives on.
      </p>

      <h2>If you are under the line</h2>
      <p>
        Start by working out which line you are under. Falling short of an exam body&rsquo;s
        bar closes that exam for the cycle and no amount of preparation changes it. Miss an
        institute&rsquo;s bar instead and you lose one college out of hundreds. Those two look
        identical on a results page and need opposite responses.
      </p>
      <p>
        If you are still studying, do the arithmetic properly. A backlog cleared or a strong
        final semester moves an aggregate more than most students expect, and the gap is often
        two or three points rather than ten. Run the check again when your seventh semester
        result is out.
      </p>
    </>
  );
}
