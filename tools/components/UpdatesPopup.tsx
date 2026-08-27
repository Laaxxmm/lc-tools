'use client';

import { useEffect, useId, useState } from 'react';
import Icon from './Icon';
import { submitLead, validateLead } from '../lib/lead';

const SEEN = 'lc-updates-seen';

/**
 * WhatsApp exam-update opt-in, asked as its own prompt.
 *
 * As a checkbox inside the download gate it was ignored — it competed with the
 * thing the reader actually came for. Asked separately, after they have already
 * got their answer, it is a fair trade rather than a tax.
 *
 * Shows once. Dismissal and signup are both remembered, so it never nags.
 */
export default function UpdatesPopup({ tool, exam }: { tool: string; exam: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(SEEN)) return;
    // Wait for real engagement: half a screen of scrolling past the tool.
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 1.2) {
        setOpen(true);
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function close() {
    localStorage.setItem(SEEN, '1');
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      whatsappConsent: true,
      tool: `${tool}:updates`,
      website: String(data.get('website') ?? ''),
      payload: { exam },
    };
    const invalid = validateLead(payload);
    if (invalid) { setError(invalid); return; }
    setBusy(true);
    const res = await submitLead(payload);
    setBusy(false);
    if (!res.ok) { setError(res.error ?? 'Could not save right now.'); return; }
    localStorage.setItem(SEEN, '1');
    setDone(true);
  }

  if (!open) return null;

  return (
    <div className="updates-pop" role="dialog" aria-label={`${exam} updates on WhatsApp`}>
      <button className="updates-close" type="button" onClick={close} aria-label="Close">×</button>
      {done ? (
        <>
          <p className="eyebrow"><Icon name="check" size={15} />You are on the list</p>
          <h3>We will message you</h3>
          <p>Only when something about {exam} actually changes. Reply STOP any time.</p>
        </>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <p className="eyebrow"><Icon name="spark" size={15} />{exam} updates</p>
          {/* A concrete promise, not "exam updates". */}
          <h3>WhatsApp me when {exam} dates or forms change</h3>
          <p>Registration opening and closing, admit cards, results. Nothing else.</p>
          <div className="field">
            <label htmlFor={`${id}-n`}>Your name</label>
            <input id={`${id}-n`} name="name" type="text" required placeholder="First and last name" />
          </div>
          <div className="field">
            <label htmlFor={`${id}-e`}>Email address</label>
            <input id={`${id}-e`} name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="field">
            <label htmlFor={`${id}-p`}>WhatsApp number</label>
            <input id={`${id}-p`} name="phone" type="tel" required placeholder="98765 43210" />
          </div>
          <input className="hp" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          {error ? <p className="error" role="alert">{error}</p> : null}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Send me updates'}
          </button>
          <p className="muted gate-fine">
            You are opting in to WhatsApp messages about this exam. Ask us to stop any time.
          </p>
        </form>
      )}
    </div>
  );
}
