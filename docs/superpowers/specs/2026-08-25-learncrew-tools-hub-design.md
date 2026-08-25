# LearnCrew Tools Hub — Design Spec

**Date:** 2026-08-25
**Status:** Draft, awaiting approval
**Owner:** Lakshmanan

---

## 1. Purpose

Build a free-tools hub at `learncrew.org/tools/` that captures MBA/MCA exam aspirants at the moment
of highest intent, converts a share of them into buyers of existing LearnCrew products (mocks,
recorded classes, books), and turns post-exam traffic into counselling and college-referral revenue.

The tools are the acquisition layer. The existing learncrew.org platform is the monetisation layer.
This spec covers the acquisition layer only.

---

## 2. Goals

1. Rank for long-tail and programmatic exam queries that large incumbents do not cover well.
2. Capture email + phone from high-intent visitors with explicit WhatsApp consent.
3. Ship one new tool per week on an automated pipeline after the initial three.
4. Own a normalised Karnataka cutoff dataset that no competitor has in structured form.
5. Reuse one predictor engine across every exam rather than rebuilding per exam.

## 3. Non-goals

- Not rebuilding the mock-test platform. Mocks stay where they are.
- Not attacking head terms (`CAT college predictor`, `CAT percentile predictor`) in year one.
  Incumbents have decade-old domains; those SERPs are not winnable yet.
- Not building a CRM. Leads land in the WordPress database; follow-up is manual until volume hurts.
- Not building MCA tools before December 2026. All MCA exams are March–June 2027.

---

## 4. Constraint that drives everything: the exam calendar

| Exam | Date | Implication |
|---|---|---|
| MAT | 13 & 20 Sep 2026 | 3 weeks out, peak intent now |
| CAT 2026 | 29 Nov 2026 | registration opened 3 Aug, 13 weeks out |
| NMAT / SNAP / CMAT | Dec 2026 – Jan 2027 | registration season |
| XAT | 3 Jan 2027 | registration season |
| MAH CET MBA | Apr–May 2027 | far |
| NIMCET / CUET PG / MAH MCA CET | Mar–Jun 2027 | far |
| Karnataka PGCET | concluded | counselling crowd live now |

**Consequence:** Aug–Nov is pre-exam season. Traffic in this window is composed of *buyers* for the
products LearnCrew already sells. Post-exam predictor traffic for national exams does not exist
until roughly 20 Dec.

Post-exam tools must therefore be **built and indexed by 1 Dec**, not launched on results day. A page
published the day results drop ranks nowhere.

---

## 5. Architecture

### 5.1 Hosting

learncrew.org runs WordPress on Hostinger, **WordPress Starter** plan (confirmed 2026-08-26, expires
2029-01-23). hPanel explicitly gates Web Apps behind Business plans and higher, so Node is not
available on this account. Even on Business/Cloud, Node.js Web Apps are separate site entries that
cannot occupy a subfolder of an existing site.

SSH may not be present on Starter. The deploy pipeline uses FTPS and therefore does not depend on it.

**Decision: Next.js static export deployed into `public_html/tools/`.**

Roughly 28 of 30 tools are pure client-side computation. The cutoff explorer is the ideal
static-generation case. Only lead capture needs a server, and WordPress already provides one.

WordPress requires no configuration change. Its rewrite rule only fires for paths that are not real
files or directories:

```apache
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
```

A real `public_html/tools/` directory fails `!-d`, so the rule is skipped and the static files are
served directly. WordPress never sees the request.

```js
// next.config.js
module.exports = {
  output: 'export',
  basePath: '/tools',
  trailingSlash: true,           // required for Apache to resolve clean URLs to index.html
  images: { unoptimized: true },
}
```

Static output also suits the plan tier: tool pages consume no PHP workers and no database queries,
so they load faster than the WordPress pages beside them and add no strain to a Starter plan.

**Inode ceiling.** Every generated page is a file, and shared plans cap total file count; WordPress
already consumes a large share. Check usage in hPanel before the programmatic set grows. Mitigation
when headroom tightens: collapse the deepest URL tier so one page per college x category holds all
years, rather than one page per year. Fewer files, and a more useful page.

**Escape hatch (not built now):** if a future tool genuinely needs SSR or authenticated state, put
Cloudflare in front of the domain and route `/tools/*` to a Node host while everything else stays on
Hostinger. Choosing static today does not foreclose this.

### 5.2 Repository layout

```
/
├── tools/                    Next.js app (static export)
│   ├── config/<slug>.json    one config per tool
│   ├── calc/<slug>.ts        one pure function per tool
│   ├── components/           shared form, result, gate, video embed
│   └── content/<slug>.mdx    explainer prose + FAQ
├── data/
│   ├── raw/                  downloaded KEA PDFs, immutable
│   ├── normalised/           parsed cutoff data as JSON/CSV
│   └── pipeline/             download + parse + validate scripts
├── wp/lc-leads.php           WordPress mu-plugin, lead endpoint
└── .github/workflows/        build, deploy, weekly release
```

