# Sending tool leads into your Google Sheet

Leads land in three places, on purpose:

The All Leads sheet has **fifteen** columns. The first nine are yours and keep
their positions: `Page` sits at 4 and is collapsed in the normal view. Rows are
written by column index rather than by position, so a hidden or reordered column
cannot shift the data.

Columns 10-15 are attribution, appended after `Status` so nothing above them
moves and the dashboard script's CONFIG keeps working untouched:

| # | Column | What it holds |
|---|---|---|
| 10 | Channel | `google-ads`, `campaign-<source>`, `google-organic`, `referral`, `direct`, `unknown` |
| 11 | GCLID | Google's own click id, when the visit came from an ad |
| 12-14 | UTM Source / Medium / Campaign | whatever the link carried |
| 15 | Landing Page | the first tools page they opened |

**Channel is the paid-vs-organic answer.** Filter All Leads on it to see which
leads your ad spend actually produced. `unknown` means the visitor arrived
before attribution shipped, or with browser storage blocked — never blank, so
filtering never silently hides rows.

The script labels columns 10-15 for you on the first lead, but only when row 1
is a frozen header row and those cells are empty. If your sheet has no frozen
header row it leaves them unlabelled rather than risk overwriting a data row —
the leads still land either way.

| Where | Why |
|---|---|
| WordPress database | the record. Written first, so a webhook outage never loses a lead |
| **All Leads** tab | your calling list — name, phone, course, remarks |
| **Email List** tab | your mailing list — created automatically on the first lead |

Email gets its own tab so it can be exported straight into a mail tool without
dragging phone numbers and call notes along.

## 0. Check for an existing doPost first

**A project can hold only one `doPost`.** This sheet already has an Apps Script
(the dashboard builder). Before pasting anything:

- Open **Extensions → Apps Script**
- Press **Ctrl/Cmd + F** and search the project for `doPost`

If nothing is found — the dashboard script has none — add `lead-to-sheet.gs` as a
**new file** in that same project (Files → **+** → Script). It must live in the
same project because both need to be bound to this sheet.

If a `doPost` already exists and is receiving WordPress leads, do not paste this
over it. Tell me what it does and I will merge the two rather than replace one.

## 1. Add the script

Add `lead-to-sheet.gs` as a **new file** in the existing project — do not delete
the dashboard script. Then change one line:

```js
var SHARED_SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';
```

Make it long and random. Anyone holding the webhook URL can append rows, so this
is the second lock in case that URL ever leaks.

## 2. Test before wiring anything up

In the Apps Script editor pick `testAppend` and press Run. Grant permission when
asked. A test row should appear in **All Leads**, and an **Email List** tab should
be created. Delete the test row afterwards.

## Checking the column mapping

`Page` sits at column 4 and is collapsed, so an append that is one value short
writes Course into Page without any error. That has happened once already. To
check the mapping after editing the script:

```bash
node sheets/lead-to-sheet.test.js
```

It runs `doPost` against stubbed Google APIs and fails if any column moves.

## Updating the script later

Pasting new code into the editor does **not** change what the `/exec` URL
serves. That URL is pinned to a deployed version, so without this step the
webhook keeps running the old code and nothing appears to change:

**Deploy → Manage deployments → (pencil icon) → Version: New version → Deploy**

Keep the same deployment rather than creating a new one — a new deployment
gives a different `/exec` URL, which would mean editing `wp-config.php` too.

Run `testAppend` from the editor afterwards. A row should appear in All Leads
with `google-ads` in Channel and `TEST_GCLID` in GCLID. Delete that row.

## 3. Deploy it

**Deploy → New deployment → Web app**

- Execute as: **Me**
- Who has access: **Anyone**

"Anyone" is required — WordPress calls this without a Google login. The URL is
unguessable and the shared secret gates it. Copy the `/exec` URL.

## 4. Point WordPress at it

Edit `public_html/wp-config.php` and add these **above** the
`/* That's all, stop editing! */` line:

```php
define( 'LC_SHEET_WEBHOOK_URL', 'https://script.google.com/macros/s/XXXX/exec' );
define( 'LC_SHEET_SECRET', 'the same long random string' );
```

Until both are defined the forwarding stays off and leads simply collect in the
database — nothing breaks.

## 5. Confirm end to end

Open a tool, request a download, submit the form. Within a few seconds you should
see a new row in **All Leads** and one in **Email List**.

## Notes worth knowing

- **The sheet write happens after the database write.** If Google is slow or the
  script is broken, the lead is already saved and the visitor sees no error. Worst
  case is a missing sheet row, never a lost lead.
- **The email list de-duplicates.** A returning student updates their existing row
  instead of adding a second one.
- **Unsubscribes are preserved.** If you mark someone unsubscribed and they use a
  tool again, that flag is kept. Re-subscribing people who opted out is the
  fastest way to get a sending domain blocked.
- **WhatsApp opt-in is a separate column** from being on the email list. They are
  different consents and merging them is what gets numbers banned.
- Failures are written to the PHP error log, tagged `[lc-leads]`.
