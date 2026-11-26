'use client';

import card from '@/components/site/page.module.css';
import { Icon } from './Icon';
import s from './editor.module.css';

/** What the panel's pieces share across sections: a labelled field, the checklist, the card. */

/** A field in the panel: its label, the input, and a line of help under it. */
export function Field({ id, label, hint, optional, children }: {
  id: string; label: string; hint?: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={s.f}>
      <label htmlFor={id}>{label}{optional && <span className={s.opt}> (valgfritt)</span>}</label>
      {children}
      {hint && <span className={s.hint}>{hint}</span>}
    </div>
  );
}

/** «Sjekkliste»: each thing the entry needs, ticked when it is there. */
export function Checklist({ items }: { items: [string, boolean][] }) {
  return (
    <section className={s.ready}>
      <h3>Sjekkliste</h3>
      <ul>
        {items.map(([text, done]) => (
          <li key={text} className={done ? undefined : s.no}><Icon name={done ? 'check' : 'clock'} />{text}</li>
        ))}
      </ul>
    </section>
  );
}

/** The entry as the site will show it, in the site's own card and the site's own styles. */
export function Preview({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <div className={s.prevHead}><h3>{heading}</h3></div>
      <ul className={`${card.list} ${s.card}`}>
        <li className={card.item}>{children}</li>
      </ul>
    </section>
  );
}

export { card };
