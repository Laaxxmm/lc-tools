import type { ReactNode } from 'react';

// The worked example every tool page carries: real numbers, run through by hand, so a
// reader can check the tool rather than take it on faith. Cream-2 ground, amber rule.
export default function WorkedExample({
  title = 'Worked example',
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="worked-example">
      <h3>{title}</h3>
      {children}
    </aside>
  );
}
