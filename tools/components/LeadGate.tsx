'use client';

import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { submitLead } from '../lib/lead';
import { browserStore, markUnlocked, UNLOCK_EVENT } from '../lib/unlock';
import { useUnlocked } from './SoftGate';

interface Props {
  /** Tool slug. Also the localStorage key, so unlocking is per tool. */
  slug: string;
  mode: 'email' | 'email+phone';
  /** Shown once unlocked. */
  children: ReactNode;
  heading?: string;
  blurb?: string;
  /** Label for the button that reveals the form. Until it is pressed no form is
      shown at all -- a tall form sitting there before anyone asked for the file
      makes the pane taller than the content beside it and leaves a void. */
  trigger?: string;
  /** Submit label. Say what they get, not "show me the rest". */
  submitLabel?: string;
}

export default function LeadGate({ slug, mode, children, heading, blurb, trigger, submitLabel }: Props) {
  const id = useId();
  const [unlockedHere, setUnlocked] = useState(false);
  // A lead given on any tool in the last 30 days opens this one too.
  const unlocked = useUnlocked(slug) || unlockedHere;
  const [asked, setAsked] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (unlocked) return <>{children}</>;

  if (trigger && !asked) {
    return (
      <button className="btn btn-primary btn-block" type="button" onClick={() => setAsked(true)}>
        {trigger}
      </button>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError('');
    setBusy(true);
    const res = await submitLead({
      email: String(f.get('email') ?? '').trim(),
      phone: String(f.get('phone') ?? '').trim(),
      whatsappConsent: f.get('whatsapp') === 'on',
      name: String(f.get('name') ?? '').trim(),
      tool: slug,
      website: String(f.get('website') ?? ''),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not save right now. Please try again.');
      return;
    }
    markUnlocked(browserStore(), Date.now());
    window.dispatchEvent(new Event(UNLOCK_EVENT));
    setUnlocked(true);
  }

  return (
    <form className="gate" onSubmit={onSubmit} noValidate>
      <h3>{heading ?? 'See the full breakdown'}</h3>
      {blurb ? <p className="muted gate-blurb">{blurb}</p> : null}

      <div className="field">
        <label htmlFor={`${id}-name`}>Your name</label>
        <input
          id={`${id}-name`} name="name" type="text" required
          autoComplete="name" placeholder="First and last name"
        />
      </div>

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

      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? 'Saving…' : submitLabel ?? 'Send it to me'}
      </button>

      <p className="muted gate-fine">
        Used to send this result and exam updates. WhatsApp is separate and optional.
        Ask us to delete your details any time.
      </p>
    </form>
  );
}
