'use client';

import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import { submitLead } from '../lib/lead';

interface Props {
  /** Tool slug. Also the localStorage key, so unlocking is per tool. */
  slug: string;
  mode: 'email' | 'email+phone';
  /** Shown once unlocked. */
  children: ReactNode;
  heading?: string;
  blurb?: string;
}

const key = (slug: string) => `lc-unlock:${slug}`;

export default function LeadGate({ slug, mode, children, heading, blurb }: Props) {
  const id = useId();
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Read after mount: the page is prerendered, so localStorage cannot be read
  // during render without a hydration mismatch.
  useEffect(() => {
    if (localStorage.getItem(key(slug)) === '1') setUnlocked(true);
  }, [slug]);

  if (unlocked) return <>{children}</>;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError('');
    setBusy(true);
    const res = await submitLead({
      email: String(f.get('email') ?? '').trim(),
      phone: String(f.get('phone') ?? '').trim(),
      whatsappConsent: f.get('whatsapp') === 'on',
      tool: slug,
      website: String(f.get('website') ?? ''),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not save right now. Please try again.');
      return;
    }
    localStorage.setItem(key(slug), '1');
    setUnlocked(true);
  }

  return (
    <form className="card gate" onSubmit={onSubmit} noValidate>
      <h3>{heading ?? 'See the full breakdown'}</h3>
      <p className="muted">{blurb ?? 'Enter your email and the rest opens straight away.'}</p>

      <div className="field">
        <label htmlFor={`${id}-email`}>Email address</label>
        <input
          id={`${id}-email`} name="email" type="email" required
          autoComplete="email" inputMode="email" placeholder="you@example.com"
          aria-invalid={error ? true : undefined}
        />
      </div>

      {mode === 'email+phone' ? (
        <div className="field">
          <label htmlFor={`${id}-phone`}>Mobile number (optional)</label>
          <input
            id={`${id}-phone`} name="phone" type="tel"
            autoComplete="tel" inputMode="tel" placeholder="98765 43210"
          />
        </div>
      ) : null}

      <label className="consent" htmlFor={`${id}-wa`}>
        <input id={`${id}-wa`} name="whatsapp" type="checkbox" />
        <span>Send me exam updates and my result on WhatsApp</span>
      </label>

      {/* Honeypot. Bots fill it, people never see it. validateLead rejects on it. */}
      <input className="hp" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      {error ? <p className="error" role="alert">{error}</p> : null}

      <button className="btn btn-forest btn-block" type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Show me the rest'}
      </button>

      <p className="muted" style={{ marginTop: 12 }}>
        We store your email to send this result and exam updates. WhatsApp is separate and
        optional. Ask us to delete your details any time and we will.
      </p>
    </form>
  );
}
