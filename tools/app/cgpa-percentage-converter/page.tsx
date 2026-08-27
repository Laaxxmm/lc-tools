import type { Metadata } from 'next';
import ToolShell from '../../components/ToolShell';
import { toolUrl } from '../../lib/shell';
import tool from '../../config/cgpa-percentage-converter';
import Converter from './Converter';

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

// Explainer sits below the working tool, per the on-page rule in the design spec.
const explainer = (
  <>
    <hr className="rule" />
    <h2>One CGPA, five different percentages</h2>
    <p>
      Your grade point average is not a percentage. It is a position on a scale your
      university invented, and turning it into a percentage needs a rule that your
      university chose for itself. India has no national conversion formula. Two students
      who both finish with 8.24 can walk out of two different colleges holding certificates
      that read 74.9 and 82.4, and both certificates are right.
    </p>
    <p>
      Most converters skip that. They hardcode one multiplier, usually 9.5 or a flat 10,
      and hand you a confident number that has nothing to do with your degree. You copy it
      onto an application form, your marks card says something else, and you spend a week
      explaining the gap to an admissions office that did not create it. So on this page the
      formula is an input, not an assumption.
    </p>

    <h2>What each option in the list actually does</h2>
    <p>
      <strong>VTU</strong> takes 0.75 off your CGPA and multiplies what is left by 10. If you
      graduated from a college affiliated to{' '}
      <a href="https://vtu.ac.in/">Visvesvaraya Technological University</a>, this is the rule
      your provisional degree certificate follows, and it costs you roughly 7.5 marks against
      a plain conversion. VTU publishes no derivation for the 0.75 and you do not need one. It
      is a constant written into the regulation, and disputing it on a form is not a fight
      anyone wins.
    </p>
    <p>
      <strong>The 9.5 rule</strong> multiplies by 9.5. It began at{' '}
      <a href="https://www.cbse.gov.in/">CBSE</a> as a way of turning the Class 10 grade point
      average into an indicative percentage, then spread outward because it was convenient.
      Some universities adopted it and many did not. It is not a{' '}
      <a href="https://www.ugc.gov.in/">UGC</a> instruction and it binds nobody, so reach for
      it only when 9.5 is the number your own institution prints.
    </p>
    <p>
      <strong>Direct 10x</strong> multiplies by 10 and stops there. Most autonomous colleges
      and a large share of deemed universities work this way, on the view that a ten-point
      scale maps cleanly onto a hundred-point one.
    </p>
    <p>
      <strong>Anna University</strong> also uses 10x.{' '}
      <a href="https://www.annauniv.edu/">Anna</a> is listed on its own because its graduates
      are told repeatedly by third-party sites that some subtraction applies to them. It does
      not. A 7.8 there is 78 percent.
    </p>
    <p>
      <strong>Custom multiplier</strong> covers everyone else. Turn your consolidated marks
      card over, find the conversion note, and type that multiplier in.
    </p>

    <h2>Worked example: 8.24 from a VTU college</h2>
    <p>
      Say you finish eight semesters at a VTU-affiliated engineering college in Bengaluru with
      a CGPA of 8.24, and you are filling in an MBA application form. Subtract 0.75 and you
      have 7.49. Multiply that by 10 and your percentage is 74.9. That is the figure your
      university will certify.
    </p>
    <p>
      Run the same 8.24 through the other rules and watch what happens. The 9.5 multiplier
      returns 78.28. A direct 10x returns 82.4. Between the lowest and highest answer sits 7.5
      marks, which is wider than the gap between a first class and a distinction at most
      universities. None of those three numbers is invented. Only one of them is yours.
    </p>

    <h2>The number that belongs on the application form</h2>
    <p>
      Write down what your university certifies.{' '}
      <a href="https://iimcat.ac.in/">IIM CAT</a> asks for the percentage as awarded by your
      university and defers to the university’s own conversion wherever only a CGPA has been
      issued. AIMA takes the same line for <a href="https://mat.aima.in/">MAT</a>, and{' '}
      <a href="https://cetonline.karnataka.gov.in/kea/">KEA</a> does the same for Karnataka
      PGCET. The pattern holds across every serious admission body. They trust the institution
      that taught you rather than a calculator that met you thirty seconds ago.
    </p>
    <p>
      That leaves this tool two honest jobs. It tells you roughly where you stand before you
      pay an application fee, and it lets you sanity-check a figure someone else has quoted at
      you. Where the converter and the marks card disagree, the marks card wins.
    </p>

    <h2>Where half a percent decides something</h2>
    <p>
      Eligibility for most MBA entrance exams sits at 50 percent in the general category and
      45 percent for reserved categories, measured against a bachelor’s degree of at least
      three years. Admission bodies check that against the certified percentage, not a rounded
      one.
    </p>
    <p>
      If your conversion lands anywhere between 49 and 51, stop and request a conversion
      certificate from your examination section before you do anything else. Look at what the
      choice of rule does at the bottom of the range: a 4.98 CGPA converts to 42.3 percent
      under the VTU rule and 47.31 under the 9.5 rule, and neither of those clears 50 anyway.
      Nearer the line the same spread flips an application from valid to rejected. A
      conversion certificate costs a week and a small fee, and it closes the only version of
      this problem that actually ends an application.
    </p>

    <h2>When arithmetic will not get you there</h2>
    <p>
      Two situations need a person rather than a formula. The first is a grade scale that is
      not out of 10. A 3.6 on a four-point scale is not a 3.6 here, and no multiplier fixes
      that honestly, so a formal equivalence letter is the only route. The second is a
      university that states in writing that no percentage equivalent exists. That is a real
      and defensible answer, application portals are built to accept it, and you attach the
      letter instead of a number you produced yourself.
    </p>
    <p>
      Everything else is arithmetic you can do in ten seconds, once you know which rule is
      yours. Find the rule first. The tool is the easy half.
    </p>
  </>
);

export default function Page() {
  return (
    <ToolShell tool={tool} explainer={explainer}>
      <Converter />
    </ToolShell>
  );
}
