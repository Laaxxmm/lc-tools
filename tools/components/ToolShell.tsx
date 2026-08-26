import type { ReactNode } from 'react';
import type { ToolConfig } from '../lib/types';
import { TOOLS } from '../config';
import Icon from './Icon';
import ProseNav from './ProseNav';
import { formatUpdated, groundClass, relatedTools, resolveCta, serialiseJsonLd, toolJsonLd } from '../lib/shell';
import ToolCard from './ToolCard';

interface Props {
  tool: ToolConfig;
  /** The working tool. It sits above the fold and needs no signup. */
  children: ReactNode;
  /** How the calculation works, with a worked example. */
  explainer?: ReactNode;
}

export default function ToolShell({ tool, children, explainer }: Props) {
  const ground = groundClass(tool.family);
  const cta = resolveCta(tool);
  // Resolved from tool.related against the registry, so a page cannot forget to
  // link its neighbours and the block cannot drift from the config.
  const related = relatedTools(tool, TOOLS);

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialiseJsonLd(toolJsonLd(tool)) }}
      />

      <header className={`tool-hero ${ground}`}>
        <div className="container">
          <p className="eyebrow"><Icon name={tool.icon} size={16} />{tool.eyebrow}</p>
          <h1>{tool.title}</h1>
          <p className="lead">{tool.tagline}</p>
          <p className="meta">
            <span>Updated {formatUpdated(tool.updated)}</span>
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">{children}</div>
      </section>

      {explainer ? (
        <section className="section">
          <div className="container-prose">
            {/* Available, not imposed. A calculator page should not open with an
                essay; the people who want the reasoning can open it. */}
            <details className="longform">
              <summary>How this works, and what it will not claim</summary>
              <div className="prose-layout">
                <div className="prose">{explainer}</div>
                <ProseNav />
              </div>
            </details>
          </div>
        </section>
      ) : null}

      {tool.sources?.length ? (
        <section className="container-prose">
          <p className="sources">
            Checked against:{' '}
            {tool.sources.map((s, i) => (
              <span key={s.href}>{i > 0 ? ', ' : ''}<a href={s.href}>{s.label}</a></span>
            ))}
          </p>
        </section>
      ) : null}

      {tool.faq.length > 0 ? (
        <section className="section">
          <div className="container-prose">
            <hr className="rule" />
            <h2>Questions you might have</h2>
            <div className="faq">
              {tool.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="section">
          <div className="container">
            <hr className="rule" />
            <h2>Tools that pair with this one</h2>
            <div className="grid">
              {related.map((r) => <ToolCard key={r.slug} tool={r} />)}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <div className={`cta-block ${ground}`}>
            <p className="eyebrow"><span className="dot" />Next step</p>
            <p>{cta.note ?? 'Practise the same syllabus on full-length papers.'}</p>
            <a className="btn btn-primary" href={cta.href}>{cta.label}</a>
          </div>
        </div>
      </section>
    </article>
  );
}
