// Runs before the generator in .github/workflows/weekly-blog.yml. If this fails,
// no drafts are generated and no pull request opens.
//
// Run: node --test scripts/blog-draft.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { draft, loadTools } from './blog-draft.mjs';

const FIXED = new Date('2026-08-26T00:00:00Z');

const stub = (over = {}) => ({
  slug: 'sample-tool',
  title: 'Sample Tool: what you get',
  tagline: 'One line about the tool.',
  eyebrow: 'Sample',
  family: 'general',
  description: 'A sample.',
  keywords: [],
  readMinutes: 7,
  faq: [{ q: 'Does it work?', a: 'Yes.' }],
  related: [],
  gate: 'none',
  cta: { label: 'Get MAT test series — Rs.999/year', href: 'https://learn.learncrew.org/' },
  updated: '2026-08-26',
  ...over,
});

test('a draft carries the read time, the tool link and every FAQ question', () => {
  const md = draft(stub(), FIXED);
  assert.match(md, /\*\*Read time: 7 minutes\*\*/);
  assert.match(md, /https:\/\/learncrew\.org\/tools\/sample-tool\//);
  assert.match(md, /Does it work\?/);
  assert.match(md, /^status: draft$/m);
});

test('a draft is unfinished on purpose — the judgement calls are left as TODOs', () => {
  const md = draft(stub(), FIXED);
  for (const marker of ['TODO(title)', 'TODO(open)', 'TODO(example)', 'TODO(cta)']) {
    assert.ok(md.includes(marker), `missing ${marker}`);
  }
  assert.match(md, /Not published/);
});

test('a PGCET tool pointed at the mocks platform is redrafted onto publications', () => {
  // Rs.999 is the wrong price for PGCET. The rule lives in lib/shell.ts; this
  // asserts the generator goes through it rather than copying cta.href blind.
  const md = draft(stub({ family: 'pgcet' }), FIXED);
  assert.match(md, /publications\.learncrew\.org/);
  assert.ok(!md.includes('Rs.999'), 'PGCET draft must not quote the Rs.999 price');
});

test('boundary: no FAQ and no sources still produces a usable skeleton', () => {
  const md = draft(stub({ faq: [], sources: undefined }), FIXED);
  assert.ok(!md.includes('### 1.'));
  assert.match(md, /TODO\(sources\)/);
});

test('a config with no slug is rejected rather than drafted to a stray filename', () => {
  assert.throws(() => draft({ ...stub(), slug: '' }, FIXED), TypeError);
  assert.throws(() => draft(undefined, FIXED), TypeError);
});

test('the real configs all load and draft', async () => {
  const tools = await loadTools();
  assert.ok(tools.length > 0, 'no tool configs found');
  for (const tool of tools) assert.match(draft(tool, FIXED), /^status: draft$/m);
});
