// The decisions ToolShell makes, kept out of the .tsx so node:test can run them
// without a bundler. Rendering stays dumb; the rules live here and are covered
// by shell.test.ts.

import { CTA, type ExamFamily, type ToolConfig } from './types.ts';

export const SITE = 'https://learncrew.org';

export function toolUrl(slug: string): string {
  return `${SITE}/tools/${slug}/`;
}

// MAT sits on teal. Everything else sits on forest — globals.css lists forest as
// the ground for PGCET, the footer and headings, so it is the house dark.
export function groundClass(family: ToolConfig['family']): 'ground-pgcet' | 'ground-mat' {
  return family === 'mat' ? 'ground-mat' : 'ground-pgcet';
}

// PGCET has no package of its own on the mocks platform — it inherits the Rs.999
// Management ladder there, which is the wrong price. Any PGCET tool pointed at
// mocks is redirected to publications, where Rs.399/yr is correct.
export function resolveCta(tool: ToolConfig): ToolConfig['cta'] {
  const mispriced = tool.family === 'pgcet' && tool.cta.href.startsWith(CTA.matMocks.href);
  return mispriced ? CTA.pgcetMocks : tool.cta;
}

// Hub ordering. CAT and MAT sit at the top because both are live this cycle;
// PGCET is counselling-only until 2027 and the exam-agnostic tools close the page.
export const FAMILY_ORDER: readonly ExamFamily[] = ['cat', 'mat', 'pgcet', 'general'];

export interface ToolGroup { family: ExamFamily; tools: ToolConfig[]; }

// Empty families are dropped rather than rendered as an empty heading, so the hub
// stays honest about what is actually live.
export function groupByFamily(tools: ToolConfig[]): ToolGroup[] {
  return FAMILY_ORDER
    .map((family) => ({
      family,
      tools: tools.filter((t) => t.family === family || t.alsoServes?.includes(family)),
    }))
    .filter((g) => g.tools.length > 0);
}

// ISO dates sort lexicographically, so max is a string compare.
export function latestUpdated(tools: ToolConfig[]): string {
  return tools.reduce((max, t) => (t.updated > max ? t.updated : max), '');
}

export function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(d);
}

export function toolJsonLd(tool: ToolConfig): Record<string, unknown>[] {
  const graph: Record<string, unknown>[] = [{
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.title,
    description: tool.description,
    url: toolUrl(tool.slug),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    dateModified: tool.updated,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    publisher: { '@type': 'Organization', name: 'Learn Crew', url: SITE },
  }];

  // An empty FAQPage fails Google's validator, so only emit it when there are answers.
  if (tool.faq.length > 0) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: tool.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }
  return graph;
}

// Inline JSON ends the script element early if it contains "</script"; escaping
// "<" is the standard fix and keeps the JSON valid.
export function serialiseJsonLd(graph: Record<string, unknown>[]): string {
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}

// A tool's related slugs resolved against the registry, in the order the config
// lists them. Pages used to hand-import their own neighbours, which silently left
// three of six with no related block at all; resolving here means adding a tool to
// config/index.ts is the only step. An unknown slug is dropped rather than rendered
// as a dead link, and shell.test.ts asserts no live config has one.
export function relatedTools(tool: ToolConfig, all: ToolConfig[]): ToolConfig[] {
  return tool.related
    .filter((slug) => slug !== tool.slug)
    .map((slug) => all.find((t) => t.slug === slug))
    .filter((t): t is ToolConfig => t !== undefined);
}
