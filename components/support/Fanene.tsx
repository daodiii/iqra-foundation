import type { CSSProperties } from 'react';
import { Logo } from '@/components/site/Logo';
import { site } from '@/content/site.no';
import { isPlaceholder } from '@/lib/placeholder';
import styles from './fanene.module.css';

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

/**
 * AvtaleGiro's one button, and it is a real one now (2026-09-23): the foundation's agreement lives
 * at Solidus, and this is the way to it. It stands where the other two banners carry their number,
 * because the number of a standing order is not a thing to read — it is a thing to go and set up.
 */
function Avtale() {
  const a = site.support.avtale;
  return (
    <a className={styles.button} href={a.href} data-avtale>
      {a.button}
    </a>
  );
}

/**
 * The ways to give under «Gave» on Støtt oss (17 Fanene, the owner's pick of 2026-09-21, shaped by
 * their word), as banners hung from a rail — navy, white, burgundy — in the owner's order: the
 * account number for a direct transfer, the Vipps number, AvtaleGiro. Each way keeps its own
 * cloth. The account number is the client's still to give (Q6): while it is bracketed its banner
 * does not hang (the client asked for the placeholders to go, M), and `scripts/check-content.mjs`
 * still reports it. As the page comes the banners unroll one after another, the roll running down the face, each swinging once as it settles;
 * touched, a banner leans a degree. The name at the top, the number across the middle, the
 * guide's lockup for that ground at the foot. Every beat is the stylesheet's, from the first
 * paint, and needs no script; under reduced motion everything stands unrolled.
 */
export function Fanene() {
  const s = site.support;
  const all = [
    { key: 'konto', cloth: 'navy', name: s.ways.account, label: s.account.label, value: s.account.value, avtale: false },
    { key: 'vipps', cloth: 'white', name: s.ways.vipps, label: s.vipps.label, value: s.vipps.value, avtale: false },
    { key: 'avtale', cloth: 'crimson', name: s.ways.avtale, label: null, value: null, avtale: true },
  ] as const;
  const ways = all.filter((w) => w.value === null || !isPlaceholder(w.value));
  return (
    <div className={styles.hall} data-plates>
      {ways.map((w, k) => (
        <section key={w.key} className={styles.hang} style={{ '--k': k } as CSSProperties} aria-labelledby={`fane-${w.key}`}>
          <div className={styles.banner} data-fane={w.cloth}>
            <div className={styles.face}>
              <h4 id={`fane-${w.key}`} className={styles.name}>{w.name}</h4>
              <div className={styles.mid}>
                {w.value && <Value value={w.value} className={styles.value} />}
                {w.label && <p className={styles.label}>{w.label}</p>}
                {w.avtale && <Avtale />}
              </div>
              <div className={styles.foot}>
                <Logo ground={w.cloth} height={26} decorative />
              </div>
            </div>
            <span className={styles.roll} aria-hidden="true" />
          </div>
        </section>
      ))}
    </div>
  );
}
