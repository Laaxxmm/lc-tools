import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateLead } from './lead.ts';

const base = { email: 'a@b.co', whatsappConsent: false, tool: 't' };

test('accepts a valid email', () => assert.equal(validateLead(base), null));
test('rejects malformed email', () => assert.ok(validateLead({ ...base, email: 'nope' })));
test('honeypot blocks submission', () => assert.ok(validateLead({ ...base, website: 'bot' })));
test('accepts 10-digit phone with separators', () =>
  assert.equal(validateLead({ ...base, phone: '+91 98765 43210' }), null));
test('rejects short phone', () => assert.ok(validateLead({ ...base, phone: '12345' })));
test('empty phone is allowed — phone is optional except on gated PDFs', () =>
  assert.equal(validateLead({ ...base, phone: '' }), null));

// --- WhatsApp-first gate ---------------------------------------------------
import { indianMobile } from './lead.ts';

test('indianMobile accepts what people type on a phone keyboard', () => {
  assert.equal(indianMobile('98450 12345'), '9845012345');
  assert.equal(indianMobile('+91 98450-12345'), '9845012345');
  assert.equal(indianMobile('09845012345'), '9845012345');
  assert.equal(indianMobile('919845012345'), '9845012345');
});

test('indianMobile rejects numbers that cannot be an Indian mobile', () => {
  assert.equal(indianMobile('5845012345'), null);   // mobiles start 6-9
  assert.equal(indianMobile('984501234'), null);    // 9 digits
  assert.equal(indianMobile(''), null);
});

test("phone-need: no email is fine, but the number must be a real mobile", () => {
  const l = { whatsappConsent: true, tool: 't', phone: '9845012345' };
  assert.equal(validateLead(l, 'phone'), null);
  assert.ok(validateLead({ ...l, phone: '12345' }, 'phone'));
  assert.ok(validateLead({ ...l, phone: '' }, 'phone'));
});

test('phone-need: an email typed in must still be valid', () =>
  assert.ok(validateLead({ whatsappConsent: true, tool: 't', phone: '9845012345', email: 'nope' }, 'phone')));

test("email-need is the default, so existing gates keep requiring email", () => {
  assert.ok(validateLead({ whatsappConsent: false, tool: 't', phone: '9845012345' }));
});

test('either-need refuses a lead with no way to reach the student', () => {
  assert.ok(validateLead({ whatsappConsent: false, tool: 't' }, 'either'));
  assert.equal(validateLead({ whatsappConsent: false, tool: 't', phone: '9845012345' }, 'either'), null);
});

test("both-need: what the soft gate asks until the new handler is live", () => {
  const ok = { whatsappConsent: true, tool: 't', phone: '9845012345', email: 'a@b.co' };
  assert.equal(validateLead(ok, 'both'), null);
  assert.ok(validateLead({ ...ok, email: '' }, 'both'), 'old handler would reject a missing email');
  assert.ok(validateLead({ ...ok, phone: '' }, 'both'), 'the gate is a WhatsApp gate either way');
});
