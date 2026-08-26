import Link from 'next/link';
import type { ToolConfig } from '../lib/types';
import { IconBadge } from './Icon';

// The basic answer is always free. The tag says what the gate actually costs, so
// nobody clicks expecting one thing and meets another.
const GATE_LABEL: Record<ToolConfig['gate'], string> = {
  none: 'Free, no signup',
  email: 'Free · email for the full breakdown',
  'email+phone': 'Free · email for the download',
};

export default function ToolCard({ tool }: { tool: ToolConfig }) {
  return (
    <Link className="tool-card" href={`/${tool.slug}/`}>
      <IconBadge name={tool.icon} />
      <h3>{tool.shortName ?? tool.title}</h3>
      <p>{tool.oneLiner}</p>
      <span className={`tag ${tool.gate === 'none' ? 'tag-free' : 'tag-gate'}`}>
        {GATE_LABEL[tool.gate]}
      </span>
    </Link>
  );
}
