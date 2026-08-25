import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXAMS, daysBetween, nextMilestone, parseIso, trackerRows, type Exam } from './exam-dates.ts';

const TODAY = '2026-08-26';

const exam = (over: Partial<Exam> = {}): Exam => ({
  id: 'test',
  name: 'Test exam',
  conductedBy: 'Nobody',
  stream: 'mba',
  site: 'https://example.org/',
  examDate: '2026-11-29',
  examLabel: '29 November 2026',
  examConfirmed: true,
  regLabel: 'Some window.',
  regConfirmed: false,
  ...over,
});

test('day counts match the calendar, leap year and month lengths included', () => {
  assert.equal(daysBetween(TODAY, '2026-11-29'), 95);   // CAT 2026
  assert.equal(daysBetween(TODAY, '2026-09-13'), 18);   // MAT paper-based
  assert.equal(daysBetween('2028-02-28', '2028-03-01'), 2);
});

test('the count is the same on both sides of a timezone', () => {
  // Parsing as UTC midnight is what keeps a build server and a phone in agreement.
  assert.equal(parseIso('2026-08-26'), Date.UTC(2026, 7, 26));
});

test('the next milestone is the soonest date still ahead, not a fixed order', () => {
  // NMAT closes registration part way into its own testing window, so a rule of
  // "registration first, then exam" would report the wrong deadline.
  const rolling = exam({ examDate: '2026-10-01', regCloses: '2026-10-12' });
  assert.equal(nextMilestone(rolling, TODAY).kind, 'exam');

  const normal = exam({ examDate: '2026-11-29', regCloses: '2026-09-15' });
  assert.equal(nextMilestone(normal, TODAY).kind, 'closes');
});

test('registration that has not opened yet counts down to opening', () => {
  const later = exam({ regOpens: '2026-11-01', regCloses: '2026-12-05', examDate: '2027-01-25' });
  const next = nextMilestone(later, TODAY);
  assert.equal(next.kind, 'opens');
  assert.equal(next.days, 67);
});

test('a deadline landing today still counts as ahead of you, at zero days', () => {
  const next = nextMilestone(exam({ regCloses: TODAY }), TODAY);
  assert.equal(next.kind, 'closes');
  assert.equal(next.days, 0);
});

test('once the exam is past, the milestone flips to days since', () => {
  const next = nextMilestone(exam({ examDate: '2026-08-20' }), TODAY);
  assert.equal(next.kind, 'over');
  assert.equal(next.days, 6);
});

test('rows sort by urgency and push finished exams to the bottom', () => {
  const rows = trackerRows(
    [
      exam({ id: 'far', examDate: '2027-06-01' }),
      exam({ id: 'held', examDate: '2026-08-01' }),
      exam({ id: 'soon', examDate: '2026-09-13', regCloses: '2026-09-06' }),
    ],
    TODAY,
  );
  assert.deepEqual(rows.map((r) => r.exam.id), ['soon', 'far', 'held']);
});

test('the stream filter keeps exams that feed both streams', () => {
  const ids = (s: 'mba' | 'mca') => trackerRows(EXAMS, TODAY, s).map((r) => r.exam.id);
  assert.ok(ids('mca').includes('nimcet'));
  assert.ok(!ids('mca').includes('cat'));
  assert.ok(ids('mca').includes('cuet-pg'), 'CUET PG feeds MCA seats too');
  assert.ok(ids('mba').includes('cuet-pg'), 'and MBA seats');
});

test('only the dates the exam bodies have actually published are marked confirmed', () => {
  // The honesty guard. Adding a confirmed date without a published notification
  // breaks this test on purpose.
  const confirmed = EXAMS.filter((e) => e.examConfirmed).map((e) => e.id).sort();
  assert.deepEqual(confirmed, ['cat', 'mat-cbt', 'mat-pbt']);
  assert.ok(EXAMS.every((e) => !e.regConfirmed), 'no registration deadline is published yet');
});

test('every row links an official site and carries a date the tracker can read', () => {
  for (const e of EXAMS) {
    assert.match(e.site, /^https:\/\//, `${e.id} needs an https source`);
    assert.doesNotThrow(() => parseIso(e.examDate), `${e.id} exam date`);
    if (e.regOpens && e.regCloses) {
      assert.ok(daysBetween(e.regOpens, e.regCloses) > 0, `${e.id} closes before it opens`);
    }
  }
});

test('rejects anything that is not a real ISO date instead of counting from NaN', () => {
  assert.throws(() => parseIso('soon'), /Not an ISO date/);
  assert.throws(() => parseIso('13-09-2026'), /Not an ISO date/);
  assert.throws(() => parseIso('2026-13-01'), /Not a real date/);
});
