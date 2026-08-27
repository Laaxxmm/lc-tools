import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackToolUse, trackGateShown, trackLeadCaptured } from './analytics.ts';

interface FakeScript { src: string; async: boolean }
interface FakeWindow { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }

const host = globalThis as unknown as { window?: unknown; document?: unknown };

/** Fresh fake page per case — gtag() keys its load-once check off window.gtag. */
function install(id?: string): { win: FakeWindow; loaded: string[] } {
  if (id === undefined) delete process.env.NEXT_PUBLIC_GA4_ID;
  else process.env.NEXT_PUBLIC_GA4_ID = id;

  const win: FakeWindow = {};
  const loaded: string[] = [];
  host.window = win;
  host.document = {
    createElement: (): FakeScript => ({ src: '', async: false }),
    head: { appendChild: (s: FakeScript) => { loaded.push(s.src); } },
  };
  return { win, loaded };
}

const args = (entry: unknown): unknown[] => Array.from(entry as ArrayLike<unknown>);

test('no GA4 id: every call is a silent no-op and nothing is loaded', () => {
  const { win, loaded } = install();
  trackToolUse('cgpa-percentage-converter');
  trackGateShown('cgpa-percentage-converter');
  trackLeadCaptured('cgpa-percentage-converter');
  assert.equal(loaded.length, 0);
  assert.equal(win.dataLayer, undefined);
  assert.equal(win.gtag, undefined);
});

test('with a GA4 id: loads gtag.js once and queues the event', () => {
  const { win, loaded } = install('G-ABC123');
  trackToolUse('mba-cost-and-roi-calculator');

  assert.deepEqual(loaded, ['https://www.googletagmanager.com/gtag/js?id=G-ABC123']);
  const queue = win.dataLayer ?? [];
  assert.equal(args(queue[0])[0], 'js');
  // send_page_view: false — the GTM container owns the page_view. If this
  // branch ever wins the race with GTM, it must not fire a second one.
  assert.deepEqual(args(queue[1]), ['config', 'G-ABC123', { send_page_view: false }]);
  assert.deepEqual(args(queue[2]), [
    'event', 'tool_use', { tool_slug: 'mba-cost-and-roi-calculator' },
  ]);
});

test('boundary: later events reuse the loaded script, one entry each', () => {
  const { win, loaded } = install('G-ABC123');
  trackGateShown('t');
  trackLeadCaptured('t');
  trackLeadCaptured('t');

  assert.equal(loaded.length, 1);            // js + config + 3 events, one script
  assert.equal((win.dataLayer ?? []).length, 5);
  assert.equal(args((win.dataLayer ?? [])[2])[1], 'gate_shown');
  assert.equal(args((win.dataLayer ?? [])[3])[1], 'lead_captured');
});

test('server render: no window, no throw', () => {
  install('G-ABC123');
  delete host.window;
  assert.doesNotThrow(() => trackToolUse('t'));
  delete host.document;
  delete process.env.NEXT_PUBLIC_GA4_ID;
});
