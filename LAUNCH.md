# Launch checklist — learncrew.org/tools/

Everything below is either **done** or **needs you**. Nothing needs more building.

## Done and verified

- 6 tools, 127 tests passing, static export clean
- 73 files, 3.4 MB, zero localhost leakage
- Canonicals, sitemap (7 URLs), robots.txt, 404 rule all point at learncrew.org
- Open Graph + Twitter cards on every page, image included
- Favicons, header logo, footer lockup
- WordPress lead endpoint written (`wp/lc-leads.php`)
- CI deploy over FTPS, gated on tests

## Needs you — three things, in order

### 1. GitHub secrets (blocks deploy)

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Name | Value |
|---|---|
| `HOSTINGER_HOST` | your FTP host from hPanel → Files → FTP Accounts |
| `HOSTINGER_USER` | FTP username |
| `HOSTINGER_PASS` | FTP password |

Do this yourself in the GitHub UI. Never paste them into chat or a file.

### 2. WordPress lead endpoint (blocks lead capture)

Upload `wp/lc-leads.php` to `public_html/wp-content/mu-plugins/`
(create the folder if absent). Must-use plugins need no activation.

Check it is live:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://learncrew.org/wp-json/lc/v1/lead
```

405 or 400 means it is registered. 404 means the file is in the wrong place.

Until this exists, every form silently fails and you lose the leads.

### 3. GA4 measurement ID (ships blind without it)

Your old property `UA-213994111-1` stopped processing in **July 2023**. Create a
GA4 property, then add repo secret `NEXT_PUBLIC_GA4_ID` = `G-XXXXXXXXXX`.

The tracking code is written and inert until this exists. Without it you cannot
tell which tools work, and the 90-day rule for retiring dead tools cannot run.

## Deploy

Once secret set 1 is in place:

```bash
git commit --allow-empty -m "chore: trigger deploy" && git push
```

Or Actions → *deploy tools* → Run workflow. Tests gate the deploy: a failing
test ships nothing.

## Verify within five minutes of going live

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://learncrew.org/tools/
```

Then check by hand:

- `learncrew.org/tools/` loads and the WordPress site still works
- One tool computes an answer
- Submit a lead, confirm the row in wp-admin → Leads
- Paste a tool URL into WhatsApp: title, description and image should appear
- `learncrew.org/tools/sitemap.xml` resolves

## Then, and only then

1. Google Search Console → add `learncrew.org/tools/sitemap.xml`
2. Link the tools from your existing blog posts — internal links from an aged
   domain are the fastest ranking lever you have
3. Cloudflare Turnstile on the lead form before you push real traffic at it
4. The weekly blog-draft workflow opens a PR every Monday; it never publishes

## Rollback

Delete `public_html/tools/` over FTP. WordPress is untouched by any of this —
nothing here writes to the database except the mu-plugin, which only inserts
into its own table.
