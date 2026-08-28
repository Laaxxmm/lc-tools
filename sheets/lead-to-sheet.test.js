/**
 * Guard for the All Leads column mapping. Run: node sheets/lead-to-sheet.test.js
 *
 * Apps Script cannot run locally, so this loads lead-to-sheet.gs as text and
 * executes doPost against stubbed Google APIs. It exists because a column shift
 * has already happened on this sheet once: Page sits at 4 and is collapsed, so
 * an append that is one value short silently writes Course into Page. These
 * checks fail loudly if any column moves.
 */
const fs = require('fs');
const assert = require('assert');
const src = fs.readFileSync(require('path').join(__dirname, 'lead-to-sheet.gs'), 'utf8');

function makeSheet(name, { maxCols = 9, frozen = 1, header = [] } = {}) {
  const rows = [];
  const cells = {};                       // "r,c" -> value
  header.forEach((h, i) => { cells[`1,${i + 1}`] = h; });
  return {
    name, appended: rows, _cells: cells, _maxCols: maxCols, _frozen: frozen,
    getMaxColumns: () => cells.__max ?? maxCols,
    insertColumnsAfter(after, n) { maxCols = after + n; cells.__max = maxCols; },
    getFrozenRows: () => frozen,
    getLastRow: () => 1,
    setFrozenRows() {},
    appendRow(r) {
      if (r.length > (cells.__max ?? maxCols)) throw new Error('row wider than sheet');
      rows.push(r.slice());
    },
    getRange(r, c, nr = 1, nc = 1) {
      return {
        getValues: () => [Array.from({ length: nc }, (_, i) => cells[`${r},${c + i}`] ?? '')],
        getValue: () => cells[`${r},${c}`] ?? '',
        setValues: ([vals]) => vals.forEach((v, i) => { cells[`${r},${c + i}`] = v; }),
      };
    },
  };
}

function run(payload, sheetOpts) {
  const leads = makeSheet('All Leads', sheetOpts);
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => (n === 'All Leads' ? leads : null), insertSheet: () => makeSheet('Email List') }) },
    Session: { getScriptTimeZone: () => 'Asia/Kolkata' },
    Utilities: { formatDate: () => 'X' },
    ContentService: { createTextOutput: s => ({ setMimeType: () => ({ getContent: () => s }) }), MimeType: { JSON: 1 } },
    Logger: { log() {} },
    console,
  };
  const fn = new Function(...Object.keys(ctx), src + `
    ; SHARED_SECRET = 'S';
    return { res: doPost({ postData: { contents: JSON.stringify(arguments[arguments.length-1]) } }), COL: COL, ATTR_HEADERS: ATTR_HEADERS };`);
  const out = fn(...Object.values(ctx), payload);
  return { leads, ...out };
}

const LEAD = { secret: 'S', source: 'tools', page: 'cgpa-percentage-converter', course: 'PGCET MBA',
  name: 'Asha R', phone: '9800000000', remarks: 'note',
  channel: 'google-ads', gclid: 'G1', utm_source: 'google', utm_medium: 'cpc',
  utm_campaign: 'pgcet-aug', landing_page: '/tools/' };

// 1. Existing columns must not shift, and attribution must land in 10-15.
{
  const { leads, COL } = run(LEAD);
  const r = leads.appended[0];
  assert.equal(r[COL.SOURCE - 1], 'tools',                    'Source moved');
  assert.equal(r[COL.PAGE - 1],   'cgpa-percentage-converter','Page moved');
  assert.equal(r[COL.COURSE - 1], 'PGCET MBA',                'Course moved');
  assert.equal(r[COL.NAME - 1],   'Asha R',                   'Name moved');
  assert.equal(r[COL.MOBILE - 1], '9800000000',               'Mobile moved');
  assert.equal(r[COL.REMARKS - 1],'note',                     'Remarks moved');
  assert.equal(r[COL.STATUS - 1], '',                         'Status not blank');
  assert.equal(r[COL.CHANNEL - 1],      'google-ads');
  assert.equal(r[COL.GCLID - 1],        'G1');
  assert.equal(r[COL.UTM_SOURCE - 1],   'google');
  assert.equal(r[COL.UTM_MEDIUM - 1],   'cpc');
  assert.equal(r[COL.UTM_CAMPAIGN - 1], 'pgcet-aug');
  assert.equal(r[COL.LANDING_PAGE - 1], '/tools/');
  assert.equal(r.length, 15, 'row width');
  console.log('ok  columns 1-9 unmoved, attribution in 10-15');
}

// 2. A lead with no attribution must still land, marked unknown not blank.
{
  const { leads, COL } = run({ secret: 'S', name: 'No Attr', phone: '9800000001' });
  const r = leads.appended[0];
  assert.equal(r[COL.CHANNEL - 1], 'unknown');
  assert.equal(r[COL.NAME - 1], 'No Attr');
  console.log('ok  untagged lead lands as unknown');
}

// 3. Headers get written once into blank cells.
{
  const { leads, COL, ATTR_HEADERS } = run(LEAD, { frozen: 1 });
  const got = leads.getRange(1, COL.CHANNEL, 1, 6).getValues()[0];
  assert.deepEqual(got, ATTR_HEADERS);
  console.log('ok  headers labelled:', got.join(' | '));
}

// 4. Existing headers are never overwritten.
{
  const custom = ['Src','Click','S','M','C','Page'];
  const { leads, COL } = run(LEAD, { frozen: 1, header: ['','','','','','','','','', ...custom] });
  assert.deepEqual(leads.getRange(1, COL.CHANNEL, 1, 6).getValues()[0], custom);
  console.log('ok  renamed headers survive');
}

// 5. No frozen row = row 1 might be data. Never write headers there.
{
  const { leads, COL } = run(LEAD, { frozen: 0 });
  assert.deepEqual(leads.getRange(1, COL.CHANNEL, 1, 6).getValues()[0], ['','','','','','']);
  assert.equal(leads.appended[0][COL.CHANNEL - 1], 'google-ads', 'data must still land');
  console.log('ok  unfrozen sheet: no headers written, data still lands');
}

// 6. A 9-column-wide sheet must be widened, not throw.
{
  const { leads, COL } = run(LEAD, { maxCols: 9 });
  assert.equal(leads.appended[0][COL.LANDING_PAGE - 1], '/tools/');
  console.log('ok  narrow sheet widened instead of throwing');
}

console.log('\nall 6 checks passed');
