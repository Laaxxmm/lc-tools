# lc-tools — Learn Crew free tools hub

Static tools hub deployed to `learncrew.org/tools/`, feeding leads to the Learn Crew
coaching, mock and publications properties.

- **Design spec:** `docs/superpowers/specs/2026-08-25-learncrew-tools-hub-design.md`
- **App:** `tools/` — Next.js static export (`output: 'export'`, `basePath: '/tools'`)
- **Data pipeline:** `data/` — KEA cutoff acquisition (blocked, see spec section 6)
- **WordPress:** `wp/` — lead-capture mu-plugin

## Why static

learncrew.org runs WordPress on Hostinger **WordPress Starter**, which cannot run Node.
Static files dropped in `public_html/tools/` are served directly: WordPress's rewrite only
fires for paths that are not real files or directories, so it never sees these requests.

## Commands

```
cd tools
npm install
npm test        # node:test, no framework — Node strips types natively
npm run build   # emits tools/out/, deployed to public_html/tools/
```
