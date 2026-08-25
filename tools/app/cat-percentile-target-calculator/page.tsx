import type { Metadata } from 'next';
import ToolShell from '../../components/ToolShell';
import tool from '../../config/cat-percentile-target-calculator';
import { toolUrl } from '../../lib/shell';
import Calculator from './Calculator';

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: toolUrl(tool.slug) },
};

function Explainer() {
  return (
    <>
      <hr className="rule" />
      <h2>How this one runs backwards</h2>
      <p>
        Most percentile talk runs forwards. You write a mock, you get a score, and you go looking for
        what percentile that score might be worth. This tool runs the other way: you name the school
        you want, and it hands back the score that school has usually needed, then turns that score
        into the number of questions you have to attempt in each section at the accuracy you actually
        have.
      </p>
      <p>
        That last clause carries most of the weight. Two students can share the same 99 percentile
        target and still need completely different papers from each other, because one is right on
        three attempts in four and the other on two in three. An attempt target that ignores accuracy
        is a number somebody made up.
      </p>

      <h2>The one number the IIMs never publish</h2>
      <p>
        Here is the honest part first, because it changes how you should read everything below. The
        IIMs release two things on your scorecard: your scaled score and your percentile. They do not
        release the table that joins the two, they do not release the normalisation formula that
        produced the scaled score, and they promise nothing about this year&rsquo;s paper behaving
        like last year&rsquo;s. There is no official answer to &ldquo;what score is 99 percentile&rdquo;.
      </p>
      <p>
        What exists instead is the pile of scorecards candidates post every January. Read enough of
        them and a rough shape appears, and that shape is what the bands in this tool are built from.
        It is also exactly why the tool returns a range of six or seven marks rather than one figure.
        Anyone quoting you a single number for 99 percentile is quoting more confidence than the
        evidence carries.
      </p>

      <h2>The marking scheme, and why 25 percent is the floor</h2>
      <p>
        CAT 2024 and CAT 2025 both ran 68 questions across three sections: 24 in VARC, 22 in DILR, 22
        in QA. Each question is worth 3 marks, each wrong MCQ costs 1, and the type-in questions carry
        no penalty at all. Maximum raw score is 204. The IIMs have changed the question count before,
        so treat the paper as settled only once CAT 2026&rsquo;s own instructions confirm it.
      </p>
      <p>
        Now look at a single attempt in isolation. If your accuracy is <em>a</em>, that attempt earns
        3<em>a</em> marks when you get it right and costs (1 &minus; <em>a</em>) when you do not, so
        on average it returns 4<em>a</em> &minus; 1 marks.
      </p>
      <p>
        Set that expression to zero and <em>a</em> comes out at 0.25. Below 25 percent accuracy, every
        additional question you touch makes your score worse. That is not exam-hall folklore, it is
        arithmetic on the marking scheme, and it is why the calculator refuses to build a plan under
        the line. Above it, the attempts you need are your target score divided by 4<em>a</em>{' '}
        &minus; 1.
      </p>

      <h2>A worked example</h2>
      <p>
        Rahul is a final-year engineering student in Bengaluru and he wants IIM Bangalore. He picks
        the first tier, so the target is 99.5 percentile. The tool returns a band of 96 to 103 marks
        out of 204 and plans against 103, because planning against 96 leaves him nothing on a hard
        paper. His accuracy across the last four full-length mocks is 75 percent in VARC, 65 in DILR
        and 70 in QA.
      </p>
      <p>
        VARC holds 24 of the 68 questions, so its share of 103 is 103 &times; 24 &divide; 68, which
        comes to 36.4 marks. At 75 percent accuracy each attempt is worth 4(0.75) &minus; 1 = 2.0
        marks. Divide one by the other and Rahul needs 19 attempts out of 24. Five reading questions
        he never touches.
      </p>
      <p>
        DILR gets 103 &times; 22 &divide; 68, or 33.3 marks. At 65 percent, each attempt returns 1.6
        marks, so the section asks for 21 attempts out of 22. That number is the finding. Twenty-one
        of 22 in 40 minutes is not a plan, and it tells Rahul that IIM Bangalore is blocked by his
        DILR accuracy rather than by his speed. Push that accuracy to 75 percent and the requirement
        falls to 17.
      </p>
      <p>
        QA, at 70 percent, asks for 19 of 22. Add the three together and Rahul attempts 59 of 68
        questions, which is a realistic paper for a 99.5 target. Change one input, the DILR accuracy,
        and the whole plan changes shape. Nothing else in his preparation moves the number that far.
      </p>

      <h2>The published minimum is not the bar</h2>
      <p>
        Open any IIM&rsquo;s admission policy and you will find a minimum percentile, often 80 overall
        with 70 in each section for the general category. Those are eligibility floors. They decide
        who is allowed into the pool, and the shortlist is then drawn from the top of that pool. For a
        general-category engineering male at the oldest IIMs, the effective bar has sat near 99
        percentile and above in recent cycles. Use the published floor to confirm you qualify, and use
        this tool for the number you actually have to hit.
      </p>
      <p>
        The composite score matters too, and not all of it is CAT. Class 10 and Class 12 marks, your
        graduation percentage, work experience, gender and academic diversity all carry weight in the
        shortlisting formula each institute publishes. A high percentile sitting on weak academics
        behaves differently from the same percentile sitting on strong ones, so read your target
        institute&rsquo;s own criteria before you decide what your percentile buys.
      </p>

      <h2>Where this estimate breaks</h2>
      <p>
        Three places, and knowing them makes the output more useful rather than less. The paper
        changes: a harder QA section drags the whole distribution down, and the score that bought 99
        percentile last year buys more this year. Percentiles are stable, the scores behind them are
        not.
      </p>
      <p>
        Sectional percentiles also refuse to follow the overall one. Splitting your target in
        proportion to the marks available is a starting allocation, not a rule. If VARC is your
        strength, take more marks there and fewer in QA, as long as QA still clears its own sectional
        bar. And because the type-in questions carry no negative marking, a candidate who attempts
        those freely will beat this model by a little. That margin runs in your favour.
      </p>

      <h2>What to do with the number</h2>
      <p>
        Carry the attempt targets into your next mock and hold them. If the plan says 19 of 22 in QA,
        stop at 19 and watch what your accuracy does once you are not fighting the clock for the last
        three questions. Most people find accuracy climbs the moment the attempt target comes down,
        and the net score climbs with it.
      </p>
      <p>
        Then run this again with the new accuracy. CAT 2026 is on 29 November 2026 and registration
        opened on 3 August, which leaves enough time to move accuracy by several points. That is worth
        considerably more than the same effort spent chasing speed.
      </p>
    </>
  );
}

export default function Page() {
  return (
    <ToolShell tool={tool} explainer={<Explainer />}>
      <Calculator />
    </ToolShell>
  );
}
