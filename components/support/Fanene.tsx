import type { CSSProperties } from 'react';
import { Logo } from '@/components/site/Logo';
import { site } from '@/content/site.no';
import styles from './fanene.module.css';

/** The banners' cloths, left to right, by the owner's word of 2026-09-21: navy, white, burgundy. */
const FANE = ['navy', 'white', 'crimson'] as const;

/**
 * A number in the lines the eye gets it in: an account number's three groups break after
 * the second («1234 56» / «78903»), so it can stand as large as the Vipps number; anything
 * else is one line. A screen reader reads the value whole.
 */
export function lines(value: string): string[] {
  const g = value.split(' ');
  return g.length === 3 ? [`${g[0]} ${g[1]}`, g[2]] : [value];
}

function Value({ value, className }: { value: string; className: string }) {
  const ls = lines(value);
  const chars = Math.max(...ls.map((l) => l.length));
  return (
    <p className={className} style={{ '--chars': chars } as CSSProperties}>
      <span className="visually-hidden">{value}</span>
      {ls.map((l) => (
        <span key={l} className={styles.line} aria-hidden="true">{l}</span>
      ))}
    </p>
  );
}

/** AvtaleGiro's amounts and its button, drawn for the eye: spans, not controls, and hidden from a reader, since nothing is wired. */
function Avtale() {
  const a = site.support.avtale;
  return (
    <div className={styles.drawn} data-drawn aria-hidden="true">
      <span className={styles.chips}>
        {a.tiers.map((t, i) => (
          <span key={t} className={styles.chip} data-on={i === a.pick ? '' : undefined}>{t} {a.unit}</span>
        ))}
      </span>
      <span className={styles.button}>{a.button}</span>
    </div>
  );
}

/**
 * Støtt oss (17 Fanene, the owner's pick of 2026-09-21, shaped by their word): the question
 * across the top, and under it the three ways to give as three banners hung from a rail —
 * navy, white, burgundy — in the owner's order: the account number for a direct transfer,
 * the Vipps number, AvtaleGiro. As the page comes the question rises out of its line and
 * the banners unroll one after another, the roll running down the face, each swinging once
 * as it settles; touched, a banner leans a degree. The name at the top, the number across
 * the middle, the guide's lockup for that ground at the foot. Every beat is the
 * stylesheet's, from the first paint, and needs no script; under reduced motion everything
 * stands unrolled. The numbers are bracketed until the foundation's own arrive (the build
 * reports them); AvtaleGiro's amounts and button are drawn, not wired.
 */
export function Fanene() {
  const s = site.support;
  const ways = [
    { key: 'konto', name: s.ways.account, label: s.account.label, value: s.account.value, avtale: false },
    { key: 'vipps', name: s.ways.vipps, label: s.vipps.label, value: s.vipps.value, avtale: false },
    { key: 'avtale', name: s.ways.avtale, label: s.avtale.amount, value: s.avtale.tiers[s.avtale.pick], avtale: true },
  ] as const;
  return (
    <article className={styles.fanene} data-plates>
      <h1 className={styles.question}>{site.pages.support.question}</h1>
      <div className={styles.hall}>
        {ways.map((w, k) => (
          <section key={w.key} className={styles.hang} style={{ '--k': k } as CSSProperties} aria-labelledby={`fane-${w.key}`}>
            <div className={styles.banner} data-fane={FANE[k]}>
              <div className={styles.face}>
                <h2 id={`fane-${w.key}`} className={styles.name}>{w.name}</h2>
                <div className={styles.mid}>
                  <Value value={w.value} className={styles.value} />
                  <p className={styles.label}>{w.label}</p>
                  {w.avtale && <Avtale />}
                </div>
                <div className={styles.foot}>
                  <Logo ground={FANE[k]} height={26} decorative />
                </div>
              </div>
              <span className={styles.roll} aria-hidden="true" />
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
