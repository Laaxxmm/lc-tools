/**
 * Learn Crew — tool leads into their own source tab, "Tool Leads".
 *
 * WHY A SEPARATE TAB. "All Leads" is not a table, it is a VIEW: a LET/IMPORTRANGE
 * formula that stacks every source tab (pgcet-page-form, home-mentor-form, …)
 * and QUERYs them into one list. Appending rows directly into that sheet puts
 * static cells under an array formula, the formula can no longer spill over
 * them, and every imported row collapses into #REF!. That was the "reference
 * error" and the "other fields disappear". So this script never touches
 * All Leads. It writes to "Tool Leads", and one extra IMPORTRANGE line in the
 * view formula brings the rows in exactly like the WordPress tabs.
 *
 * COLUMN ORDER matches the other source tabs, because the view selects by
 * position (Col8 = date, Col9 = time, Col1 = source, Col4 = page, Col2 = course,
 * Col5 = name, Col7 = mobile) and filters on "Col1 is not null". Get a column
 * wrong here and the view shows a phone number under Course. Columns 3 and 6
 * are not read by the view; they hold email and remarks.
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
 * Anyone with the URL can append a row, so the URL is the secret. It is stored
 * in wp-config.php, never in the page, so it is never exposed to a browser.
 * SHARED_SECRET below is a second check in case the URL ever leaks.
 */

var LEADS_SHEET = 'Tool Leads';  // a SOURCE tab, imported by the All Leads view
var EMAIL_SHEET = 'Email List';  // the mailing list — created automatically

/**
 * 1-indexed column of each field in the "Tool Leads" tab. Columns 1-9 are the
 * A2:I window the view imports, in the same order as the WordPress tabs.
 * Attribution sits in 10-15: outside the imported window on purpose, so the
 * view stays 9 wide, but still stored beside the lead for anyone opening the tab.
 */
var COL = {
  SOURCE: 1, COURSE: 2, EMAIL: 3, PAGE: 4, NAME: 5, REMARKS: 6, MOBILE: 7,
  DATE: 8, TIME: 9,
  CHANNEL: 10, GCLID: 11, UTM_SOURCE: 12, UTM_MEDIUM: 13,
  UTM_CAMPAIGN: 14, LANDING_PAGE: 15
};

var HEADERS = [
  'Source', 'Course', 'Email', 'Page', 'Name', 'Remarks', 'Mobile', 'Date', 'Time',
  'Channel', 'GCLID', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Landing Page'
];

var SHARED_SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (body.secret !== SHARED_SECRET) {
      return json({ ok: false, error: 'bad secret' });
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
    row[COL.SOURCE - 1]  = body.source || 'tools';   // view drops rows where this is blank
    row[COL.COURSE - 1]  = body.course || '';
    row[COL.EMAIL - 1]   = body.email || '';
    row[COL.PAGE - 1]    = body.page || body.tool || '';
    row[COL.NAME - 1]    = body.name || '';
    row[COL.REMARKS - 1] = body.remarks || '';
    row[COL.MOBILE - 1]  = body.phone || '';
    row[COL.DATE - 1]    = dateCell;
    row[COL.TIME - 1]    = timeCell;

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

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
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
