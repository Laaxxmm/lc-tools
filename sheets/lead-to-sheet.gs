/**
 * Learn Crew — tool leads into their own source tab, "Tool Leads".
 *
 * WHY A SEPARATE TAB. "All Leads" is not a table, it is a VIEW: a LET formula
 * that stacks every source tab and QUERYs them into one list. Appending rows
 * directly into that sheet puts static cells under an array formula, the
 * formula can no longer spill over them, and every imported row collapses into
 * #REF!. That was the "reference error" and the "other fields disappear". So
 * this script never touches All Leads. It writes to "Tool Leads", and the
 * view's own `tools` block reads that tab back in.
 *
 * COLUMN ORDER mirrors the view's first seven columns — Date, Time, Source,
 * Page, Course, Name, Mobile — because the view's `tools` block is
 * FILTER('Tool Leads'!A2:G, 'Tool Leads'!A2:A<>"") stacked straight under the
 * website rows with no reordering. Move a column here and the view shows a
 * phone number under Course with no error anywhere. Column A must never be
 * blank: that FILTER keys on it.
 *
 * IMPORTANT: an Apps Script project can hold only ONE doPost. If this project
 * already has one receiving WordPress leads, adding this file will break it —
 * search the project for "doPost" before pasting. The dashboard script is safe;
 * it has no doPost.
 *
 * Deploy: Extensions → Apps Script → paste this → Deploy → New deployment →
 * type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 * Copy the /exec URL it gives you; that is what WordPress posts to.
 * Updating later: Deploy → Manage deployments → pencil → New version → Deploy.
 * Pasting new code alone does NOT change what /exec serves.
 *
 * When replacing the whole file, copy your current SHARED_SECRET line first and
 * put it back over the placeholder: the repo copy never holds the real secret.
 *
 * Anyone with the URL can append a row, so the URL is the secret. It is stored
 * in wp-config.php, never in the page, so it is never exposed to a browser.
 * SHARED_SECRET below is a second check in case the URL ever leaks.
 */

var LEADS_SHEET = 'Tool Leads';  // read by the All Leads view's `tools` block
var EMAIL_SHEET = 'Email List';  // the mailing list — created automatically

/**
 * 1-indexed column of each field in the "Tool Leads" tab. 1-7 are what the
 * view's `tools` block reads (A2:G), in the view's order. 8-9 match the old
 * All Leads layout the dashboard CONFIG describes; the view ignores them.
 * Email and attribution sit from 10 on: outside the A:G window, so the view
 * stays seven wide, but still stored beside the lead for anyone opening the tab.
 */
var COL = {
  DATE: 1, TIME: 2, SOURCE: 3, PAGE: 4, COURSE: 5, NAME: 6, MOBILE: 7,
  REMARKS: 8, STATUS: 9,
  EMAIL: 10,
  CHANNEL: 11, GCLID: 12, UTM_SOURCE: 13, UTM_MEDIUM: 14,
  UTM_CAMPAIGN: 15, LANDING_PAGE: 16
};

var HEADERS = [
  'Date', 'Time', 'Source', 'Page', 'Course', 'Name', 'Mobile', 'Remarks', 'Status',
  'Email', 'Channel', 'GCLID', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Landing Page'
];

var SHARED_SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