### 5.3 The tool factory

Adding a tool must cost one config file plus one pure function. Everything else is generated.

A tool config declares: slug, exam, title, inputs (type, label, validation), result shape, SEO
metadata, FAQ entries, related tools, gate policy, video ID.

Generated from that config: the page, form, result view, `SoftwareApplication` and `FAQPage` schema,
breadcrumbs, sitemap entry, internal links, lead gate, analytics events.

The calc module is a pure `input -> output` function with no I/O. This makes every tool trivially
unit-testable and is the reason the whole thing can be static.

**Each calc module ships with an assertion-based self-check** covering at least one known-good case
and one boundary case. A predictor that silently returns wrong colleges destroys the trust the entire
funnel depends on.

### 5.4 Lead capture

Static pages cannot accept POSTs. WordPress REST is same-origin, so no CORS and no new service, and
leads land beside existing student records.

`POST /wp-json/lc/v1/lead` — implemented as a mu-plugin writing to a custom table.

Required at the trust boundary:
- Server-side validation of email format and phone length. Never trust the client.
- Honeypot field plus Cloudflare Turnstile. An open write endpoint on a public site is found fast.
- Rate limit per IP.
- Store consent state and timestamp (see §7).

### 5.5 Deployment

GitHub Actions builds and deploys over FTPS to `/public_html/tools/`. Hostinger's own Git deployment
serves the repo as-is with no build step, so CI must produce the artefact.

Two triggers: push to `main`, and a weekly cron (Mon 04:00 UTC / 09:30 IST) for the scheduled tool
release.

---

## 6. Data pipeline — highest-risk component

### 6.1 What KEA publishes - resolved 2026-08-26

Initial HTTP probing suggested the data was unreachable: `cutoff.aspx` 301s to an
extensionless route that serves the generic KEA landing shell, and the year pages carry
only stale, irrelevant PDFs. That conclusion was wrong. The cutoff PDFs exist; they are
linked from each year page under Kannada labels (`MBA CUT-OFF`), which the first
English-keyword scan missed.

Each year uses a DIFFERENT naming scheme. Do not assume a pattern generalises:

| Year | Directory | Cutoff filename pattern |
|---|---|---|
| 2023 | `pgcet2023` | `PGCET_cutoff_2023_r1_mba_fin.pdf` |
| 2024 | `pgcet24`   | `PGCET_cutoff_2024_r1_mba_finkannada.pdf` |
| 2025 | `pgcet2025` | `PROF_CODE_{B\|C\|T}_{R\|H}_FIN.pdf` |

Base: `https://cetonline.karnataka.gov.in/keawebentry456/<dir>/`.
Course codes B=MBA, C=MCA, T=MTech. Quota R=Rest of Karnataka, H=Hyderabad-Karnataka.

2019 is listed by KEA but every cutoff file 404s - dead links. 2020-2022 were never
published. 2026 counselling had not begun as of 2026-08-26 (provisional result 19 Aug),
so no 2026 cutoffs exist yet; the fetcher must be re-run once allotment rounds publish.

### 6.2 Extraction

`pypdf` with `extraction_mode="layout"`. The default mode reads the 2023/24 tables
column-wise and silently shreds every row while still producing plausible-looking text -
the most dangerous failure available here.

Two block layouts, both handled by `data/pipeline/parse.py`:
- 2025: `College: <code> <name>`, header prefixed `Course Name`, 9 categories, HK quota
  in a separate file.
- 2023/24: `<serial> <code> <name>`, bare category header, 19 categories with the HK
  quota folded in as `*H` columns.

Categories are parsed from each block's header rather than hardcoded, because the set
genuinely differs by year. A `--` yields no row at all, never a zero.

### 6.3 Gate status: PASSED

Three clean years for both MBA and MCA - the threshold was three.

| Year | Rows | Colleges |
|---|---|---|
| 2023 | 3,401 | 394 |
| 2024 | 3,367 | 455 |
| 2025 | 2,526 | 419 |

**9,294 rows total.** `data/pipeline/verify.py` asserts 14 values read by eye from the
source PDFs, including a negative case confirming `--` produces no row. All pass.

The PGCET college predictor is therefore **restored to the roadmap**, along with the
predictor engine that tools 19-26 reuse. It was not part of the shipped first release
because the gate result arrived after that release was already in flight.

### 6.4 Collection conduct

