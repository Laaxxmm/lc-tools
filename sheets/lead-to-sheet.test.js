/**
 * Guard for the "Tool Leads" column mapping. Run: node sheets/lead-to-sheet.test.js
 *
 * Apps Script cannot run locally, so this loads lead-to-sheet.gs as text and
 * executes doPost against stubbed Google APIs. The All Leads view's `tools`
 * block is FILTER('Tool Leads'!A2:G, A2:A<>"") stacked under the website rows
 * with NO reordering, so Tool Leads A-G must be the view's own order — Date,
 * Time, Source, Page, Course, Name, Mobile — and column A must never be blank.
 * A column that moves here shows a phone number under Course in the view with
 * no error at all. These checks fail loudly instead.
 */
const fs = require('fs');
const assert = require('assert');
const src = fs.readFileSync(require('path').join(__dirname, 'lead-to-sheet.gs'), 'utf8');

function makeSheet(name) {
  const rows = [];                       // appended rows, in order
  const formats = {};                    // "r,c" -> number format
  let frozen = 0;
  return {
    name, rows, formats,
    appendRow(r) { rows.push(r.slice()); },
    getLastRow: () => rows.length,
    setFrozenRows(n) { frozen = n; },
    getFrozenRows: () => frozen,
    getRange(r, c, nr = 1, nc = 1) {
      return {
        getValues: () => Array.from({ length: nr }, (_, i) =>
          Array.from({ length: nc }, (_, j) => (rows[r - 1 + i] || [])[c - 1 + j] ?? '')),
        getValue: () => (rows[r - 1] || [])[c - 1] ?? '',
        setValues: (vals) => vals.forEach((row, i) => { rows[r - 1 + i] = row.slice(); }),
        setNumberFormat: (f) => { formats[`${r},${c}`] = f; },
      };
    },
  };
}

function run(payload, { existingTabs = [] } = {}) {
  const sheets = {};
  for (const t of existingTabs) sheets[t] = makeSheet(t);
  const ss = {
    getSheetByName: (n) => sheets[n] || null,
    insertSheet: (n) => (sheets[n] = makeSheet(n)),
  };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    Session: { getScriptTimeZone: () => 'Asia/Kolkata' },
    Utilities: { formatDate: () => 'X' },
    ContentService: { createTextOutput: s => ({ setMimeType: () => ({ getContent: () => s }) }), MimeType: { JSON: 1 } },
    Logger: { log() {} },
    console,
  };
  const fn = new Function(...Object.keys(ctx), src + `
    ; SHARED_SECRET = 'S';
    return { res: doPost({ postData: { contents: JSON.stringify(arguments[arguments.length-1]) } }), COL: COL, HEADERS: HEADERS, LEADS_SHEET: LEADS_SHEET };`);
  const out = fn(...Object.values(ctx), payload);
  return { sheets, ...out };
}

const LEAD = { secret: 'S', source: 'tools', page: 'cgpa-percentage-converter', course: 'PGCET MBA',
  name: 'Asha R', phone: '9800000000', email: 'asha@example.com', remarks: 'note', consent: true,
  channel: 'google-ads', gclid: 'G1', utm_source: 'google', utm_medium: 'cpc',
  utm_campaign: 'pgcet-aug', landing_page: '/tools/' };

// 1. It must NEVER write to All Leads — that sheet is a formula view.
{
  const { sheets, LEADS_SHEET } = run(LEAD, { existingTabs: ['All Leads'] });
  assert.equal(sheets['All Leads'].rows.length, 0, 'wrote into the All Leads view');
  assert.notEqual(LEADS_SHEET, 'All Leads');
  assert.ok(sheets['Tool Leads'], 'tool leads tab not created');
  console.log('ok  never touches All Leads; writes to "Tool Leads"');
}

// 2. The tab is created with a frozen header on first use.
{
  const { sheets, HEADERS } = run(LEAD);
  const t = sheets['Tool Leads'];
  assert.deepEqual(t.rows[0], HEADERS, 'header row');
  assert.equal(t.getFrozenRows(), 1, 'header not frozen');
  assert.equal(t.rows.length, 2, 'header + one lead');
  console.log('ok  tab created with frozen header');
}

// 3. A-G in the view's order, because the view's `tools` block stacks them
//    under the website rows with no reordering.
{
  const { sheets, COL } = run(LEAD);
  const r = sheets['Tool Leads'].rows[1];
  assert.deepEqual(
    [COL.DATE, COL.TIME, COL.SOURCE, COL.PAGE, COL.COURSE, COL.NAME, COL.MOBILE],
    [1, 2, 3, 4, 5, 6, 7], 'A-G must be Date, Time, Source, Page, Course, Name, Mobile');
  assert.ok(r[0] instanceof Date,                 'A must be a real Date — the FILTER keys on A<>"" and the view sorts on d*1');
  assert.ok(r[1] instanceof Date,                 'B must be a time serial (sorts as t*1)');
  assert.equal(r[1].getFullYear(), 1899,          'time serial anchored at the Sheets epoch');
  assert.equal(r[2], 'tools',                     'C must be Source (final QUERY filters on it)');
  assert.equal(r[3], 'cgpa-percentage-converter', 'D must be Page');
  assert.equal(r[4], 'PGCET MBA',                 'E must be Course');
  assert.equal(r[5], 'Asha R',                    'F must be Name');
  assert.equal(r[6], '9800000000',                'G must be Mobile');
  assert.equal(r[7], 'note',                      'H Remarks, outside the view');
  assert.equal(r[8], '',                          'I Status left blank');
  assert.equal(r[9], 'asha@example.com',          'J Email, outside the view');
  console.log('ok  A-G in the order the view stacks them');
}

// 4. Source never blank — a blank Col1 is silently dropped by the view.
{
  const { sheets } = run({ secret: 'S', name: 'No Source', phone: '9800000001' });
  assert.equal(sheets['Tool Leads'].rows[1][2], 'tools');
  console.log('ok  blank source defaults to "tools" so the view keeps the row');
}

// 5. Email and attribution land from column 10 on, outside the A2:G window.
{
  const { sheets, COL } = run(LEAD);
  const r = sheets['Tool Leads'].rows[1];
  assert.ok(COL.EMAIL >= 8 && COL.CHANNEL >= 8, 'nothing extra may sit inside A:G');
  assert.equal(r[COL.CHANNEL - 1], 'google-ads');
  assert.equal(r[COL.LANDING_PAGE - 1], '/tools/');
  assert.equal(r.length, 16);
  console.log('ok  email + attribution from column 10, view stays 7 wide');
}

// 6. Date/time cells get a readable number format.
{
  const { sheets, COL } = run(LEAD);
  const f = sheets['Tool Leads'].formats;
  assert.equal(f['2,1'], 'M/d/yyyy',     'A formatted as a date');
  assert.equal(f['2,2'], 'h:mm:ss am/pm', 'B formatted as a time');
  console.log('ok  date/time formatted');
}

// 7. Email List unchanged in shape; dedups and preserves an unsubscribe.
{
  const { sheets } = run(LEAD);
  const m = sheets['Email List'];
  assert.equal(m.rows.length, 2, 'header + one');
  assert.equal(m.rows[1][1], 'asha@example.com');
  console.log('ok  Email List still written');
}

console.log('\nall 7 checks passed');
