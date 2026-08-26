import type { ReactNode } from 'react';

/**
 * The one way a tool asks for input.
 *
 * Three columns, so six fields land as 3+3 and five as 3+2. `auto-fit` was
 * producing 5+1 — a single orphaned field under a full row, which looks broken
 * rather than deliberate. Every tool uses this; none rolls its own grid.
 */
export default function ToolForm({
  title = 'Your details',
  children,
  footer,
}: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="tool-inputs" aria-label={title}>
      <h2>{title}</h2>
      <div className="field-grid">{children}</div>
      {footer ? <div className="tool-inputs-foot">{footer}</div> : null}
    </section>
  );
}
