/*!
 * Learn Crew — WhatsApp soft gate for the WordPress PGCET Rank & College Predictor
 * (learncrew.org/pgcet-rank-college-predictor/).
 *
 * INSTALL (two steps, nothing else on the page changes):
 *   1. Upload this file to  wp-content/uploads/lc/lc-lead-gate.js
 *   2. On that ONE page, add a Custom HTML block (or WPCode footer snippet scoped
 *      to the page) containing exactly:
 *        <script src="/wp-content/uploads/lc/lc-lead-gate.js" defer></script>
 *
 * The styles live inside this file on purpose: a builder Save has been seen to
 * drop CSS pasted into the page, and a gate without its styles is a gate that
 * blurs nothing and hides its own form.
 *
 * What it does, against the page's existing markup (#results, tbody#tbody,
 * #csv, #pdf, #sumRank, #course, #marks, #cat, #seat):
 *   - The predicted rank and the first 3 colleges stay fully visible.
 *   - Rows 4+ are blurred under one "Unlock" card.
 *   - Download PDF / Download Excel open the form first, then run the original
 *     download automatically once the lead is saved.
 *   - After unlock: a rank-led next step under the table.
 *
 * It posts to the SAME endpoint as the /tools/ site (/wp-json/lc/v1/lead), so
 * every lead lands in the same table, sheet and admin screen, and it shares the
 * same 30-day unlock: a student who unlocked a tool is not asked again here.
 *
 * It unlocks ONLY when the lead is saved. Unlocking on a failed request "so the
 * student is not stuck" is how leads go missing without anyone noticing.
 */