Public data published by a government body. Standard practice applies: honour `robots.txt`,
rate-limit to roughly one request every 2 seconds, set a real user agent with contact details, cache
downloads in `data/raw/` so re-parsing never re-hits the origin, and attribute KEA as the source on
every page that displays derived figures.

### 6.5 Normalised schema

```
cutoff(exam, year, round, college_code, college_name, course, category, closing_rank, source_pdf_url)
college(code, name, city, district, type, affiliation, intake)
```

`source_pdf_url` on every row is non-negotiable — it makes every displayed number auditable and is
what allows the site to claim accuracy credibly.

### 6.6 Accuracy disclaimer

Every predictor result displays: estimates derived from previous years' KEA data, not official, not a
guarantee of admission, with a link to the source PDF. This protects LearnCrew and is also the
honesty that differentiates it from competitors.

---

## 7. Consent and messaging compliance

Collecting email + phone for WhatsApp outreach is load-bearing for the funnel and legally constrained.

- **DPDP Act 2023:** notice at the point of collection stating what is collected, why, and how to
  withdraw. Consent must be a separate affirmative action, not a pre-ticked box.
- **WhatsApp:** the Business API requires prior opt-in. Messaging without it gets the sender number
  banned by Meta — a practical business risk, not merely a legal one.
- **Implementation:** an unticked checkbox reading approximately "Send me exam updates and my results
  on WhatsApp." Store the consent boolean, timestamp, IP, and the tool that captured it.
- Every message carries an opt-out. Honour it immediately.

Phone is required only for gated deliverables (PDF plans, detailed reports). Email alone unlocks
basic results. Requiring phone everywhere would roughly halve completion.

---

## 8. Tool catalogue

**Pre-exam — produce buyers (build Aug–Nov)**

1. Exam eligibility checker
2. Application deadline tracker
3. Study plan generator (weeks-to-exam → day-by-day plan, gated PDF)
4. Percentile-to-target reverse calculator
5. Mock score analyser
6. Sectional test simulator
7. Syllabus / topic tracker
8. Formula and shortcut sheet generator
9. Daily vocab / RC drill widget
10. Profile evaluator
11. Exam comparison tool
12. Cost-of-MBA calculator
13. Education loan EMI + ROI calculator
14. Countdown and revision calendar
15. Mock series comparison

**Post-exam — produce traffic and counselling leads (build Oct–Nov, launch Dec)**

16. Score calculator from response sheet — highest-volume tool in the category
17. Percentile predictor
18. Normalisation calculator
19. College predictor
20. Rank predictor
21. Cutoff explorer — the programmatic SEO engine
22. Seat matrix explorer
23. Counselling choice-order generator — sticky, direct path to paid counselling
24. Admission chance calculator
25. College comparison
26. Waitlist movement predictor

**Evergreen — cheap volume and link bait**

27. Percentage ↔ CGPA converter
28. Age-as-on-date eligibility calculator
29. Category / reservation explainer and document checklist
30. B-school ROI ranking — built to be cited

### First three

1. **Study plan generator (CAT/MAT)** — peak search now, MAT in 3 weeks, every lead is a pre-exam
   buyer for products that already exist. Fastest path to revenue.
2. **Exam eligibility + deadline tracker** — CAT registration closing, pure urgency, no historical
   data dependency, gives a weekly reason to email the list.
3. **PGCET/KMAT college predictor** — counselling crowd live today, data already owned, and it builds
   the predictor engine that tools 19–26 reuse in December. Subject to the §6.3 gate.

One urgency tool, one lead tool, one engine tool.

---

## 9. Content system

### 9.1 Voice

Derived from the existing learncrew.org blog and to be matched exactly.

- Second person throughout. "You can still write PGCET", not "candidates may apply".
- Short declarative opener, then a longer explanatory sentence. Vary deliberately.
- Titles follow `[Situation]: [Solution]` or `[Thing] [Year]: [What you get]`.
- Read-time indicator on every page.
- Mid-technical: explain terminology without patronising.
- Stated house rule, preserved: no filler, no fear-selling. Never manufacture urgency about a
  student's future to sell a mock.
- Lead with the honest answer even when it is unhelpful to the sale. This is the differentiator
  against sites that exist to farm leads.

### 9.2 Originality guardrails

- Never open a competitor page while drafting. Source facts from primary sources only — KEA, IIM,
  NTA, AICTE, official notifications.
- Every factual claim carries a primary-source link.
- Worked examples use LearnCrew's own dataset and real student scenarios, never a competitor's.
- Banned register: "delve", "in today's fast-paced world", "unlock your potential", "game-changer",
  "look no further", "it is important to note that".
- No em-dash-heavy list-of-three constructions; match the existing blog's plainer rhythm.
- Originality check before publish. Anything above 15% similarity to any indexed page gets rewritten.
- Programmatic pages must carry genuine per-page data. A page that exists only to hold a keyword is
  thin content and endangers the whole domain.

