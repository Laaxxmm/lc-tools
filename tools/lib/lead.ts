// Lead capture posts to WordPress on the same origin (learncrew.org/wp-json),
// so there is no CORS setup and no third-party service holding student data.

export interface LeadPayload {
  email: string;
  phone?: string;
  whatsappConsent: boolean;
  tool: string;
  payload?: Record<string, unknown>;
  website?: string;             // honeypot — must stay empty
}

export const LEAD_ENDPOINT = '/wp-json/lc/v1/lead';

export function validateLead(l: LeadPayload): string | null {
  if (l.website) return 'Something went wrong. Please try again.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(l.email)) return 'Enter a valid email address.';
  if (l.phone !== undefined && l.phone !== '') {
    const digits = l.phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13) return 'Enter a valid 10-digit mobile number.';
  }
  return null;
}

export async function submitLead(l: LeadPayload): Promise<{ ok: boolean; error?: string }> {
  const err = validateLead(l);
  if (err) return { ok: false, error: err };
  try {
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(l),
    });
    if (!res.ok) return { ok: false, error: 'Could not save right now. Please try again.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}
