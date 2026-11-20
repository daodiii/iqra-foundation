'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Lines } from '@/components/forside/Lines';
import k from '@/components/forside/knapp.module.css';
import { site } from '@/content/site.no';
import styles from './ikonene.module.css';

/**
 * Kontakt as «Ikonene» (mock 26, the owner's pick of 2026-11-20): the screen split. On the left the
 * three ways to reach the foundation fill the height as three colour bands — the e-mail on burgundy,
 * the number on teal, the post box on navy — each with its own line drawing, drawn in when the bands
 * are reached; on the right the form, with the page's heading «Kontakt oss» on it.
 *
 * The form is not wired, so it is drawn: the mock's hairline fields and Send as spans, with no
 * control to type into, hidden from a reader; the notice beside Send says so and is read.
 */

const t = site.pages.contact;
const c = site.contact;

/** Once the element is on screen (by the threshold), true for good. */
function useIn(ref: RefObject<HTMLElement | null>, threshold: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  return on;
}

/** A stroke's delay in the drawing-in. */
const d = (s: string) => ({ '--d': s }) as CSSProperties;

const MAIL = (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <rect pathLength={1} x="6" y="14" width="52" height="36" rx="3" />
    <path pathLength={1} d="M7 16l25 20 25-20" style={d('.4s')} />
  </svg>
);

const TEL = (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <path
      pathLength={1}
      d="M22 8c-3 0-9 4-9 9 0 17 17 39 34 39 5 0 9-6 9-9l-9-7c-2-1-4 0-5 1l-3 3c-6-3-12-9-15-15l3-3c1-1 2-3 1-5z"
      style={d('.15s')}
    />
  </svg>
);

const POST = (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <path pathLength={1} d="M14 56V28a16 16 0 0 1 32 0v28z" style={d('.3s')} />
    <path pathLength={1} d="M46 30h8v26h-8" style={d('.6s')} />
    <path pathLength={1} d="M22 30h16" style={d('.8s')} />
    <path pathLength={1} d="M30 56v6" style={d('.9s')} />
  </svg>
);

/** One band: the drawing, the label, the value. A link when there is somewhere to go. */
function Way({ way, href, label, icon, children }: { way: string; href?: string; label: string; icon: ReactNode; children: ReactNode }) {
  const body = (
    <>
      {icon}
      <span className={styles.txt}>
        <span className={styles.lb}>{label}</span>
        <span className={styles.vl}>{children}</span>
      </span>
    </>
  );
  return href ? (
    <a className={styles.w} href={href} data-way={way}>
      {body}
    </a>
  ) : (
    <div className={styles.w} data-way={way}>
      {body}
    </div>
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

export function Ikonene() {
  const ways = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const drawn = useIn(ways, 0.12);
  const titled = useIn(head, 0.18);
  const f = t.form;
  return (
    <section className={styles.i6}>
      <div ref={ways} className={styles.ways} data-in={drawn ? '' : undefined}>
        <Way way="epost" href={`mailto:${c.email}`} label={t.emailLabel} icon={MAIL}>
          {c.email}
        </Way>
        <Way way="telefon" href={`tel:${c.phone.replace(/\s/g, '')}`} label={t.phoneLabel} icon={TEL}>
          {c.phone}
        </Way>
        <Way way="adresse" label={t.addressLabel} icon={POST}>
          {c.address.join(', ')}
          <small>
            {t.orgnrLabel} {c.orgnr}
          </small>
        </Way>
      </div>
      <div ref={head} className={styles.form}>
        <Lines as="h1" text={f.title} on={titled} className={styles.h1} />
        {/* The form is drawn, not wired: spans, not controls, hidden from a reader; the notice beside Send is read. */}
        <div className={styles.kf}>
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
      </div>
    </section>
  );
}
