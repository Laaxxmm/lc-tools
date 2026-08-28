import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, isTagged, merge, type Attribution } from './attribution.ts';

const NOW = '2026-08-28T10:00:00.000Z';

test('a gclid is a Google ad click', () =>
  assert.equal(classify({ gclid: 'abc' }), 'google-ads'));

test('gbraid and wbraid count as ad clicks too', () => {
  assert.equal(classify({ gbraid: 'x' }), 'google-ads');
  assert.equal(classify({ wbraid: 'y' }), 'google-ads');
});

test('a click id beats a contradictory utm_medium', () =>
  assert.equal(classify({ gclid: 'abc', utmMedium: 'organic' }), 'google-ads'));

test('utm_medium cpc without a click id is other paid', () =>
  assert.equal(classify({ utmMedium: 'cpc', utmSource: 'meta' }), 'paid-other'));

test('medium match is case insensitive', () =>
  assert.equal(classify({ utmMedium: 'CPC' }), 'paid-other'));

test('a tagged link that is not paid keeps its source', () =>
  assert.equal(classify({ utmSource: 'newsletter' }), 'campaign-newsletter'));

test('google referrer with no tagging is organic, not ads', () =>
  assert.equal(classify({ firstReferrer: 'https://www.google.com/' }), 'google-organic'));

test('other search engines are search-organic', () =>
  assert.equal(classify({ firstReferrer: 'https://duckduckgo.com/' }), 'search-organic'));

test('social referrers are social-organic', () =>
  assert.equal(classify({ firstReferrer: 'https://l.instagram.com/' }), 'social-organic'));

test('an unknown referrer is a referral', () =>
  assert.equal(classify({ firstReferrer: 'https://somecollege.ac.in/' }), 'referral'));

test('no referrer and no tags is direct', () => assert.equal(classify({}), 'direct'));

test('isTagged only fires on click ids or a utm source', () => {
  assert.equal(isTagged({ gclid: 'a' }), true);
  assert.equal(isTagged({ utmSource: 's' }), true);
  assert.equal(isTagged({ utmMedium: 'cpc' }), false);
  assert.equal(isTagged({}), false);
});

test('first touch is recorded once and never overwritten', () => {
  const first = merge({}, { firstReferrer: 'https://www.google.com/', landingPage: '/tools/' }, NOW);
  const later = merge(first, { firstReferrer: 'https://example.com/', landingPage: '/tools/x/' }, '2026-09-01T00:00:00.000Z');
  assert.equal(later.firstSeen, NOW);
  assert.equal(later.firstReferrer, 'https://www.google.com/');
});

test('an untagged internal navigation cannot wipe a stored gclid', () => {
  const paid = merge({}, { gclid: 'KEEP', landingPage: '/tools/' }, NOW);
  const nav = merge(paid, { firstReferrer: '', landingPage: '/tools/cgpa/' }, NOW);
  assert.equal(nav.gclid, 'KEEP');
  assert.equal(nav.channel, 'google-ads');
});

test('a newer tagged visit replaces last touch', () => {
  const a = merge({}, { utmSource: 'newsletter' }, NOW);
  const b = merge(a, { gclid: 'NEW' }, NOW);
  assert.equal(b.gclid, 'NEW');
  assert.equal(b.channel, 'google-ads');
});

test('a later tagged visit from another source stops reading as an ad click', () => {
  const ad = merge({}, { gclid: 'ABC', landingPage: '/tools/' }, NOW);
  assert.equal(ad.channel, 'google-ads');

  // Same browser, days later, arriving from the newsletter instead.
  const mail = merge(ad, { utmSource: 'newsletter', utmMedium: 'email' }, NOW);
  assert.equal(mail.channel, 'campaign-newsletter');
  assert.equal(mail.gclid, undefined);

  // And an untagged organic visit after that keeps the newsletter, not the ad.
  const organic = merge(mail, { firstReferrer: 'https://www.bing.com/' }, NOW);
  assert.equal(organic.channel, 'campaign-newsletter');
});

test('merge always leaves a usable channel', () => {
  const out: Attribution = merge({}, {}, NOW);
  assert.equal(out.channel, 'direct');
});