// Sent back with every response, including "bad secret", so which copy is live
// can be checked from outside without writing a row. Bump it on every change.
var SCRIPT_VERSION = '2026-11-07';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (body.secret !== SHARED_SECRET) {
      return json({ ok: false, error: 'bad secret', version: SCRIPT_VERSION });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();

    // Date and time go in as real serials, not text. The view sorts on d*1 and
    // t*1 first and only falls back to parsing strings, so numbers sort exactly
    // and never depend on the sheet's locale reading "4/9/2026" the right way.
    var dateCell = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var timeCell = new Date(1899, 11, 30, now.getHours(), now.getMinutes(), now.getSeconds());

    // 1. The source tab. Created on first use so a typo in the tab name cannot
    //    send rows somewhere else; the view imports whatever this is called.
    var leads = ss.getSheetByName(LEADS_SHEET) || createLeadsSheet(ss);

    // Build by column index rather than by position, so nothing can shift.
    var row = [];
    row[COL.DATE - 1]    = dateCell;                 // column A: the view's FILTER keys on it
    row[COL.TIME - 1]    = timeCell;
    row[COL.SOURCE - 1]  = body.source || 'tools';   // final QUERY drops rows where this is blank
    row[COL.PAGE - 1]    = body.page || body.tool || '';
    row[COL.COURSE - 1]  = body.course || '';
    row[COL.NAME - 1]    = body.name || '';
    row[COL.MOBILE - 1]  = body.phone || '';
    row[COL.REMARKS - 1] = body.remarks || '';
    row[COL.STATUS - 1]  = '';                       // yours to fill, never ours
    row[COL.EMAIL - 1]   = body.email || '';

    // Where this lead came from. 'unknown' when the visitor arrived before
    // attribution shipped, or with storage blocked — never blank, so a filter
    // on Channel never silently hides rows.
    row[COL.CHANNEL - 1]      = body.channel || 'unknown';
    row[COL.GCLID - 1]        = body.gclid || '';
    row[COL.UTM_SOURCE - 1]   = body.utm_source || '';
    row[COL.UTM_MEDIUM - 1]   = body.utm_medium || '';
    row[COL.UTM_CAMPAIGN - 1] = body.utm_campaign || '';
    row[COL.LANDING_PAGE - 1] = body.landing_page || '';

    for (var c = 0; c < row.length; c++) {
      if (row[c] === undefined) row[c] = '';
    }
    leads.appendRow(row);
    // appendRow leaves the new cells on the default format; keep date/time
    // readable as the serials they are.
    var last = leads.getLastRow();
    leads.getRange(last, COL.DATE).setNumberFormat('M/d/yyyy');
    leads.getRange(last, COL.TIME).setNumberFormat('h:mm:ss am/pm');

    // 2. The mailing list, kept separate so it can be exported straight into an
    //    email tool without dragging call notes and phone numbers along.
    if (body.email) {
      var mail = ss.getSheetByName(EMAIL_SHEET);
      if (!mail) {
        mail = ss.insertSheet(EMAIL_SHEET);
        mail.appendRow(['Date', 'Email', 'Name', 'Source', 'Course', 'WhatsApp opt-in', 'Unsubscribed']);
        mail.setFrozenRows(1);
      }
      // One row per person. A returning student updates their existing row rather
      // than creating a duplicate you would later have to dedupe by hand.
      var emails = mail.getRange(2, 2, Math.max(mail.getLastRow() - 1, 1), 1).getValues();
      var found = 0;
      for (var i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).toLowerCase().trim() === String(body.email).toLowerCase().trim()) {
          found = i + 2;
          break;
        }
      }
      var mrow = [dateCell, body.email, body.name || '', body.source || 'tools',
                  body.course || '', body.consent ? 'yes' : 'no', ''];
      if (found) {
        // Preserve an existing unsubscribe. Re-subscribing someone who opted out
        // is the fastest way to get a sending domain blocked.
        var unsub = mail.getRange(found, 7).getValue();
        mrow[6] = unsub;
        mail.getRange(found, 1, 1, mrow.length).setValues([mrow]);
      } else {
        mail.appendRow(mrow);
      }
    }

    return json({ ok: true, version: SCRIPT_VERSION });
  } catch (err) {
    return json({ ok: false, error: String(err), version: SCRIPT_VERSION });
  }
}

/** The source tab, with the header row the other tabs have, frozen. */
function createLeadsSheet(ss) {
  var sheet = ss.insertSheet(LEADS_SHEET);
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  return sheet;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run ONCE from the editor (pick repairToolLeads in the toolbar, then Run).
 *
 * The October copy of this script wrote Source, Course, Email, Page, Name,
 * Remarks, Mobile, Date, Time, then attribution, so its rows show "tools" under
 * Date and scramble the All Leads view. This moves each of those rows into the
 * columns above and rewrites the header. A row that already has a real date in
 * column A is left alone, so running it twice changes nothing.
 */
function repairToolLeads() {
  var OLD = {
    SOURCE: 1, COURSE: 2, EMAIL: 3, PAGE: 4, NAME: 5, REMARKS: 6, MOBILE: 7,
    DATE: 8, TIME: 9, CHANNEL: 10, GCLID: 11, UTM_SOURCE: 12, UTM_MEDIUM: 13,
    UTM_CAMPAIGN: 14, LANDING_PAGE: 15
  };
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LEADS_SHEET);
  if (!sheet) return;
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  var last = sheet.getLastRow();
  if (last < 2) return;
  var width = Math.max(sheet.getLastColumn(), HEADERS.length);
  var rows = sheet.getRange(2, 1, last - 1, width).getValues();
  var moved = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (r[0] instanceof Date || !(r[OLD.DATE - 1] instanceof Date)) continue;
    var out = [];
    for (var c = 0; c < width; c++) out[c] = c < HEADERS.length ? '' : r[c];
    for (var k in OLD) out[COL[k] - 1] = r[OLD[k] - 1];
    sheet.getRange(i + 2, 1, 1, width).setValues([out]);
    sheet.getRange(i + 2, COL.DATE).setNumberFormat('M/d/yyyy');
    sheet.getRange(i + 2, COL.TIME).setNumberFormat('h:mm:ss am/pm');
    moved++;
  }
  Logger.log('Moved ' + moved + ' row(s) into the right columns.');
}

/** Run once from the editor to confirm a row lands before wiring WordPress up. */
function testAppend() {
  var res = doPost({ postData: { contents: JSON.stringify({
    secret: SHARED_SECRET,
    source: 'tools',
    page: 'cat-mat-study-plan-generator',
    course: 'PGCET MBA',
    name: 'Test Row',
    phone: '9999999999',
    email: 'test@example.com',
    consent: true,
    remarks: 'study plan | delete this row',
    channel: 'google-ads',
    gclid: 'TEST_GCLID',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'pgcet-aug',
    landing_page: '/tools/'
  })}});
  Logger.log(res.getContent());
}
