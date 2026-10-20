'use client';

import {
  useCallback, useEffect, useId, useRef, useState,
  type FormEvent, type ReactNode,
} from 'react';
import { PHONE_ONLY_LEADS, submitLead, type Segment, type Stream } from '../lib/lead';
import { browserStore, isUnlocked, markUnlocked, UNLOCK_EVENT } from '../lib/unlock';

/**
 * The value-first gate. The answer is on screen before anything is asked; the
 * full list and the download sit behind one short WhatsApp form, asked once
 * across every tool for 30 days.
 *
 * Render-prop on purpose: the tool decides what is visible and what is a
 * teaser, and wraps its own download in `request`. The gate owns only the form.
 *
 * Unlocks on a SAVED lead, never on a failed one. Unlocking anyway "so the
 * student is not stuck" is how leads go missing without anyone noticing.
 */

export const SEGMENTS: { id: Segment; label: string }[] = [
  { id: '2027_FINAL_YEAR', label: 'Preparing for 2027 — college student' },
  { id: '2027_WORKING_PRO_REPEATER', label: 'Preparing for 2027 — working / repeater' },
  { id: '2026_ADMITTED_FRESHER', label: 'Joining MBA/MCA college now (2026)' },
];

const STREAM_LABEL: Record<Stream, string> = {
  MBA: 'MBA', MCA: 'MCA', MTECH: 'M.Tech', CAT: 'CAT', MAT: 'MAT',
};

/** Unlock state for this browser, kept in step across every gate on the page and across tabs. */
export function useUnlocked(slug: string): boolean {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    // Read after mount: the page is prerendered, so storage cannot be read
    // during render without a hydration mismatch.
    const read = () => setUnlocked(isUnlocked(browserStore(), Date.now(), slug));
    read();
    window.addEventListener(UNLOCK_EVENT, read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(UNLOCK_EVENT, read);
      window.removeEventListener('storage', read);
    };
  }, [slug]);
  return unlocked;
}

interface Api {
  unlocked: boolean;
  /** Run `then` now if unlocked, otherwise after the student unlocks. */
  request: (then?: () => void) => void;
}

interface Props {
  slug: string;
  /** Known from the tool's own state — then the form does not ask. */
  stream?: Stream;
  /** Offered when the tool cannot know the stream. */
  streams?: Stream[];
  /** The tool inputs worth storing beside the lead (rank, category, exam…). */
  inputs?: Record<string, unknown>;
  heading?: string;
  submitLabel?: string;
  children: (api: Api) => ReactNode;
}

