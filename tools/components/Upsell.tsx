import { CTA } from '../lib/types';

// Flip to true the day learncrew.org/starter-kit/ is published. Until then the
// kit CTA goes to the contact page with honest copy, rather than to a URL that
// WordPress silently redirects to the homepage.
export const STARTER_KIT_LIVE = false;
const KIT = STARTER_KIT_LIVE
  ? { href: 'https://learncrew.org/starter-kit/', label: 'Get the ₹199 starter kit' }
  : { href: CTA.contact.href, label: 'Ask about the ₹199 starter kit' };

/**
 * Shown only after unlock, under the result. The rank decides the message: past
 * 3,500 the honest advice is a second attempt (MAT December for MBA, or PGCET
 * 2027), inside it the student is a prospect for next year's prep.
 */
export function PredictorUpsell({ rank, course }: { rank: number; course: string }) {
  const behind = rank > 3500;
  const mba = course === 'MBA';
  return (
    <aside className="upsell" aria-label="Next step">
      {behind ? (
        <>
          <p className="upsell-title">Not happy with these colleges?</p>
          <p className="upsell-body">
            {mba
              ? 'There is still time for a better seat: MAT in December this cycle, or a calm run at PGCET 2027 with our Mon · Wed · Fri 6:30 PM batch.'
              : 'A calm run at PGCET 2027 moves ranks more than most students expect — Mon · Wed · Fri 6:30 PM, rolling admissions.'}
          </p>
          <div className="upsell-actions">
            {mba ? <a className="btn btn-primary" href={CTA.matCoaching.href}>Explore the MAT December batch</a> : null}
            <a className={`btn ${mba ? 'btn-ghost' : 'btn-primary'}`} href={KIT.href}>{KIT.label}</a>
          </div>
        </>
      ) : (
        <>
          <p className="upsell-title">Preparing for PGCET 2027?</p>
          <p className="upsell-body">
            Benchmark where you stand: two full-length diagnostic mocks, three years of solved
            PYQs and a one-to-one mentor call, for ₹199.
          </p>
          <div className="upsell-actions">
            <a className="btn btn-primary" href={KIT.href}>{KIT.label}</a>
          </div>
        </>
      )}
    </aside>
  );
}
