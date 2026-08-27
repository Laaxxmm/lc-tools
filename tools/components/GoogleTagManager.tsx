import Script from 'next/script';

// Google Tag Manager container GTM-NWH7PFJ8 — the same container learncrew.org
// runs, so the tools site reports into the same GA4 property (G-S9TPBWTJRS) and
// there is one place to change tagging for both.
//
// The ID is hard-coded on purpose. A container ID is public — it is visible in
// the page source of every site that runs it, exactly like the measurement ID in
// lib/analytics.ts. Gating it behind a repository Variable would mean the tools
// site silently ships untagged whenever that Variable is missing, which is the
// state this site was already in. NEXT_PUBLIC_GTM_ID overrides it for a staging
// container; set it to an empty string to ship with no tagging at all.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? 'GTM-NWH7PFJ8';

/**
 * Loads the container after hydration, so it never competes with the first paint.
 * The container itself fires the GA4 page_view; lib/analytics.ts reuses the
 * window.gtag GTM defines and sends the tool_use / gate_shown / lead_captured
 * events through it, so nothing is double-counted and no second gtag.js loads.
 */
export default function GoogleTagManager() {
  if (!GTM_ID) return null;

  return (
    <>
      <Script id="gtm-container" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
