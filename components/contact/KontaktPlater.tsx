import type { ReactNode } from 'react';
import { Lines } from '@/components/forside/Lines';
import k from '@/components/forside/knapp.module.css';
import { Plate, Plater } from '@/components/plater/Plater';
import { after } from '@/components/plater/after';
import p from '@/components/plater/plater.module.css';
import { site } from '@/content/site.no';
import styles from './kontakt-plater.module.css';

const t = site.pages.contact;
const c = site.contact;

/** One way to reach the foundation, as a line between rules: its label, then its value set large. A link when there is somewhere to go. */
function Way({ way, href, label, i, children }: { way: string; href?: string; label: string; i: number; children: ReactNode }) {
  const body = (
    <>
      <span className={styles.lb} id={`kontakt-${way}`}>
        {label}
      </span>
      <span className={styles.vl}>{children}</span>
    </>
  );
  return (
    <li className={styles.row} data-rise="" style={after(i * 0.1)}>
      {href ? (
        <a className={styles.w} href={href} data-way={way}>
          {body}
        </a>
      ) : (
        <div className={styles.w} data-way={way}>
          {body}
        </div>
      )}
    </li>
  );
}

/** One drawn field: its name and a hairline under it. */
function Field({ label, full }: { label: string; full?: boolean }) {
  return (
    <span className={`${styles.field} ${full ? styles.full : ''}`}>
      {label}
      <span className={`${styles.box} ${full ? styles.area : ''}`} />
    </span>
  );
}

/**
 * Kontakt as «Platene» (mock 42, the owner's pick of 2026-11-20): the title and the page's text on
 * white; the three ways to reach the foundation on navy as lines between rules, the e-mail at poster
 * size; the form under «Kontakt oss» on white.
 *
 * The ways have no heading of their own in the content, so their plate is named by their three labels.
 * The form is not wired, so it is drawn: hairline fields and Send as spans, with no control to type
 * into, hidden from a reader; the notice beside Send says so and is read.
 */
export function KontaktPlater() {
  const f = t.form;
  return (
    <Plater>
      <Plate tone="white" label="kontakt-tittel">
        <Lines as="h1" id="kontakt-tittel" className={p.h1} text={t.title} />
        <p className={p.intro} data-rise="">
          {t.description}
        </p>
      </Plate>

      <Plate tone="navy" label="kontakt-epost kontakt-telefon kontakt-adresse" data-part="ways">
        <ul className={styles.ways}>
          <Way way="epost" href={`mailto:${c.email}`} label={t.emailLabel} i={0}>
            {c.email}
          </Way>
          <Way way="telefon" href={`tel:${c.phone.replace(/\s/g, '')}`} label={t.phoneLabel} i={1}>
            {c.phone}
          </Way>
          <Way way="adresse" label={t.addressLabel} i={2}>
            {c.address.join(', ')}
            <small>
              {t.orgnrLabel} {c.orgnr}
            </small>
          </Way>
        </ul>
      </Plate>

      <Plate tone="white" label="kontakt-skjema" data-part="form">
        <Lines as="h2" id="kontakt-skjema" className={p.h} text={f.title} />
        {/* The form is drawn, not wired: spans, not controls, hidden from a reader; the notice beside Send is read. */}
        <div className={styles.kf} data-rise="">
          <div className={styles.fields} data-form="" aria-hidden="true">
            <Field label={f.name} />
            <Field label={f.email} />
            <Field label={f.mobile} />
            <Field label={f.orgnr} />
            <Field label={f.message} full />
          </div>
          <div className={styles.send}>
            <span className={`${k.k} ${k.fill} ${styles.k}`} data-send="" data-knapp="fill" aria-hidden="true">
              <span className={k.label}>{f.send}</span>
              <span className={k.arrow}>
                <i>→</i>
                <i>→</i>
              </span>
            </span>
            <p className={styles.notice}>{f.notice}</p>
          </div>
        </div>
      </Plate>
    </Plater>
  );
}
