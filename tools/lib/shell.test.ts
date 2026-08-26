import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CTA, type ToolConfig } from './types.ts';
import { TOOLS } from '../config/index.ts';
import {
  formatUpdated, groundClass, groupByFamily, latestUpdated,
  relatedTools, resolveCta, serialiseJsonLd, toolJsonLd, toolUrl,
} from './shell.ts';

const tool = (over: Partial<ToolConfig> = {}): ToolConfig => ({
  slug: 'cgpa-to-percentage',
  title: 'CGPA to percentage converter',
  tagline: 'Convert with your own university rule.',
  eyebrow: 'Free tool',
  family: 'general',
  description: 'Convert CGPA to percentage.',
  keywords: ['cgpa'],
  icon: 'percent',
  oneLiner: 'CGPA to percentage, by your rule',
  readMinutes: 4,
  faq: [{ q: 'Which formula does VTU use?', a: 'It subtracts 0.75, then multiplies by 10.' }],
  related: [],
  gate: 'none',
  cta: CTA.coaching,
  updated: '2026-08-26',
  ...over,
});

test('MAT lands on teal, everything else on forest', () => {
  assert.equal(groundClass('mat'), 'ground-mat');
  assert.equal(groundClass('pgcet'), 'ground-pgcet');
  assert.equal(groundClass('cat'), 'ground-pgcet');
});

test('a PGCET CTA pointed at the mocks platform is rerouted to publications', () => {
  const out = resolveCta(tool({ family: 'pgcet', cta: CTA.matMocks }));
  assert.equal(out.href, CTA.pgcetMocks.href);
});

test('a PGCET CTA that already points elsewhere is left alone', () => {
  const out = resolveCta(tool({ family: 'pgcet', cta: CTA.coaching }));
  assert.equal(out.href, CTA.coaching.href);
});

test('a MAT tool keeps its mocks CTA', () => {
  const out = resolveCta(tool({ family: 'mat', cta: CTA.matMocks }));
  assert.equal(out.href, CTA.matMocks.href);
});

test('tool URLs carry the /tools/ basePath and a trailing slash', () => {
  assert.equal(toolUrl('cgpa-to-percentage'), 'https://learncrew.org/tools/cgpa-to-percentage/');
});

test('schema graph carries SoftwareApplication and FAQPage', () => {
  const graph = toolJsonLd(tool());
  assert.deepEqual(graph.map((n) => n['@type']), ['SoftwareApplication', 'FAQPage']);
});

test('an empty FAQ emits no FAQPage — an empty one fails validation', () => {
  const graph = toolJsonLd(tool({ faq: [] }));
  assert.equal(graph.length, 1);
});

test('a closing script tag inside an answer cannot break out of the script element', () => {
  const graph = toolJsonLd(tool({ faq: [{ q: 'x', a: '</script><img onerror=alert(1)>' }] }));
  assert.ok(!serialiseJsonLd(graph).includes('</script'));
});

test('dates render the way the blog shows them', () => {
  assert.equal(formatUpdated('2026-08-26'), '26 Aug 2026');
});

test('an unparseable date falls through instead of printing Invalid Date', () => {
  assert.equal(formatUpdated('not-a-date'), 'not-a-date');
});

test('hub groups run CAT, MAT, PGCET, then the exam-agnostic tools', () => {
  const tools = [
    tool({ slug: 'a', family: 'general' }),
    tool({ slug: 'b', family: 'mat' }),
    tool({ slug: 'c', family: 'cat' }),
    tool({ slug: 'd', family: 'pgcet' }),
  ];
  assert.deepEqual(groupByFamily(tools).map((g) => g.family), ['cat', 'mat', 'pgcet', 'general']);
});

test('config order is kept inside a group — the array is the running order', () => {
  const tools = [tool({ slug: 'second', family: 'cat' }), tool({ slug: 'first', family: 'cat' })];
  assert.deepEqual(groupByFamily(tools)[0].tools.map((t) => t.slug), ['second', 'first']);
});

test('a family with no live tool is dropped, not rendered as an empty heading', () => {
  const groups = groupByFamily([tool({ family: 'cat' })]);
  assert.deepEqual(groups.map((g) => g.family), ['cat']);
});

test('no tools at all produces no groups', () => {
  assert.deepEqual(groupByFamily([]), []);
});

test('the hub shows the newest tool update date', () => {
  const tools = [tool({ updated: '2026-08-02' }), tool({ updated: '2026-08-26' }), tool({ updated: '2026-01-09' })];
  assert.equal(latestUpdated(tools), '2026-08-26');
});

test('an empty catalogue yields no date rather than a fabricated one', () => {
  assert.equal(latestUpdated([]), '');
  assert.equal(formatUpdated(latestUpdated([])), '');
});

// ── related links ────────────────────────────────────────────────────────────
// The block used to be wired by hand on each page and three of six pages simply
// forgot, so these run against the live registry rather than a fixture.

test('every related slug in every live config resolves to a real tool', () => {
  const slugs = new Set(TOOLS.map((t) => t.slug));
  const dead = TOOLS.flatMap((t) => t.related.filter((s) => !slugs.has(s)).map((s) => `${t.slug} -> ${s}`));
  assert.deepEqual(dead, [], 'related[] points at a slug with no config');
});

test('every live tool renders a related block — no page is a dead end', () => {
  for (const t of TOOLS) {
    assert.ok(relatedTools(t, TOOLS).length > 0, `${t.slug} would render no related tools`);
  }
});

test('related order follows the config, and a tool never links to itself', () => {
  const a = tool({ slug: 'a', related: ['c', 'b', 'a'] });
  const b = tool({ slug: 'b' });
  const c = tool({ slug: 'c' });
  assert.deepEqual(relatedTools(a, [a, b, c]).map((t) => t.slug), ['c', 'b']);
});

test('a slug with no config is dropped rather than rendered as a dead link', () => {
  const a = tool({ slug: 'a', related: ['b', 'ghost'] });
  const b = tool({ slug: 'b' });
  assert.deepEqual(relatedTools(a, [a, b]).map((t) => t.slug), ['b']);
});

test('a tool appears under every family it serves, not just its ground colour', () => {
  const studyPlan = TOOLS.find((t) => t.slug === 'cat-mat-study-plan-generator');
  assert.ok(studyPlan, 'study plan tool must exist');
  assert.deepEqual(studyPlan.alsoServes, ['mat']);

  const groups = groupByFamily(TOOLS);
  const mat = groups.find((g) => g.family === 'mat');
  assert.ok(mat, 'MAT group must render — MAT is the nearest exam on the calendar');
  assert.ok(mat.tools.some((t) => t.slug === 'cat-mat-study-plan-generator'));

  // It must still appear under its own family, not move.
  const cat = groups.find((g) => g.family === 'cat');
  assert.ok(cat?.tools.some((t) => t.slug === 'cat-mat-study-plan-generator'));
});
