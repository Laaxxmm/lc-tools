# Deploying the tools hub

Four things need doing once. After that, every push to `main` builds, tests and ships
itself, and nothing reaches the server unless the tests pass.

Do them in this order. Step 4 tells you whether the rest worked.

---

## 1. Add the three GitHub secrets

**Do not paste these into a chat window, an issue, or a commit.** Type them straight into
GitHub. Anyone who reads an FTP password owns the site.

Get the values from hPanel → **Files → FTP Accounts**. Create a new FTP account scoped to
`public_html` rather than reusing the main one, so a leak costs you one account instead of
the whole hosting login.

In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Value |
|---|---|
| `HOSTINGER_HOST` | FTP hostname from hPanel, e.g. `ftp.learncrew.org` — hostname only, no `ftps://` |
| `HOSTINGER_USER` | FTP username |
| `HOSTINGER_PASS` | FTP password |

The workflow connects over FTPS. If the first run fails on the connection, check hPanel has
FTP enabled for that account and that the host string carries no scheme or port.

Rotate the password in hPanel and update the secret if it was ever typed anywhere it should
not have been. A rotation costs two minutes.

---

## 2. Install the lead endpoint

The static pages cannot accept a form post. WordPress can, on the same origin, so there is
no CORS to configure and no third party holding student contact details.

1. In hPanel → **File Manager**, open `public_html/wp-content/`.
2. If there is no `mu-plugins` folder, create one. The name is exact.
3. Upload `wp/lc-leads.php` into it.

That is the whole install. Must-use plugins load on every request and have no activation
screen, so there is nothing to switch on. The table is created on the first page load after
upload.

**Check it worked.** In wp-admin you should now see **Tools → Learn Crew leads**, listing
zero leads. Then confirm the endpoint answers:

```bash
curl -i https://learncrew.org/wp-json/lc/v1/lead \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","tool":"deploy-check","whatsappConsent":false}'
```

`HTTP/1.1 201` and the row appearing in that admin screen means it is live. A `404` means
the file is in the wrong folder.

Post the same command six times in a row and the sixth should come back `429`. That is the
rate limit working — five posts per IP per ten minutes.

Delete the test row before you go live.

**On consent.** The table stores the WhatsApp opt-in as a boolean, a timestamp and the IP
that gave it. Keep all three. Under the DPDP Act you have to be able to show consent was
given, and the WhatsApp Business API bans numbers that message people who never opted in —
that one is a business risk, not just a legal one. A consent checkbox with no timestamp
beside it is not evidence of anything.

---

## 3. Supply a GA4 measurement ID

There is currently no working analytics on this site. The old property, `UA-213994111-1`,
is a Universal Analytics ID, and Universal Analytics stopped processing data on 1 July 2023.
Anything still pointing at it has recorded nothing for three years.

You need a GA4 property, whose ID looks like `G-XXXXXXXXXX`.

1. **analytics.google.com** → Admin → Create property (or open the existing GA4 one).
2. Add a **Web** data stream for `learncrew.org`.
3. Copy the measurement ID from the stream.
4. In GitHub: **Settings → Secrets and variables → Actions → Variables → New repository
   variable**, named `NEXT_PUBLIC_GA4_ID`, with that ID as the value.

It goes in **Variables**, not Secrets. The ID is visible in the page source of every site
that uses one, so treating it as a secret buys nothing and makes it harder to work with.

Leave it unset and the site still works — `lib/analytics.ts` loads nothing, requests
nothing and sets no cookie. That is the current state, and it is a safe one to stay in
until you actually want the numbers.

The next deploy after you add it starts recording `tool_use`, `gate_shown` and
`lead_captured`, each tagged with the tool slug. Those three are what tell you which tools
to keep building on and which ones to leave alone.

---

## 4. Verify `/tools/` resolves

Push to `main`, or run **Actions → Deploy tools → Run workflow**. Watch it go green, then:

- `https://learncrew.org/tools/` loads the hub.
- `https://learncrew.org/tools/mba-exam-dates-2026/` loads with the trailing slash.
- The same URL **without** the trailing slash also lands on the page.
- The rest of learncrew.org is untouched. WordPress only rewrites paths that are not real
  files or directories, and `public_html/tools/` is a real directory, so WordPress never
  sees these requests.
- A tool runs and returns a result without asking for an email first.

If `/tools/` shows a WordPress 404, the upload went somewhere other than
`public_html/tools/`. Check the file manager before touching anything else.

---

## Two settings that will bite you otherwise

**The weekly draft workflow needs permission to open pull requests.**
**Settings → Actions → General → Workflow permissions** → tick *Allow GitHub Actions to
create and approve pull requests*. Without it, `weekly-blog.yml` generates the drafts and
then fails at the last step every Monday.

**Both workflows pin Node 22, not 20.** The test suite is TypeScript run directly by
`node --test`, which depends on native type stripping. Node 20 cannot load a `.ts` file at
all, so on Node 20 `npm test` fails on every run and the deploy never ships. If you move
these back to 20, add a compile step for the tests first.

---

## What the weekly draft workflow does, and what it will not do

Mondays at 04:00 UTC (09:30 IST) it generates one markdown skeleton per tool into
`content/drafts/` and opens a pull request.

It does not publish. There is no WordPress call in it, nothing auto-merges, and the files
it writes are outlines full of `TODO` markers rather than articles. Pushing unreviewed
generated content to a live domain is how a working SEO programme gets undone, and the
recovery takes months. The pull request is where you write the actual post.

It also never overwrites a draft that already exists, so a half-written article sitting in
`content/drafts/` is safe from next Monday's run.
