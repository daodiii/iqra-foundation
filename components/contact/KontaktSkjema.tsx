'use client';

import { useActionState } from 'react';
import k from '@/components/forside/knapp.module.css';
import { type Field, HONEYPOT, initialState, LIMITS, REQUIRED } from '@/lib/kontakt/skjema';
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
export function KontaktSkjema({ f, email }: { f: FormCopy; email: string }) {
  const [state, action, pending] = useActionState(sendMessage, initialState);
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

  return (
    <form className={styles.kf} data-rise="" data-form="" action={action} aria-busy={pending || undefined}>
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
        <p className={styles.notice} id="skjema-status" role="status" data-status={state.status}>
          {state.status === 'sent' && f.sent}
          {state.status === 'invalid' && f.invalid}
          {state.status === 'failed' && (
            <>
              {f.failed} <a href={`mailto:${email}`}>{email}</a>
            </>
          )}
        </p>
        {!isPlaceholder(f.privacy) && <p className={styles.notice}>{f.privacy}</p>}
      </div>
    </form>
  );
}
