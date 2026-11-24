'use client';

import { useActionState } from 'react';
import k from '@/components/forside/knapp.module.css';
import { type Contact, FIELDS, type Field, type FormState, HONEYPOT, initialState, LIMITS, REQUIRED, TIMER } from '@/lib/kontakt/skjema';
import { isPlaceholder } from '@/lib/placeholder';
import { sendMessage } from './send-action';
import styles from './kontakt-plater.module.css';

export type FormCopy = {
  name: string;
  email: string;
  mobile: string;
  orgnr: string;
  message: string;
  send: string;
  sent: string;
  invalid: string;
  failed: string;
  privacy: string;
};

const INPUT: Record<Exclude<Field, 'melding'>, { type: string; autoComplete: string; inputMode?: 'numeric' }> = {
  navn: { type: 'text', autoComplete: 'name' },
  epost: { type: 'email', autoComplete: 'email' },
  mobil: { type: 'tel', autoComplete: 'tel' },
  orgnr: { type: 'text', autoComplete: 'off', inputMode: 'numeric' },
};

/**
 * The contact form: the drawn hairlines of «Platene», now real controls. Each field's name is its
 * label; the line beside Send reports what happened and is read out (role=status). After a failed
 * or refused send the writer's text is put back, so nothing typed is lost. A failure always names
 * the e-mail address as the way round, and nothing here ever reports a send that did not happen.
 */
/**
 * The server action, guarded: if the call itself breaks (a dropped connection, an action ID gone with
 * a new deploy, a function cut off) the form reports a failure with the text kept, instead of falling
 * to the error page and losing what was typed. The cost: without JavaScript the form does not submit.
 * It also tells the server how long the page has been open, so a form sent in a second is turned away.
 */
async function send(prev: FormState, fd: FormData): Promise<FormState> {
  fd.set(TIMER, String(Math.round(performance.now())));
  try {
    return await sendMessage(prev, fd);
  } catch {
    const values = Object.fromEntries(FIELDS.map((f) => [f, String(fd.get(f) ?? '')])) as Contact;
    return { status: 'failed', values };
  }
}

export function KontaktSkjema({ f, email }: { f: FormCopy; email: string }) {
  const [state, action, pending] = useActionState(send, initialState);
  const values = state.status === 'invalid' || state.status === 'failed' ? state.values : undefined;
  const invalid = state.status === 'invalid' ? state.invalid : [];
  const label: Record<Field, string> = { navn: f.name, epost: f.email, mobil: f.mobile, orgnr: f.orgnr, melding: f.message };

  const control = (name: Field) => {
    const common = {
      name,
      id: `skjema-${name}`,
      required: REQUIRED.includes(name),
      maxLength: LIMITS[name],
      defaultValue: values?.[name] ?? '',
      'aria-invalid': invalid.includes(name) || undefined,
      'aria-describedby': invalid.includes(name) ? 'skjema-status' : undefined,
    };
    return name === 'melding' ? (
      <textarea {...common} className={`${styles.box} ${styles.area}`} rows={3} />
    ) : (
      <input {...common} {...INPUT[name]} className={styles.box} />
    );
  };

  const sent = state.status === 'sent';

  return (
    <form
      className={styles.kf}
      data-rise=""
      data-form=""
      data-sent={sent || undefined}
      action={action}
      aria-busy={pending || undefined}
    >
      {/* the fields and the confirmation share one cell, so the plate keeps its height when one gives way to the other */}
      <div className={styles.stage}>
        <div className={styles.body} inert={sent || undefined}>
          <div className={styles.fields}>
            {(['navn', 'epost', 'mobil', 'orgnr'] as const).map((n) => (
              <label key={n} className={styles.field} htmlFor={`skjema-${n}`}>
                {label[n]}
                {control(n)}
              </label>
            ))}
            <label className={`${styles.field} ${styles.full}`} htmlFor="skjema-melding">
              {label.melding}
              {control('melding')}
            </label>
          </div>
          {/* a person never sees this; a bot fills it in */}
          <div className={styles.hp} aria-hidden="true">
            <label>
              Nettsted
              <input name={HONEYPOT} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </label>
          </div>
          <div className={styles.send}>
            <button type="submit" className={`${k.k} ${k.fill} ${styles.k}`} data-send="" data-knapp="fill" disabled={pending}>
              <span className={k.label}>{f.send}</span>
              <span className={k.arrow} aria-hidden="true">
                <i>→</i>
                <i>→</i>
              </span>
            </button>
            {!isPlaceholder(f.privacy) && <p className={styles.notice}>{f.privacy}</p>}
          </div>
        </div>
        {/* what the eye gets once the server confirms: a mark drawn in the accent, and the sent line large (the status line below carries it for a reader) */}
        {sent && (
          <div className={styles.done} data-done="" aria-hidden="true">
            <svg className={styles.mark} viewBox="0 0 64 64" width="64" height="64">
              <circle cx="32" cy="32" r="29" pathLength={1} transform="rotate(-90 32 32)" />
              <path d="M19 33.5 28 42.5 45.5 23" pathLength={1} />
            </svg>
            <p className={styles.doneText}>{f.sent}</p>
          </div>
        )}
      </div>
      <p className={`${styles.notice} ${sent ? styles.sr : ''}`} id="skjema-status" role="status" data-status={state.status}>
        {sent && f.sent}
        {state.status === 'invalid' && f.invalid}
        {state.status === 'failed' && (
          <>
            {f.failed} <a href={`mailto:${email}`}>{email}</a>
          </>
        )}
      </p>
    </form>
  );
}