export default function SoftGate({
  slug, stream, streams = ['MBA', 'MCA'], inputs,
  heading = 'Unlock the full result',
  submitLabel = 'Unlock & send to my WhatsApp',
  children,
}: Props) {
  const id = useId();
  const unlocked = useUnlocked(slug);
  const dialog = useRef<HTMLDialogElement>(null);
  const pending = useRef<(() => void) | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const request = useCallback((then?: () => void) => {
    if (isUnlocked(browserStore(), Date.now(), slug)) {
      then?.();
      return;
    }
    pending.current = then ?? null;
    setError('');
    dialog.current?.showModal();
  }, [slug]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const segment = String(f.get('segment') ?? '') as Segment;
    if (!segment) {
      setError('Tell us where you are — it decides what we send you.');
      return;
    }
    const name = String(f.get('name') ?? '').trim();
    if (name.length < 2) {
      setError('Enter your name.');
      return;
    }
    setError('');
    setBusy(true);
    const res = await submitLead({
      name,
      email: PHONE_ONLY_LEADS ? undefined : String(f.get('email') ?? '').trim(),
      phone: String(f.get('phone') ?? '').trim(),
      stream: (stream ?? (String(f.get('stream') ?? '') || undefined)) as Stream | undefined,
      segment,
      // The button says it sends to WhatsApp and the line under it says so in
      // plain words: pressing it is the affirmative act, recorded with a timestamp.
      whatsappConsent: true,
      tool: slug,
      payload: inputs,
      website: String(f.get('website') ?? ''),
    }, PHONE_ONLY_LEADS ? 'phone' : 'both');
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not save right now. Please try again.');
      return;
    }
    markUnlocked(browserStore(), Date.now());
    window.dispatchEvent(new Event(UNLOCK_EVENT));
    dialog.current?.close();
    const then = pending.current;
    pending.current = null;
    then?.();
  }

  return (
    <>
      {children({ unlocked, request })}

      <dialog
        ref={dialog}
        className="lead-dialog"
        aria-labelledby={`${id}-title`}
        // A tap on the dimmed backdrop lands on the dialog element itself.
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
      >
        <form className="lead-form" onSubmit={onSubmit} noValidate>
          <div className="lead-form-top">
            <span className="lead-pill">Free · takes 10 seconds</span>
            <button type="button" className="lead-close" aria-label="Close"
              onClick={() => dialog.current?.close()}>&times;</button>
          </div>
          <h2 id={`${id}-title`}>{heading}</h2>
          <p className="muted lead-sub">
            Your full list and the PDF, on screen now and on WhatsApp. One form, every
            Learn Crew tool unlocked for 30 days.
          </p>

          <div className="field">
            <label htmlFor={`${id}-name`}>Your name</label>
            <input id={`${id}-name`} name="name" type="text" required
              autoComplete="name" placeholder="First and last name" />
          </div>

          <div className="field">
            <label htmlFor={`${id}-phone`}>WhatsApp number</label>
            <div className="phone-field">
              <span aria-hidden="true">+91</span>
              <input id={`${id}-phone`} name="phone" type="tel" required
                inputMode="numeric" autoComplete="tel-national"
                placeholder="98765 43210" maxLength={16} />
            </div>
          </div>

          {PHONE_ONLY_LEADS ? null : (
            <div className="field">
              <label htmlFor={`${id}-email`}>Email</label>
              <input id={`${id}-email`} name="email" type="email" required
                autoComplete="email" inputMode="email" placeholder="you@example.com" />
            </div>
          )}

          {stream ? null : (
            <div className="field">
              <label htmlFor={`${id}-stream`}>Aiming for</label>
              <select id={`${id}-stream`} name="stream" defaultValue={streams[0]}>
                {streams.map((s) => <option key={s} value={s}>{STREAM_LABEL[s]}</option>)}
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor={`${id}-segment`}>I am currently…</label>
            <select id={`${id}-segment`} name="segment" required defaultValue="">
              <option value="" disabled>Choose one</option>
              {SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {/* Honeypot. Bots fill it, people never see it. */}
          <input className="hp" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          {error ? <p className="error" role="alert">{error}</p> : null}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Unlocking…' : submitLabel}
          </button>
          <p className="muted gate-fine">
            By continuing you agree to get this result and exam updates from Learn Crew on
            WhatsApp. Reply STOP any time, or ask us to delete your details.
          </p>
        </form>
      </dialog>
    </>
  );
}

/**
 * A few real rows, blurred, under a single unlock button. Only a handful are
 * rendered: blurring three hundred rows is a scroll-jank tax on exactly the
 * low-end phones most students use.
 */
export function Locked({
  hidden, noun, onUnlock, children,
}: { hidden: number; noun: string; onUnlock: () => void; children: ReactNode }) {
  return (
    <div className="locked">
      <div className="locked-teaser" aria-hidden="true" inert>{children}</div>
      <div className="locked-cta">
        <p className="locked-title">+{hidden.toLocaleString('en-IN')} more {noun}</p>
        <p className="muted locked-sub">Free — just your WhatsApp number, once for every tool.</p>
        <button type="button" className="btn btn-primary" onClick={onUnlock}>
          Unlock the full list
        </button>
      </div>
    </div>
  );
}
