# Sending tool leads into your Google Sheet

Leads land in three places, on purpose:

| Where | Why |
|---|---|
| WordPress database | the record. Written first, so a webhook outage never loses a lead |
| **All Leads** tab | your calling list — name, phone, course, remarks |
| **Email List** tab | your mailing list — created automatically on the first lead |

Email gets its own tab so it can be exported straight into a mail tool without
dragging phone numbers and call notes along.

## 1. Add the script

In the sheet: **Extensions → Apps Script**. Delete anything there, paste
`lead-to-sheet.gs`, and change one line:

```js
var SHARED_SECRET = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';
```

Make it long and random. Anyone holding the webhook URL can append rows, so this
is the second lock in case that URL ever leaks.

## 2. Test before wiring anything up

In the Apps Script editor pick `testAppend` and press Run. Grant permission when
asked. A test row should appear in **All Leads**, and an **Email List** tab should
be created. Delete the test row afterwards.

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