### 9.3 Volume

Roughly 1,200 words per tool page, 30 tools, plus programmatic pages. Drafted here, reviewed by
Lakshmanan before publish. Review is the rate limiter, and that is intentional.

---

## 10. SEO

**On-page.** Working tool above the fold, no signup required for the basic result. Below it, 800–1,200
words explaining how the calculation works with a worked example. FAQ block with schema — this is what
earns AI Overview and assistant citations, a growing share of this traffic. Internal links to the four
nearest tools and the relevant exam hub. Embedded companion video.

**Programmatic.** From the cutoff dataset generate `/cutoff/{exam}/{college}/{branch}/{category}/{year}`.
Hard guardrail: publish only where real data exists. 800 real pages beat 8,000 empty ones, and thin
auto-generated pages put the entire domain at risk.

**Off-page.** Working tools are the link asset — nobody links to a coaching page, people link to a
calculator. Tool 30 exists specifically to be cited. Seed where aspirants actually are: PaGaLGuY,
r/CATpreparation, exam Telegram groups, Quora — answering real questions, linking only where the tool
genuinely answers. Existing blog links into tools. College partnerships produce permanent links with
aligned incentives.

**Video.** Each tool ships with a walkthrough video embedded on its own page. The tool answers "what
will I get"; the video answers "should I take it" — the literal next thought. Raises dwell time and
feeds the counselling funnel.

---

## 11. Revenue model

| Stream | Window | Realistic contribution |
|---|---|---|
| Mocks, recorded classes, books | Aug–Nov | Primary this cycle |
| Paid counselling (₹999–4,999) | Dec–Jul | Significant, needs tool 23 |
| College referral commission | Dec–Jul | Largest long-run; MoUs must be signed by Nov |
| Education loan affiliate | Year-round | Materially better rates than retail affiliate |
| YouTube ads and sponsorship | Year-round | Modest |
| Amazon/Flipkart affiliate | Post-exam | Marginal — books ~7–8%, electronics 1–3%. A tip jar, not a plan. |

The compounding asset is the buyer list. Every buyer is resold next cycle at near-zero acquisition
cost. That is where the evergreen funding actually lives — not in the tools.

---

## 12. Metrics

Per tool: sessions, completion rate, gate conversion, WhatsApp opt-in rate, downstream purchase rate.

Every tool logs its input distribution. This is how tool 15 gets chosen by evidence rather than guess.

Kill criterion: a tool below 200 sessions/month at 90 days is not maintained further — it stays live
for its links but earns no more work.

---

## 13. Phasing

- **Phase 0 (week 1)** — KEA data spike and go/no-go. Blocks starter tool 3 (PGCET college predictor) only, nothing else.
- **Phase 1 (weeks 1–2)** — factory framework, deploy pipeline, lead endpoint, tools 1–3 live.
- **Phase 2 (weeks 3–10)** — one tool per week with companion video; national cutoff dataset built in
  the background; college MoU conversations opened.
- **Phase 3 (weeks 11–13)** — tools 16–19 built and indexed before results day.
- **~20 Dec** — CAT results. Predictors already aged and ranking. Counselling funnel live.

---

## 14. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| KEA PDFs unusable or archives pruned | Kills the PGCET college predictor and the programmatic play | Phase 0 gate before any dependent build |
| Head terms unwinnable in year one | Traffic below expectation | Long-tail and programmatic strategy from day one; no head-term budget |
| Thin programmatic pages trigger a penalty | Site-wide | Publish only data-backed pages |
| WhatsApp number banned for non-consented sends | Loses the main follow-up channel | Explicit opt-in, stored consent, honoured opt-out |
| Content review becomes the bottleneck | Weekly cadence slips | Cadence is deliberately one tool/week, not three |
| Predictor inaccuracy destroys trust | Funnel-wide | Self-checks per calc module, source link on every figure, explicit disclaimer |

---

## 15. Open questions

1. **Is `learncrew.org` root hosted on this same Hostinger account?** hPanel shows `txn.learncrew.org`
   and `coder.learncrew.org`, but the root domain was not visible in the list. The subfolder strategy
   requires write access to the root domain's `public_html`. If it is hosted elsewhere, the approach
   holds but the deploy target changes.
2. Does an existing WordPress forms plugin already hold leads that the new table should align with?
3. Who owns the YouTube channel and can publish weekly?
4. Are any college MoUs already in place, or does that start from zero?
5. `coder.learncrew.org`, `lms.indefine.in`, `pulse.indefine.in` show "Domain is not working" in
   hPanel. If those DNS records point at a service no longer controlled, that is a subdomain-takeover
   vector on `*.learncrew.org`. Verify where they resolve; remove records that point nowhere useful.
