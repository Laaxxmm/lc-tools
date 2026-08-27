/**
 * Learn Crew — tool leads into the All Leads sheet.
 *
 * Deploy: Extensions → Apps Script → paste this → Deploy → New deployment →
 * type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 * Copy the /exec URL it gives you; that is what WordPress posts to.
 *
 * Anyone with the URL can append a row, so the URL is the secret. It is stored
 * in wp-config.php, never in the page, so it is never exposed to a browser.
 * SHARED_SECRET below is a second check in case the URL ever leaks.
 */

var LEADS_SHEET = 'All Leads';   // the calling list — name, phone, course
var EMAIL_SHEET = 'Email List';  // the mailing list — created automatically
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
    leads.appendRow([
      date, time,
      body.source || 'tools',
      body.course || '',
      body.name || '',
      body.phone || '',
      body.remarks || '',
      ''
    ]);

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
    course: 'PGCET MBA',
    name: 'Test Row',
    phone: '9999999999',
    email: 'test@example.com',
    consent: true,
    remarks: 'study plan | delete this row'
  })}});
  Logger.log(res.getContent());
}
