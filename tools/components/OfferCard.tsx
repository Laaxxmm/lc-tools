import Icon, { type IconName } from './Icon';

export interface Offer {
  eyebrow: string;
  title: string;
  body: string;
  price?: string;
  href: string;
  cta: string;
  icon: IconName;
}

/**
 * A contextual offer, placed where the reader already has the matching intent.
 *
 * A deadlines page is the strongest commercial surface on the site — someone
 * counting days to an exam is exactly who wants papers to practise on — and it
 * was selling nothing.
 */
export default function OfferCard({ offer }: { offer: Offer }) {
  return (
    <aside className="offer">
      <p className="eyebrow"><Icon name={offer.icon} size={15} />{offer.eyebrow}</p>
      <h3>{offer.title}</h3>
      <p>{offer.body}</p>
      {offer.price ? <p className="offer-price">{offer.price}</p> : null}
      <a className="btn btn-primary" href={offer.href}>{offer.cta}</a>
    </aside>
  );
}

export function OfferRow({ offers }: { offers: Offer[] }) {
  return (
    <div className="offer-row">
      {offers.map((o) => <OfferCard key={o.href + o.title} offer={o} />)}
    </div>
  );
}
