import type { ReactNode } from 'react';

export interface Kpi {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}

/**
 * The one way a figure is displayed anywhere on the site.
 *
 * Stays on a single row by design — `auto-fit` wrapped four figures to 3+1, which
 * reads as a layout accident. Label above, figure below, ruled cells, and the
 * figures share a row so they can be compared at a glance.
 */
export default function KpiRow({ items }: { items: Kpi[] }) {
  return (
    <div className="kpi-row" data-count={items.length}>
      {items.map((k) => (
        <div className="kpi" key={k.label}>
          <p className="k">{k.label}</p>
          <p className="n">{k.value}</p>
          {k.note ? <p className="kpi-note">{k.note}</p> : null}
        </div>
      ))}
    </div>
  );
}
