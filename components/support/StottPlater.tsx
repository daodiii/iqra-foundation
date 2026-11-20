import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { Knapp } from '@/components/forside/Knapp';
import { Lines } from '@/components/forside/Lines';
import { Plate, Plater } from '@/components/plater/Plater';
import { after } from '@/components/plater/after';
import p from '@/components/plater/plater.module.css';
import { numbers } from './gaver';
import styles from './stott-plater.module.css';

const t = klient.support;

/**
 * Støtt oss as «Platene» (mock 42, the owner's pick of 2026-11-20), in the client's order and words
 * (D7): the title and the intro on white; what a gift goes to on navy, the five points as large lines
 * and their closing note under them; the three ways to give on white, under «Gave» the numbers (the
 * Vipps number set big, the account number once the client has given it, Q6) and AvtaleGiro; their
 * last line as a statement on the page's crimson.
 */
export function StottPlater() {
  const [gave, ...rest] = t.ways.items;
  return (
    <Plater>
      <Plate tone="white" label="stott-tittel">
        <Lines as="h1" id="stott-tittel" className={p.h1} text={t.title} />
        <p className={p.intro} data-rise="">
          {t.intro}
        </p>
      </Plate>

      <Plate tone="navy" label="bidraget" data-part="uses">
        <Lines as="h2" id="bidraget" className={p.h} text={t.uses.title} />
        <p className={p.lede} data-rise="">
          {t.uses.lead}
        </p>
        <ol className={p.lines}>
          {t.uses.points.map((s, i) => (
            <li key={s} data-rise="" style={after(i * 0.08)}>
              {s}
            </li>
          ))}
        </ol>
        <p className={p.note} data-rise="">
          {t.uses.close}
        </p>
      </Plate>

      <Plate tone="white" label="bidra" data-part="ways">
        <Lines as="h2" id="bidra" className={p.h} text={t.ways.title} />
        <div className={styles.ways}>
          <div className={styles.way} data-rise="">
            <h3>{gave.title}</h3>
            <p className={styles.text}>{gave.text}</p>
            <div className={styles.give} data-give="">
              {numbers().map((n) => (
                <p key={n.key} className={`${styles.num} ${n.key === 'vipps' ? styles.big : ''}`} data-num={n.key}>
                  <b>{n.value}</b>
                  <span>{n.label}</span>
                </p>
              ))}
              <div className={styles.k}>
                <Knapp href={site.support.avtale.href} kind="fill">
                  {site.support.avtale.button}
                </Knapp>
              </div>
            </div>
          </div>
          {rest.map((w, i) => (
            <div key={w.title} className={styles.way} data-rise="" style={after((i + 1) * 0.1)}>
              <h3>{w.title}</h3>
              <p className={styles.text}>{w.text}</p>
            </div>
          ))}
        </div>
      </Plate>

      <Plate tone="rod" label="stott-slutt" mid data-part="close">
        <Lines id="stott-slutt" className={p.say} text={t.close} />
      </Plate>
    </Plater>
  );
}
