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
