import type { ReactNode } from 'react';

// The long-form section under each tool. Typography and measure come from `.prose`
// in globals.css — one place decides how body copy reads, and this wrapper means a
// page never restates it. ToolShell already wraps its `explainer` prop in `.prose`,
// so use this for explainer prose that sits outside the shell.
export default function Explainer({ children }: { children: ReactNode }) {
  return <div className="prose">{children}</div>;
}
