import type { Metadata } from 'next';
import Link from 'next/link';
import ToolShell from '../../components/ToolShell';
import { toolUrl } from '../../lib/shell';
import tool from '../../config/cat-mat-study-plan-generator';
import StudyPlanTool from './StudyPlanTool';

export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: toolUrl(tool.slug) },
  openGraph: {
    type: 'article',
    title: tool.title,
    description: tool.description,
    url: toolUrl(tool.slug),
  },
};

export default function Page() {
  return (
    <ToolShell tool={tool} explainer={<Explainer />}>
      <StudyPlanTool />
    </ToolShell>
  );
}

function Explainer() {
  return (
    <>
      <hr className="rule" />
      <h2>What this planner does, and what it refuses to do</h2>
      <p>
        You give it four facts and it gives you a calendar. The exam date sets the length, your
        daily hours set the volume, your current level sets the shape, and your weakest section
        decides where the time goes. None of it is a forecast. This tool cannot tell you what you
        will score, and anything that claims to from five dropdowns is selling you something.
      </p>
      <p>
        The plan is built backwards from the exam rather than forwards from today. That matters
        more than it sounds. Your final week comes out as a real seven days instead of whatever
        happens to be left once the weeks divide, so the ragged part-week lands at the start where
        losing two days costs almost nothing. Taper weeks are the ones you cannot afford to shorten.
      </p>
      <p>
        One rest day a week is removed from every total before you see it. Six study days at three
        hours reads as eighteen hours, not twenty-one, because a schedule that fills all seven days
        is one you quietly stop following by week three. Mock hours come out too. A CAT mock is
        booked at four and a half hours and a MAT mock at five, since the
        analysis has to run longer than the paper for the mock to have been worth taking.
      </p>

      <h2>Three weeks and thirteen weeks are not the same plan</h2>
      <p>
        Most planners take one template and divide it by however many weeks you have left. A
        three-week MAT plan comes out as a compressed three-month CAT plan, and you are asked to
        learn permutations on day four. That is not a shorter plan. It is the same plan run at a
        speed nobody can hold, and it fails in the second week.
      </p>
      <p>This one picks the shape before it picks anything else.</p>
      <p>
        <strong>Beyond eight weeks</strong> you get a foundation phase, because there is room to
        learn topics you do not have and still make them usable afterwards.{' '}
        <strong>Five to eight weeks</strong> gets a repair phase instead: you take the two or three
        topics that cost you the most in your diagnostic and rebuild only those.{' '}
        <strong>Four weeks or fewer</strong> gets triage. New topics stop, you drill what you
        already recognise on sight, mock density goes up, then you taper.
      </p>
      <p>
        The level you pick can pull the shape shorter, never longer. Say &ldquo;final sprint&rdquo;
        with thirteen weeks left and you get the sprint plan plus a note about the runway you are
        throwing away. Say &ldquo;starting fresh&rdquo; three weeks before MAT and you still get the
        sprint plan, along with the honest sentence that eighteen days will not build a section from
        zero. We would rather write that than hand you a foundation phase that cannot fit.
      </p>

      <h2>How the sectional split is worked out</h2>
      <p>
        CAT gives all three sections the same forty minutes and locks the sectional timer, so the
        split is not a question of marks. It is a question of how much ground each section covers.
        Quantitative Ability carries the widest syllabus, which is why it opens at 36% of drilling
        time against 32% each for Verbal Ability and Data Interpretation. Check the format on the{' '}
        <a href="https://iimcat.ac.in/">official CAT site</a> before every cycle, since the IIM
        conducting the exam can change it.
      </p>
      <p>
        MAT behaves differently. Five sections, 200 questions, 150 minutes, and you move between
        sections freely. One detail changes how you should spend the hours:{' '}
        <a href="https://mat.aima.in/">AIMA</a> builds the composite score from four of the five
        sections and keeps Indian &amp; Global Environment outside it. So the planner gives IGE
        roughly 6% and will not give it more, even when you name it as your weakest section. Time
        moved there does not move your percentile, and fifteen minutes of news a day covers what
        the paper asks.
      </p>
      <p>
        Your weakest section then takes a boost, drawn proportionally from the others. The boost
        shrinks as the exam gets closer: ten percentage points beyond eight weeks, seven inside
        eight, four inside a month. This is deliberate, and it runs against most of the advice you
        will read. Far out, your weakest section is the cheapest place to buy marks. Close in, an
        hour that keeps a strong section automatic returns more than an hour spent on a weakness
        that will not mature in time, because skills decay faster than they build.
      </p>

      <h2>A worked example</h2>
      <p>
        Consider a candidate planning on 26 August 2026 for{' '}
        <Link href="/mba-exam-dates-2026/">CAT on 29 November</Link>. Three hours a day, starting
        fresh, weakest section Quantitative Ability.
      </p>
      <p>
        That is 95 days, which becomes fourteen weeks with a four-day opening week. The plan returns
        about 245 study hours, 22 full mocks, and QA on 46% of drilling time against 27% each for
        VARC and DILR. Weeks one to six are foundation, with one mock per fortnight rather than per
        week, because weekly mocks while you are still learning topics tell you what you already
        know and eat the hours that would have fixed it. Weeks seven to ten switch to application:
        two mocks a week, timed sets, and a written note on every wrong answer saying whether it was
        technique, calculation or reading. Weeks eleven to thirteen are the mock block at three a
        week. Week fourteen tapers to two mocks early and nothing new after them.
      </p>
      <p>
        Now change one input. Same candidate, same three hours, but the exam is{' '}
        <Link href="/mba-exam-dates-2026/">MAT on 13 September</Link>. Eighteen days, three weeks,
        roughly 46 hours and five mocks. There is no foundation phase and no application phase. Week
        one is triage on your own notes and formula sheet, week two runs mocks at the time of day
        your paper actually starts, and week three tapers. The two plans share a taper and share
        nothing else, which is the point.
      </p>

      <h2>What the checkpoints are for</h2>
      <p>
        Every phase opens with one checkpoint, and none of them is a score. Score targets at the end
        of week four are guesses dressed as milestones. What the checkpoints ask instead is whether
        a behaviour is in place: that you can name the topic behind a question in ten seconds, that
        your sets now run on a clock, that your formula sheet and error log exist and are one page
        each, that your last three mocks sit in a narrow band rather than swinging. Behaviour is
        something you can verify on the day. If you want a number to aim at, work backwards from the
        percentile you need with the{' '}
        <Link href="/cat-percentile-target-calculator/">percentile target calculator</Link> and keep
        it beside the plan rather than inside it.
      </p>

      <h2>When the plan and your life disagree</h2>
      <p>
        Regenerate it. The plan costs nothing to rebuild, and a schedule you have already broken is
        worse than no schedule because it makes every following week feel like catching up. Lost a
        fortnight to work? Change the start date and take the shorter shape the tool gives you.
        Found four hours a day instead of two? Put the real number in and let the mock count rise
        with it.
      </p>
      <p>
        Settle two things before you commit the next three months. Check that you are eligible for
        the exams you are planning around with the{' '}
        <Link href="/mba-exam-eligibility-checker/">eligibility checker</Link>, and let the{' '}
        <Link href="/cgpa-percentage-converter/">CGPA converter</Link> tell you what your marks card
        converts to under your own university&rsquo;s rule. If fees are still an open question, the{' '}
        <Link href="/mba-cost-and-roi-calculator/">cost and ROI calculator</Link> beats one more
        mock tonight.
      </p>
    </>
  );
}
