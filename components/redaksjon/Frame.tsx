'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { LABELS, titleOf, type Section } from '@/lib/redaksjon/schema';
import { Icon } from './Icon';
import type { EntryState } from './useEntry';
import s from './editor.module.css';

/** «Ny nyhet», «Nytt arrangement»: the crumb of an entry not saved yet. */
export const NEW_LABEL: Record<Section, string> = {
  nyheter: 'Ny nyhet', arrangementer: 'Nytt arrangement', ressurser: 'Ny ressurs', menneskene: 'Ny person',
};

/**
 * The writing view every section shares (mockup A): the top bar with the way back, the status
 * and «Lagre»; the sheet; the panel beside it; on a phone, «Lagre» fixed at the bottom. A saved
 * entry can be deleted from here, after one question that names it.
 */
export function Frame<S extends Section>({ entry, liveHref, sheet, panel, panelLabel, hold }: {
  entry: EntryState<S>;
  /** The entry on the site, when it is there as it is now. */
  liveHref?: string | null;
  sheet: React.ReactNode;
  panel: React.ReactNode;
  panelLabel: string;
  /** Why «Lagre» must wait, e.g. a file still uploading. */
  hold?: string;
}) {
  const { section, issues, status, dirty, busy, saved, error } = entry;
  const ask = useRef<HTMLDialogElement>(null);
  const name = saved ? titleOf(section, saved.fields) || LABELS[section].one : '';

  const saveLabel = hold ?? (issues.length ? `Mangler: ${issues.map((x) => x.text.toLowerCase()).join(', ')}` : undefined);
  const statusEl = (
    <span className={s.status} data-tone={status.tone} role="status" aria-live="polite">
      {status.tone === 'ok' && <Icon name="check" />}
      {status.tone === 'error' && <Icon name="alert" />}
      {dirty && status.tone !== 'busy' && status.tone !== 'error' && saved ? 'Du har endringer som ikke er lagret' : status.text}
    </span>
  );
  const saveBtn = (
    <button type="button" className={`${s.btn} ${s.go}`} onClick={entry.save} disabled={busy || Boolean(hold) || issues.length > 0 || !dirty} title={saveLabel} aria-describedby={issues.length ? 'redaksjon-mangler' : undefined}>
      {status.tone === 'busy' && status.text.startsWith('Lagrer') ? 'Lagrer …' : 'Lagre'}
    </button>
  );

  return (
    <div className={s.write}>
      <div className={s.top}>
        <span className={s.crumb}>
          <Link href={`/redaksjon/${section}`}>{LABELS[section].many}</Link><Icon name="chev" /><b>{saved ? name : NEW_LABEL[section]}</b>
        </span>
        {statusEl}
        {liveHref && <a className={s.btn} href={liveHref} target="_blank" rel="noreferrer"><Icon name="eye" />Se på nettsiden</a>}
        {saveBtn}
      </div>

      <div className={s.sheetWrap}>
        {error && (
          <div className={s.error} role="alert">
            <Icon name="alert" />
            <p>{error.text}</p>
            {error.stale
              ? <button type="button" className={s.btn} onClick={() => window.location.reload()}>Last inn på nytt</button>
              : <button type="button" className={s.btn} onClick={entry.save}>Prøv igjen</button>}
          </div>
        )}
        {sheet}
        {issues.length > 0 && <p id="redaksjon-mangler" className={s.srOnly}>{saveLabel}</p>}
      </div>

      <aside className={s.side} aria-label={panelLabel}>
        {panel}
        {saved && (
          <section className={s.dangerZone}>
            <button type="button" className={`${s.btn} ${s.del}`} onClick={() => ask.current?.showModal()} disabled={busy}>
              <Icon name="trash" />Slett {LABELS[section].one.toLowerCase()}
            </button>
          </section>
        )}
      </aside>

      <div className={s.bar}>{statusEl}{saveBtn}</div>

      <dialog ref={ask} className={s.ask} aria-labelledby="redaksjon-slett">
        <form method="dialog">
          <h2 id="redaksjon-slett">Slette «{name}»?</h2>
          <p>Endringen kommer på nettsiden om 2–3 minutter. Den kan angres fra historikken.</p>
          <div className={s.askActions}>
            <button type="submit" className={`${s.btn} ${s.quiet}`} autoFocus>Avbryt</button>
            <button
              type="button" className={`${s.btn} ${s.del}`}
              onClick={async () => { ask.current?.close(); await entry.remove(); }}
            >
              Slett
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
