import type { Metadata } from 'next';
import ToolShell from '../../components/ToolShell';
import { toolUrl } from '../../lib/shell';
import tool from '../../config/mba-cost-and-roi-calculator';
import Calculator from './Calculator';

// The h1 carries the long descriptive title. The SERP title is trimmed, because
// the layout appends "| Learn Crew Tools" and Google truncates past ~60 characters.
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
  title: 'MBA Cost and ROI Calculator',
  description: tool.description,
  keywords: tool.keywords,
  alternates: { canonical: toolUrl(tool.slug) },
};

const FORMULA_BOX = {
  margin: 'var(--s3) 0',
  padding: 'var(--s2) var(--s3)',
  borderLeft: '3px solid var(--amber)',
  fontWeight: 700,
} as const;

export default function Page() {
  return (
    <ToolShell
      tool={tool}
      explainer={
        <>
          <h2>The line every other MBA calculator leaves out</h2>
          <p>
            Fees are the easy number. Your school prints them, you can quote them to a bank,
            and every cost calculator on the internet will happily add them to two years of
            hostel rent and call the result the cost of an MBA. That total is wrong, and it is
            wrong in a direction that flatters the decision. A full-time MBA also takes you out
            of the workforce, and the salary you would have earned in those months is money you
            will never see. Accountants call it opportunity cost. You can call it the two years
            of pay that quietly vanishes while you sit in a classroom.
          </p>
          <p>
            Run the numbers and it is often the biggest line on the bill. Two years of a Rs 6
            lakh salary is Rs 12 lakh gone before a single rupee of tuition is counted, about
            double the interest you would pay on a Rs 15 lakh loan over seven years. That is why this calculator puts the
            figure on screen instead of hiding it, and why the total it produces is bigger than
            the one you will see elsewhere. A bigger number is not pessimism. It is the number
            you would want if you were the one signing the loan papers.
          </p>

          <h2>How the EMI is worked out</h2>
          <p>
            Education loans in India run on reducing balance, which means interest is charged
            each month on what you still owe rather than on the amount you originally borrowed.
            Your instalment stays the same every month, but its composition shifts. The standard
            amortisation formula for that fixed instalment is:
          </p>
          <p style={FORMULA_BOX}>
            EMI = P × r × (1 + r)<sup>n</sup> ÷ ( (1 + r)<sup>n</sup> − 1 )
          </p>
          <p>
            P is the principal, n is the tenure in months, and r is the monthly rate, which is
            your annual rate divided by twelve and then by a hundred. A 10.5 percent loan has a
            monthly r of 0.00875. Nothing in the formula is negotiable, so any two calculators
            fed the same three inputs must agree to the paisa. Where they differ, one of them
            has quietly rounded the rate or used a simple-interest shortcut, and you should
            trust the bank sanction letter over both.
          </p>
          <p>
            Zero-interest cases break that formula, since the denominator collapses to nothing.
            This tool handles it by spreading the principal evenly, which is what a genuinely
            interest-free instalment plan does anyway.
          </p>

          <h2>Why the loan itself is not added to your total</h2>
          <p>
            A loan is not an extra expense. It is a way of paying an expense you already have,
            shifted into the future and priced for the delay. Your fees are counted once, under
            fees. If the total then added the full repayment on top, you would be charged for
            the same tuition twice and your break-even would stretch out by years for no real
            reason. What borrowing actually costs is the interest, so that is the only loan
            figure inside the total cost here. Read the year-by-year table and you will see the
            same principal moving out of the balance column, never appearing as a new cost.
          </p>

          <h2>A worked example</h2>
          <p>
            Take a candidate we will call Anitha. She works in Bengaluru on Rs 6,00,000 a year,
            has an offer from a two-year programme charging Rs 15,00,000 in fees, and expects
            to spend about Rs 15,000 a month on hostel, food and travel. Her bank has sanctioned
            Rs 15,00,000 at 10.5 percent over seven years. She is told the median package for
            her specialisation is Rs 16,00,000.
          </p>
          <p>
            Her fees and living costs come to Rs 18,60,000. Two years away from her desk costs
            her another Rs 12,00,000 in salary. Her EMI works out to Rs 25,291 a month, and over
            84 months she pays Rs 6,24,445 of interest on top of the principal. Add the three
            real costs and Anitha is looking at Rs 36,84,445, close to two and a half times the
            fee figure she first wrote down. Her salary rises by Rs 10,00,000 a year, so the payback lands at
            about three years and eight months after she graduates, and her EMI eats close to 19
            percent of her expected monthly salary.
          </p>
          <p>
            Now change one input. If Anitha lands Rs 12,00,000 instead of Rs 16,00,000, her
            annual gain drops by four lakh and her break-even stretches past six years. The fees did not
            move, the loan did not move, and the decision changed completely. This is the reason
            to run the tool at a salary you would be disappointed but not shocked by, rather
            than the number in the placement brochure.
          </p>

          <h2>What break-even does and does not mean</h2>
          <p>
            Break-even is the point at which your extra earnings have covered everything the MBA
            took from you. The clock starts on graduation day, not on your first day of class,
            and it runs on the gap between your new salary and your old one rather than on the
            new salary itself. Someone earning Rs 4,00,000 who moves to Rs 12,00,000 pays the
            cost back faster than someone earning Rs 18,00,000 who moves to Rs 24,00,000, even
            though the second person is richer throughout.
          </p>
          <p>
            Sometimes there is no break-even at all. If the salary you expect is not higher than
            the salary you have, the calculator will say so plainly instead of inventing a
            timeline. That answer is uncomfortable and it is occasionally the right one. A
            mid-career candidate switching function, or one whose real goal is a network or a
            visa, may be making a sound decision this arithmetic cannot score. Know which case
            you are in before you argue with the number.
          </p>

          <h2>What this calculator leaves out, on purpose</h2>
          <p>
            Three things are missing, and each was left out because including it would have
            required an assumption you cannot verify. Tax is absent, so the salary gain shown is
            pre-tax and the real payback is a little slower. Nor is Section 80E relief modelled,
            which lets you deduct education loan interest for up to eight years and pulls in the
            opposite direction. Salary growth is left out too, which means a career that
            compounds faster after an MBA than before it will beat the figure here.
          </p>
          <p>
            Each could have been modelled. Doing so would bury a tax slab, a deduction schedule
            and a growth rate inside one headline number, none of which you could check. Every
            rupee in the answer here traces back to something you typed yourself.
          </p>

          <h2>What to do with the answer</h2>
          <p>
            Run it three times. Once with the salary you hope for, once with the median your
            school actually publishes, and once with the offer you would accept on a bad day. If
            the break-even stays inside four or five years across all three, the money side of
            the decision is sound and you can go back to worrying about the entrance exam. When
            only the optimistic run works, you are betting on an outcome that a minority of the
            batch gets, and the honest response is a cheaper school rather than a braver
            forecast. Watch the EMI share as well. Anything past a third of your expected salary
            leaves you no room for a slow placement season.
          </p>
        </>
      }
    >
      <Calculator />
    </ToolShell>
  );
}