(function () {
  'use strict';

  // Keep in step with tools/lib/lead.ts PHONE_ONLY_LEADS. While false the form
  // also asks for email, because the old WordPress handler rejects a lead
  // without one. Flip both once wp/lc-leads.php v1.1 is uploaded.
  var PHONE_ONLY = false;
  // Flip once learncrew.org/starter-kit/ is published.
  var STARTER_KIT_LIVE = false;

  var KEY = 'lc-lead:v1';
  var TTL = 30 * 24 * 60 * 60 * 1000;
  var EVENT = 'lc-unlock';
  var ENDPOINT = '/wp-json/lc/v1/lead';
  var TOOL = 'wp-pgcet-rank-predictor';
  var FREE_ROWS = 3;
  var KIT = STARTER_KIT_LIVE
    ? { href: 'https://learncrew.org/starter-kit/', label: 'Get the ₹199 starter kit' }
    : { href: 'https://learncrew.org/contact/', label: 'Ask about the ₹199 starter kit' };
  var MAT_HREF = 'https://learncrew.org/mat-online-coaching-600plus/';

  var SEGMENTS = [
    ['2027_FINAL_YEAR', 'Preparing for 2027 — college student'],
    ['2027_WORKING_PRO_REPEATER', 'Preparing for 2027 — working / repeater'],
    ['2026_ADMITTED_FRESHER', 'Joining MBA/MCA college now (2026)']
  ];

  // ── storage, guarded: some in-app browsers throw on localStorage ──────────
  function store() { try { return window.localStorage; } catch (e) { return null; } }
  function isUnlocked() {
    var s = store(); if (!s) return false;
    try {
      var v = JSON.parse(s.getItem(KEY) || 'null');
      var at = v && Number(v.at), now = Date.now();
      return isFinite(at) && at <= now && now - at < TTL;
    } catch (e) { return false; }
  }
  function markUnlocked() {
    var s = store();
    try { if (s) s.setItem(KEY, JSON.stringify({ at: Date.now() })); } catch (e) { /* blocked */ }
  }

  function mobile(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    else if (d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : null;
  }
  function validEmail(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e); }

  // The page's own attribution helper uses snake_case; the endpoint wants the
  // camelCase keys the tools site sends. Undefined keys drop out of the JSON.
  function attribution() {
    try {
      var a = typeof window.lcAttribution === 'function' ? window.lcAttribution() : null;
      if (!a) return undefined;
      return {
        channel: a.channel, gclid: a.gclid, gbraid: a.gbraid, wbraid: a.wbraid,
        utmSource: a.utm_source, utmMedium: a.utm_medium, utmCampaign: a.utm_campaign,
        utmTerm: a.utm_term, firstSeen: a.first_seen, firstReferrer: a.first_referrer,
        landingPage: a.last_landing || a.first_landing
      };
    } catch (e) { return undefined; }
  }

  function $(id) { return document.getElementById(id); }
  function val(id) { var el = $(id); return el ? el.value : ''; }
  function predictedRank() {
    var t = ($('sumRank') || {}).textContent || val('rank');
    var n = parseInt(String(t).replace(/[^\d]/g, ''), 10);
    return isFinite(n) ? n : null;
  }
  function course() {
    var c = String(val('course') || '').toUpperCase();
    return c === 'MBA' || c === 'MCA' || c === 'MTECH' ? c : undefined;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ── styles ───────────────────────────────────────────────────────────────
  var CSS = [
    '.lcg-blur{filter:blur(5px);pointer-events:none;user-select:none}',
    '.lcg-card{position:relative;z-index:2;margin:-150px auto 18px;max-width:380px;width:calc(100% - 24px);',
    ' background:#fff;border:1.5px solid #E8A33D;border-radius:18px;padding:20px 18px 16px;text-align:center;',
    ' box-shadow:0 10px 30px -12px rgba(14,59,46,.25)}',
    '.lcg-card p{margin:0}.lcg-title{font-weight:800;font-size:18px;color:#0E3B2E;margin-bottom:4px!important}',
    '.lcg-sub{font-size:13.5px;color:#4A5A52;margin-bottom:14px!important}',
    '.lcg-btn{display:inline-flex;align-items:center;justify-content:center;width:100%;border:0;cursor:pointer;',
    ' background:#E8A33D;color:#1A1A1A;font:inherit;font-weight:700;font-size:15px;padding:13px 18px;border-radius:999px;',
    ' text-decoration:none;box-shadow:0 8px 20px -8px rgba(232,163,61,.7)}',
    '.lcg-btn-ghost{background:transparent;color:#FAF7F2;border:1.5px solid rgba(250,247,242,.5);box-shadow:none}',
    '.lcg-dialog{border:0;padding:0;border-radius:18px;width:min(440px,calc(100vw - 24px));max-height:calc(100dvh - 24px);',
    ' overflow-y:auto;background:#fff;color:#1A1A1A;box-shadow:0 30px 60px -20px rgba(10,44,34,.5)}',
    '.lcg-dialog::backdrop{background:rgba(10,44,34,.62)}',
    'html:has(.lcg-dialog[open]){overflow:hidden}',
    '.lcg-form{padding:22px;font-size:15px}',
    '.lcg-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}',
    '.lcg-pill{font-size:12px;font-weight:700;color:#0E3B2E;background:#FBEBD2;padding:4px 10px;border-radius:999px}',
    '.lcg-close{width:44px;height:44px;margin:-10px -10px -10px 0;border:0;background:none;font-size:28px;line-height:1;color:#4A5A52;cursor:pointer}',
    '.lcg-form h2{font-size:21px;margin:0 0 6px;color:#1A1A1A}',
    '.lcg-lead{font-size:13.5px;color:#4A5A52;margin:0 0 16px}',
    '.lcg-field{margin-bottom:12px}.lcg-field label{display:block;font-size:13.5px;font-weight:700;color:#4A5A52;margin-bottom:6px}',
    '.lcg-field input,.lcg-field select{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:12px 14px;',
    ' border:1.5px solid #E3DDD2;border-radius:12px;background:#fff;color:#1A1A1A}',
    '.lcg-phone{display:flex;border:1.5px solid #E3DDD2;border-radius:12px;overflow:hidden}',
    '.lcg-phone span{display:flex;align-items:center;padding:0 12px;background:#FAF7F2;color:#4A5A52;font-weight:700;border-right:1.5px solid #E3DDD2}',
    '.lcg-phone input{border:0;border-radius:0}',
    '.lcg-err{color:#B42318;font-size:14px;margin:0 0 12px}',
    '.lcg-fine{font-size:12px;line-height:1.5;color:#4A5A52;margin:10px 0 0}',
    '.lcg-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}',
    '.lcg-upsell{margin:18px 0 6px;padding:18px 20px;border-radius:18px;background:#0E3B2E;color:rgba(250,247,242,.8)}',
    '.lcg-upsell p{margin:0}.lcg-up-title{color:#FAF7F2;font-weight:800;font-size:17px;margin-bottom:6px!important}',
    '.lcg-up-body{font-size:14px;margin-bottom:14px!important}',
    '.lcg-up-actions{display:flex;flex-wrap:wrap;gap:10px}.lcg-up-actions .lcg-btn{width:auto;flex:1 1 220px}',
    '@media (max-width:639px){.lcg-dialog{margin:12px auto auto}.lcg-form{padding:18px}}'
  ].join('');

  function injectStyles() {
    if ($('lcg-styles')) return;
    var s = document.createElement('style');
    s.id = 'lcg-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ── the form ─────────────────────────────────────────────────────────────
  var dialog = null, pending = null;

  function buildDialog() {
    if (dialog) return dialog;
    var opts = SEGMENTS.map(function (s) { return '<option value="' + s[0] + '">' + esc(s[1]) + '</option>'; }).join('');
    dialog = document.createElement('dialog');
    dialog.className = 'lcg-dialog';
    dialog.setAttribute('aria-labelledby', 'lcg-title');
    dialog.innerHTML =
      '<form class="lcg-form" novalidate>' +
        '<div class="lcg-top"><span class="lcg-pill">Free · takes 10 seconds</span>' +
        '<button type="button" class="lcg-close" aria-label="Close">&times;</button></div>' +
        '<h2 id="lcg-title">Unlock your full college list</h2>' +
        '<p class="lcg-lead">Every matching college plus the PDF and Excel, on screen now and on WhatsApp. ' +
        'One form, every Learn Crew tool unlocked for 30 days.</p>' +
        '<div class="lcg-field"><label for="lcg-name">Your name</label>' +
        '<input id="lcg-name" name="name" type="text" autocomplete="name" placeholder="First and last name"></div>' +
        '<div class="lcg-field"><label for="lcg-phone">WhatsApp number</label>' +
        '<div class="lcg-phone"><span aria-hidden="true">+91</span>' +
        '<input id="lcg-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="98765 43210" maxlength="16"></div></div>' +
        (PHONE_ONLY ? '' :
        '<div class="lcg-field"><label for="lcg-email">Email</label>' +
        '<input id="lcg-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"></div>') +
        '<div class="lcg-field"><label for="lcg-seg">I am currently…</label>' +
        '<select id="lcg-seg" name="segment"><option value="" disabled selected>Choose one</option>' + opts + '</select></div>' +
        '<input class="lcg-hp" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<p class="lcg-err" role="alert" hidden></p>' +
        '<button type="submit" class="lcg-btn">Unlock &amp; send to my WhatsApp</button>' +
        '<p class="lcg-fine">By continuing you agree to get this result and exam updates from Learn Crew on WhatsApp. ' +
        'Reply STOP any time, or ask us to delete your details.</p>' +
      '</form>';
    document.body.appendChild(dialog);

    dialog.querySelector('.lcg-close').addEventListener('click', function () { dialog.close(); });
    // A tap on the dimmed backdrop lands on the dialog element itself.
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.querySelector('form').addEventListener('submit', onSubmit);
    return dialog;
  }

  function showError(msg) {
    var p = dialog.querySelector('.lcg-err');
    p.textContent = msg; p.hidden = !msg;
  }

  function request(then) {
    if (isUnlocked()) { if (then) then(); return; }
    buildDialog();
    pending = then || null;
    showError('');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');      // very old WebViews: still usable
  }

  function onSubmit(e) {
    e.preventDefault();
    var f = e.currentTarget;
    var name = f.name.value.trim();
    var phone = mobile(f.phone.value);
    var email = f.email ? f.email.value.trim() : '';
    var segment = f.segment.value;

    if (name.length < 2) return showError('Enter your name.');
    if (!phone) return showError('Enter your 10-digit WhatsApp number.');
    if (!PHONE_ONLY && !validEmail(email)) return showError('Enter a valid email address.');
    if (PHONE_ONLY && email && !validEmail(email)) return showError('Enter a valid email address.');
    if (!segment) return showError('Tell us where you are — it decides what we send you.');
    if (f.website.value) return showError('Something went wrong. Please try again.');

    var btn = f.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Unlocking…';
    showError('');

    var body = {
      name: name, phone: phone, email: email || undefined,
      whatsappConsent: true, tool: TOOL, stream: course(), segment: segment,
      website: '',
      payload: {
        marks: val('marks') || null, rank: predictedRank(),
        course: val('course') || null, category: val('cat') || null, seat: val('seat') || null
      },
      attribution: attribution()
    };

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (res.ok) return null;
      return res.json().then(function (j) { return (j && j.message) || 'Could not save right now. Please try again.'; },
                            function () { return 'Could not save right now. Please try again.'; });
    }).then(function (err) {
      btn.disabled = false; btn.innerHTML = 'Unlock &amp; send to my WhatsApp';
      if (err) return showError(err);
      markUnlocked();
      try { window.dispatchEvent(new Event(EVENT)); } catch (x) { /* very old browsers */ }
      dialog.close();
      apply();
      var then = pending; pending = null;
      if (then) then();
    }, function () {
      btn.disabled = false; btn.innerHTML = 'Unlock &amp; send to my WhatsApp';
      showError('Network error. Please try again.');
    });
  }

  // ── blur + card + upsell, re-applied whenever the page redraws results ───
  function apply() {
    var tbody = $('tbody'), results = $('results');
    if (!tbody || !results) return;
    var rows = tbody.rows, open = isUnlocked(), i;
    for (i = 0; i < rows.length; i++) {
      var blur = !open && i >= FREE_ROWS;
      if (blur !== rows[i].classList.contains('lcg-blur')) rows[i].classList.toggle('lcg-blur', blur);
      if (blur) rows[i].setAttribute('aria-hidden', 'true'); else rows[i].removeAttribute('aria-hidden');
    }

    var scroller = tbody.closest('.scroll') || tbody.closest('table');
    var card = $('lcg-card');
    if (!open && rows.length > FREE_ROWS) {
      if (!card) {
        card = document.createElement('div');
        card.id = 'lcg-card'; card.className = 'lcg-card';
        card.innerHTML = '<p class="lcg-title"></p>' +
          '<p class="lcg-sub">Free — just your WhatsApp number, once for every tool.</p>' +
          '<button type="button" class="lcg-btn">Unlock the full list</button>';
        card.querySelector('button').addEventListener('click', function () { request(); });
        scroller.parentNode.insertBefore(card, scroller.nextSibling);
      }
      var title = '+' + (rows.length - FREE_ROWS) + ' more colleges, plus the PDF & Excel';
      if (card.firstChild.textContent !== title) card.firstChild.textContent = title;
    } else if (card) {
      card.parentNode.removeChild(card);
    }

    var up = $('lcg-upsell');
    var c = course(), rank = predictedRank();
    if (open && rows.length && c && c !== 'MTECH' && rank) {
      var behind = rank > 3500, mba = c === 'MBA';
      var html = behind
        ? '<p class="lcg-up-title">Not happy with these colleges?</p><p class="lcg-up-body">' +
          (mba ? 'There is still time for a better seat: MAT in December this cycle, or a calm run at PGCET 2027 with our Mon · Wed · Fri 6:30 PM batch.'
               : 'A calm run at PGCET 2027 moves ranks more than most students expect — Mon · Wed · Fri 6:30 PM, rolling admissions.') +
          '</p><div class="lcg-up-actions">' +
          (mba ? '<a class="lcg-btn" href="' + MAT_HREF + '">Explore the MAT December batch</a>' : '') +
          '<a class="lcg-btn' + (mba ? ' lcg-btn-ghost' : '') + '" href="' + KIT.href + '">' + esc(KIT.label) + '</a></div>'
        : '<p class="lcg-up-title">Preparing for PGCET 2027?</p><p class="lcg-up-body">Benchmark where you stand: two full-length ' +
          'diagnostic mocks, three years of solved PYQs and a one-to-one mentor call, for ₹199.</p>' +
          '<div class="lcg-up-actions"><a class="lcg-btn" href="' + KIT.href + '">' + esc(KIT.label) + '</a></div>';
      if (!up) {
        up = document.createElement('aside');
        up.id = 'lcg-upsell'; up.className = 'lcg-upsell'; up.setAttribute('aria-label', 'Next step');
        scroller.parentNode.insertBefore(up, scroller.nextSibling);
      }
      if (up.getAttribute('data-k') !== c + behind) { up.innerHTML = html; up.setAttribute('data-k', c + behind); }
    } else if (up) {
      up.parentNode.removeChild(up);
    }
  }

  // ── downloads: ask first, then run the page's own handler ────────────────
  var bypass = false;
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('#csv, #pdf') : null;
    if (!btn || bypass || isUnlocked()) return;
    // Capture phase on document runs before the button's own listener.
    e.preventDefault();
    e.stopImmediatePropagation();
    request(function () { bypass = true; try { btn.click(); } finally { bypass = false; } });
  }, true);

  function start() {
    injectStyles();
    apply();
    var results = $('results');
    if (results && 'MutationObserver' in window) {
      // The page redraws the rows on every Predict. apply() is idempotent: our
      // own inserts trigger one more pass that changes nothing, then it stops.
      new MutationObserver(apply).observe(results, { childList: true, subtree: true });
    }
    window.addEventListener(EVENT, apply);
    window.addEventListener('storage', apply);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
