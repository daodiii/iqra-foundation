'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { onScrollFrame, progress, reducedMotion } from '@/components/forside/frame';
import { Knapp } from '@/components/forside/Knapp';
import { Lines } from '@/components/forside/Lines';
import f from '@/components/forside/forside.module.css';
import { numbers } from './gaver';
import { drop, pose, pts, scene } from './steiner';
import styles from './grunnmuren.module.css';

const t = klient.support;
const SCENE = scene();
/** Each use's mark takes its stone's colour (the stone's front face). */
const MARK = ['#1b2a4a', '#21716f', '#8c2340', '#67c1bf', '#cee9e8'];

/**
 * Shrink everything in the text (`--z`) until it fits its box, the way the mock's `fit()` did: no
 * overflow down or across, and no heading or paragraph wider than itself. Nothing in the box moves
 * by a transform (the note only fades), so its scroll size is its content's.
 */
function fit(el: HTMLElement) {
  let z = 1;
  el.style.setProperty('--z', '1');
  const wide = () => Array.from(el.querySelectorAll('h2,p,li')).some((h) => h.scrollWidth > h.clientWidth + 1);
  while ((el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1 || wide()) && z > 0.5) {
    z -= 0.02;
    el.style.setProperty('--z', z.toFixed(2));
  }
}

/**
 * Støtt oss as 30 «Grunnmuren» (the owner's pick, 2026-11-20): the title on navy; then the screen
 * holds on «Hva bidraget går til» while, step by step with the scroll, five stones drop and settle
 * into a foundation, each use lighting beside its stone, and the client's closing note last; then
 * the three ways to give on white, the Vipps number and AvtaleGiro under «Gave»; then their last
 * line on burgundy.
 *
 * Without JavaScript, and under reduced motion, the section does not hold: the stones stand built
 * and every use is lit (the hiding lives only under `html[data-js]` with motion allowed).
 */
export function Grunnmuren() {
  const pin = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  const [seen, setSeen] = useState<Record<string, boolean>>({});

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

  // Everything further down rises or fades in once, as it comes onto the screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const n = e.target as HTMLElement;
          n.dataset.in = '';
          const key = n.dataset.rise;
          if (key) setSeen((s) => ({ ...s, [key]: true }));
          io.unobserve(n);
        }),
      { threshold: 0.18 },
    );
    el.querySelectorAll('[data-rv], [data-rise]').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  // The held screen: the text fits its box, and the stones follow the scroll exactly.
  useEffect(() => {
    const el = pin.current;
    const tx = text.current;
    if (!el || !tx) return;
    const stage = tx.parentElement as HTMLElement;
    const refit = () => fit(tx);
    refit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refit) : null;
    ro?.observe(stage);
    document.fonts?.ready.then(refit);
    if (reducedMotion()) return () => ro?.disconnect();

    const stones = Array.from(el.querySelectorAll<SVGGElement>('[data-stone]'));
    const shadows = Array.from(el.querySelectorAll<SVGPolygonElement>('[data-shadow]'));
    const uses = Array.from(tx.querySelectorAll<HTMLLIElement>('li'));
    const note = tx.querySelector<HTMLElement>('[data-note]');
    const stop = onScrollFrame(el, () => {
      const H = stage.clientHeight;
      if (!H) return;
      const k = progress(el, H);
      stones.forEach((s, i) => {
        const p = pose(drop(k, i));
        s.style.setProperty('--dy', `${p.dy.toFixed(1)}px`);
        s.style.setProperty('--o', String(p.o));
        shadows[i].style.setProperty('--ss', p.ss.toFixed(3));
        shadows[i].style.setProperty('--so', p.so.toFixed(3));
        uses[i]?.toggleAttribute('data-on', p.lit);
      });
      note?.toggleAttribute('data-on', k > 0.9);
    });
    return () => {
      ro?.disconnect();
      stop();
    };
  }, []);

  const gave = t.ways.items[0];
  const rest = t.ways.items.slice(1);

  return (
    <article ref={root} className={styles.root}>
      <section className={`${styles.hero} ${f.pad}`} aria-labelledby="stott-tittel">
        <Lines as="h1" id="stott-tittel" className={styles.h1} text={t.title} on={on} />
        <p className={styles.intro} data-in={on ? '' : undefined}>
          {t.intro}
        </p>
      </section>

      <div ref={pin} className={styles.pin} data-pin>
        <section className={`${styles.stage} ${f.pad}`} aria-labelledby="bidraget">
          <div ref={text} className={styles.text}>
            <h2 id="bidraget">{t.uses.title}</h2>
            <p className={styles.lead}>{t.uses.lead}</p>
            <ol>
              {t.uses.points.map((p, i) => (
                <li key={p} style={{ '--sc': MARK[i] } as CSSProperties}>
                  {p}
                </li>
              ))}
            </ol>
            <p className={styles.note} data-note>
              {t.uses.close}
            </p>
          </div>
          <div className={styles.scene} aria-hidden="true">
            <svg viewBox={SCENE.viewBox} preserveAspectRatio="xMidYMid meet" data-scene>
              <polygon className={styles.ground} points={pts(SCENE.ground)} fill="none" stroke="rgba(255,255,255,.18)" />
              {SCENE.stones.map((s, i) => (
                <polygon key={i} className={styles.shadow} points={pts(s.shadow)} fill="rgba(0,0,0,.45)" data-shadow />
              ))}
              {SCENE.stones.map((s, i) => (
                <g key={i} className={styles.stone} data-stone>
                  {s.faces.map((fc, j) => (
                    <polygon key={j} points={pts(fc.pts)} fill={fc.fill} />
                  ))}
                  <polyline points={pts(s.edge)} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={1.2} />
                </g>
              ))}
            </svg>
          </div>
        </section>
      </div>

      <section className={`${styles.ways} ${f.pad}`} aria-labelledby="bidra">
        <div className={styles.waysHead} data-rise="ways">
          <Lines as="h2" id="bidra" text={t.ways.title} on={!!seen.ways} />
        </div>
        <div className={styles.way} data-rv>
          <h3>{gave.title}</h3>
          <p>{gave.text}</p>
          <div className={styles.give} data-give>
            {numbers().map((n) => (
              <p key={n.key} className={styles.num}>
                <b>{n.value}</b>
                <span>{n.label}</span>
              </p>
            ))}
            <div>
              <Knapp href={site.support.avtale.href} kind="fill" className={styles.k}>
                {site.support.avtale.button}
              </Knapp>
            </div>
          </div>
        </div>
        {rest.map((w, i) => (
          <div key={w.title} className={styles.way} data-rv style={{ '--d': `${(i + 1) * 0.1}s` } as CSSProperties}>
            <h3>{w.title}</h3>
            <p>{w.text}</p>
          </div>
        ))}
      </section>

      <section className={styles.close} data-rise="close">
        <Lines text={t.close} on={!!seen.close} />
      </section>
    </article>
  );
}
