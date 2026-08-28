/**
 * Learn Crew — tool leads into the All Leads sheet.
 *
 * IMPORTANT: an Apps Script project can hold only ONE doPost. If this project
 * already has one receiving WordPress leads, adding this file will break it —
 * search the project for "doPost" before pasting. The dashboard script is safe;
 * it has no doPost.
 *
 * Deploy: Extensions → Apps Script → paste this → Deploy → New deployment →
 * type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 * Copy the /exec URL it gives you; that is what WordPress posts to.
 *
 * Anyone with the URL can append a row, so the URL is the secret. It is stored
 * in wp-config.php, never in the page, so it is never exposed to a browser.
 * SHARED_SECRET below is a second check in case the URL ever leaks.
 */

var LEADS_SHEET = 'All Leads';   // the calling list
var EMAIL_SHEET = 'Email List';  // the mailing list — created automatically

/**
 * Column order of the All Leads sheet, 1-indexed, matching the CONFIG already in
 * this project's dashboard script. Note PAGE at 4 — it is collapsed in the normal
 * view, so an 8-value append silently shifts every column after Source.
 */
var COL = {
  DATE: 1, TIME: 2, SOURCE: 3, PAGE: 4, COURSE: 5,
  NAME: 6, MOBILE: 7, REMARKS: 8, STATUS: 9,
  // Attribution, appended AFTER Status on purpose. Columns 1-9 keep their
  // positions, so the dashboard script's CONFIG keeps working untouched.
  CHANNEL: 10, GCLID: 11, UTM_SOURCE: 12, UTM_MEDIUM: 13,
  UTM_CAMPAIGN: 14, LANDING_PAGE: 15
};

var ATTR_HEADERS = ['Channel', 'GCLID', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Landing Page'];
var SHARED_SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    if (body.secret !== SHARED_SECRET) {
      return json({ ok: false, error: 'bad secret' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();
    var tz = Session.getScriptTimeZone();
    var date = Utilities.formatDate(now, tz, 'M/d/yyyy');
    var time = Utilities.formatDate(now, tz, 'h:mm:ss a');

    // 1. The calling list. Column order matches the sheet exactly. Status is left
    //    blank on purpose — that column belongs to your team, not to this script.
    var leads = ss.getSheetByName(LEADS_SHEET);
    if (!leads) return json({ ok: false, error: 'sheet not found: ' + LEADS_SHEET });
    // Build by column index rather than by position, so a hidden or reordered
    // column can never shift the data.
    var row = [];
    row[COL.DATE - 1]    = date;
    row[COL.TIME - 1]    = time;
    row[COL.SOURCE - 1]  = body.source || 'tools';
    row[COL.PAGE - 1]    = body.page || body.tool || '';
    row[COL.COURSE - 1]  = body.course || '';
    row[COL.NAME - 1]    = body.name || '';
    row[COL.MOBILE - 1]  = body.phone || '';
    row[COL.REMARKS - 1] = body.remarks || '';
    row[COL.STATUS - 1]  = '';                    // yours to fill, never ours

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
    prepareAttributionColumns(leads);
    leads.appendRow(row);

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
      var row = [date, body.email, body.name || '', body.source || 'tools',
                 body.course || '', body.consent ? 'yes' : 'no', ''];
      if (found) {
        // Preserve an existing unsubscribe. Re-subscribing someone who opted out
        // is the fastest way to get a sending domain blocked.
        var unsub = mail.getRange(found, 7).getValue();
        row[6] = unsub;
        mail.getRange(found, 1, 1, row.length).setValues([row]);
      } else {
        mail.appendRow(row);
      }
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/**
 * Make the Attribution columns safe to write to.
 *
 * Two jobs. appendRow() throws outright if the row is wider than the sheet, so
 * the sheet is widened first. Then the six new columns get labelled — but only
 * when row 1 is provably a header row (frozen) and the cells are still empty.
 * If either test fails the labels are skipped and the data still lands; the
 * columns just stay unlabelled. Never overwrite something already there: a
 * sheet whose row 1 holds data would otherwise lose that row to headers.
 */
function prepareAttributionColumns(sheet) {
  var needed = COL.LANDING_PAGE;
  if (sheet.getMaxColumns() < needed) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), needed - sheet.getMaxColumns());
  }

  if (sheet.getFrozenRows() < 1) return;   // cannot prove row 1 is a header
  var range = sheet.getRange(1, COL.CHANNEL, 1, ATTR_HEADERS.length);
  var current = range.getValues()[0];
  for (var i = 0; i < current.length; i++) {
    if (String(current[i]).trim() !== '') return;   // already labelled, leave it
  }
  range.setValues([ATTR_HEADERS]);
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
