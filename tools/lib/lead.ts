// Lead capture posts to WordPress on the same origin (learncrew.org/wp-json),
// so there is no CORS setup and no third-party service holding student data.

import { getAttribution, type Attribution } from './attribution.ts';

export type Stream = 'MBA' | 'MCA' | 'MTECH' | 'CAT' | 'MAT';
export type Segment = '2027_FINAL_YEAR' | '2027_WORKING_PRO_REPEATER' | '2026_ADMITTED_FRESHER';

export interface LeadPayload {
  /** The team works from a leads sheet whose rows all carry a name. */
  name?: string;
  /** Optional on the WhatsApp gate; required where the deliverable is an email. */
  email?: string;
  phone?: string;
  whatsappConsent: boolean;
  tool: string;
  stream?: Stream;
  segment?: Segment;
  payload?: Record<string, unknown>;
  website?: string;             // honeypot — must stay empty
  /** Where the visitor came from. Attached by submitLead, not by callers. */
  attribution?: Attribution;
}

/** Which contact field a form actually depends on. */
export type Need = 'email' | 'phone' | 'either' | 'both';

/**
 * The soft gate asks for WhatsApp only. Safe since wp/lc-leads.php v1.1 went live
 * (verified 20 Oct 2026: a body with neither contact returns lc_no_contact). The
 * old handler rejected any lead without an email, so never ship this as true
 * against a pre-1.1 handler: every lead would fail on "Enter a valid email".
 */
export const PHONE_ONLY_LEADS = true;

export const LEAD_ENDPOINT = '/wp-json/lc/v1/lead';

/**
 * A 10-digit Indian mobile, from whatever the student typed: spaces, dashes, a
 * leading 0, or +91 are all common on a phone keyboard. null if it cannot be one.
 */
export function indianMobile(raw: string | undefined): string | null {
  let d = (raw ?? '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export function validateLead(l: LeadPayload, need: Need = 'email'): string | null {
  if (l.website) return 'Something went wrong. Please try again.';
  const email = (l.email ?? '').trim();
  const phone = (l.phone ?? '').trim();

  // Whatever is supplied must be valid, whichever field the form depends on.
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return 'Enter a valid email address.';
  if (need === 'phone' || need === 'both') {
    if (!indianMobile(phone)) return 'Enter your 10-digit WhatsApp number.';
  } else if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) return 'Enter a valid 10-digit mobile number.';
  }
  if ((need === 'email' || need === 'both') && !email) return 'Enter a valid email address.';
  if (need === 'either' && !email && !phone) return 'Enter your WhatsApp number or email.';
  return null;
}

export async function submitLead(
  l: LeadPayload, need: Need = 'email',
): Promise<{ ok: boolean; error?: string }> {
  const err = validateLead(l, need);
  if (err) return { ok: false, error: err };
  try {
    // Attached here rather than in the form so every caller gets it and no
    // component has to remember. Validation above ran on the caller's fields only.
    const body: LeadPayload = {
      ...l,
      // Normalised so the sheet and WhatsApp get one format, not whatever was typed.
      phone: need === 'phone' || need === 'both' ? (indianMobile(l.phone) ?? l.phone) : l.phone,
      attribution: getAttribution(),
    };
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: 'Could not save right now. Please try again.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}
