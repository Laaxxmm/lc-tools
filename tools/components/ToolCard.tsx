import Link from 'next/link';
import type { ToolConfig } from '../lib/types';

export default function ToolCard({ tool }: { tool: ToolConfig }) {
  return (
    <Link className="card tool-card" href={`/${tool.slug}/`}>
      <span className="eyebrow"><span className="dot" />{tool.eyebrow}</span>
      <h3>{tool.title}</h3>
      <p>{tool.tagline}</p>
      <span className="muted">{tool.readMinutes} min read</span>
    </Link>
  );
}
