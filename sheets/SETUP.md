# Sending tool leads into your Google Sheet

Leads land in three places, on purpose:

**All Leads is a view, not a table.** It is a LET/IMPORTRANGE formula that
stacks every source tab (`pgcet-page-form`, `home-mentor-form`, `mat-blog-popup`,
`contact-page-form`, `mat-page-form`, `pgcet-blog-popup`) and QUERYs them into
one list. Nothing may ever be typed or appended into that sheet: a static row
under an array formula stops the formula spilling, every imported row collapses
to `#REF!`, and the other columns "disappear". That is exactly what happened
when the first version of this script appended into it.

So tool leads get their own tab, **`Tool Leads`**, created by the script on
the first lead. The view's `tools` block reads it back:

```
tools, IFERROR(FILTER('Tool Leads'!A2:G, 'Tool Leads'!A2:A<>""), {"","","","","","",""})
```

and stacks it straight under the website rows with no reordering. So columns
A-G of `Tool Leads` mirror the view's own order exactly:

| # | Column | Why it sits here |
|---|---|---|
| 1 | Date | the FILTER keys on A being non-blank; stored as a real date so `d*1` sorts it exactly |
| 2 | Time | stored as a time serial, same reason |
| 3 | Source | the final QUERY drops any row where this is blank |
| 4 | Page (which tool) | |
| 5 | Course | |
| 6 | Name | |
| 7 | Mobile | |
| 8 | Remarks | outside the view's A:G window |
| 9 | Status | left blank for the team; outside the window |

Columns 10-16 are Email and attribution (Channel, GCLID, UTM Source / Medium /
Campaign, Landing Page). They sit outside the `A2:G` window the view reads on
purpose, so the view stays seven wide, but they stay beside the lead for anyone
opening the tab. `Channel` is the paid-vs-organic answer; `unknown` means the
visitor arrived before attribution shipped or with storage blocked.

| Where | Why |
|---|---|
| WordPress database | the record. Written first, so a webhook outage never loses a lead |
| **Tool Leads** tab | the source rows. The **All Leads** view imports them |
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

The All Leads view selects source columns by position, so a column that moves in
the script shows a phone number under Course with no error anywhere. To check
the mapping after editing the script:

```bash
node sheets/lead-to-sheet.test.js
```

It runs `doPost` against stubbed Google APIs, fails if any column moves, and
fails if the script ever writes into All Leads.

## Updating the script later

Pasting new code into the editor does **not** change what the `/exec` URL
serves. That URL is pinned to a deployed version, so without this step the
webhook keeps running the old code and nothing appears to change:

**Deploy → Manage deployments → (pencil icon) → Version: New version → Deploy**

Keep the same deployment rather than creating a new one — a new deployment
gives a different `/exec` URL, which would mean editing `wp-config.php` too.

Run `testAppend` from the editor afterwards. A row should appear in the
`Tool Leads` tab (created if missing) with `google-ads` in Channel, and then in
the All Leads view via the formula. Delete that row from `Tool Leads`.

## 4. The view formula needs no change

The `tools` block above already brings the tab in, and its `IFERROR(...,
{seven blanks})` guard means an empty or not-yet-created tab contributes a
blank row that the final `where Col3 is not null` drops, rather than breaking
the stack. Because the tab is read locally (not via IMPORTRANGE) there is no
"Allow access" step either.

If the view shows `#REF!` after the script is deployed, the cause is a typed or
pasted value left somewhere in All Leads' spill range. Delete it. A single
stray cell is enough.

The tab name in the formula and the script's `LEADS_SHEET` must match exactly,
including the space and capitals: `Tool Leads`.

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
