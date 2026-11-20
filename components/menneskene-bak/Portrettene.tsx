'use client';

import { useEffect, useRef, useState } from 'react';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { onScrollFrame, progress } from '@/components/forside/frame';
import { Lines } from '@/components/forside/Lines';
import f from '@/components/forside/forside.module.css';
import type { Person } from '@/lib/content';
import styles from './portrettene.module.css';

const t = klient.people;

/** The frames' grounds in turn (mock 14): crimson, teal, navy, pale teal, white; the light two take navy type. */
const FRAMES = [styles.rod, styles.teal, styles.navy, styles.pale, styles.white];

/**
 * The client's sentence with its e-mail address as a link; the words stay exactly theirs. The
 * address (and the full stop after it) stands on its own line, set large, as in the mock.
 */
export function WithMailLink({ text }: { text: string }) {
  const email = site.contact.email;
  const at = text.indexOf(email);
  if (at === -1) return <>{text}</>;
  let rest = text.slice(at + email.length);
  const stop = rest.startsWith('.');
  if (stop) rest = rest.slice(1);
  return (
    <>
      {text.slice(0, at)}
      <span className={styles.mline}>
        <a className={styles.mail} href={`mailto:${email}`}>
          {email}
        </a>
        {stop && '.'}
      </span>
      {rest}
    </>
  );
}

/** One board member's frame: the photo filling it when there is one, then the name, the role and the bio. */
function Frame({ p, i }: { p: Person; i: number }) {
  return (
    <li className={`${styles.frame} ${FRAMES[i % FRAMES.length]}`} data-photo={p.photo ? '' : undefined}>
      {p.photo && (
        <>
          <img className={styles.photo} src={p.photo.src} alt={p.photo.alt} loading="lazy" decoding="async" />
          <span className={styles.scrim} aria-hidden="true" />
        </>
      )}
      <h3 className={styles.name}>{p.name}</h3>
      <p className={styles.role}>{p.role}</p>
      {p.bio && <p className={styles.bio}>{p.bio}</p>}
    </li>
  );
}

/**
 * Menneskene bak as 14 «Portrettene» (the owner's pick, 2026-11-20): the title on navy, then a
 * held screen with «Styret» on the left while the board's tall colour frames pass sideways with
 * the scroll, ready for photos; then a white band with the board's address set large.
 */
export function Portrettene({ people }: { people: Person[] }) {
  const pin = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const [on, setOn] = useState(false);

  // The title rises and the intro fades up once the page has painted.
  useEffect(() => {
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setOn(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, []);

  // The frames follow the scroll exactly while the stage holds.
  useEffect(() => {
    const el = pin.current;
    const v = view.current;
    const tr = track.current;
    if (!el || !v || !tr) return;
    const stage = v.parentElement as HTMLElement;
    return onScrollFrame(el, () => {
      const H = stage.clientHeight;
      if (!H) return;
      const k = progress(el, H);
      const room = Math.max(0, tr.scrollWidth - v.clientWidth);
      tr.style.transform = `translate3d(${(-k * room).toFixed(1)}px,0,0)`;
    });
  }, [people.length]);

  const empty = people.length === 0;

  return (
    <article className={styles.root}>
      <section className={`${styles.hero} ${f.pad}`} aria-labelledby="menneskene-tittel">
        <Lines as="h1" id="menneskene-tittel" className={styles.h1} text={t.title} on={on} />
        <p className={styles.intro} data-in={on ? '' : undefined}>
          {t.intro}
        </p>
      </section>

      <section
        ref={pin}
        className={styles.pin}
        aria-labelledby="styret"
        data-empty={empty ? '' : undefined}
        style={{ '--n': people.length } as React.CSSProperties}
      >
        <div className={`${styles.stage} ${f.pad}`}>
          <div className={styles.left}>
            <h2 id="styret">{t.board.title}</h2>
            <p>{t.board.text}</p>
          </div>
          <div ref={view} className={styles.view}>
            {empty ? (
              <p className={styles.empty}>{site.pages.people.empty}</p>
            ) : (
              <ul ref={track} className={styles.track}>
                {people.map((p, i) => (
                  <Frame key={p.slug} p={p} i={i} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className={`${styles.contact} ${f.pad}`} aria-labelledby="kontakt-styret">
        <h2 id="kontakt-styret">{t.contact.title}</h2>
        <p>
          <WithMailLink text={t.contact.text} />
        </p>
      </section>
    </article>
  );
}
