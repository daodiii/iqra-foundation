'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { LOCKUP_VIEWBOX, LOCKUP_WORD } from '@/components/home/lockup';
import { MARK_ACCENTS, MARK_LETTERS } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import styles from './preget.module.css';

/** The relief: how far the light edge and the dark edge stand off the letters, as a share of the plate's width. */
const DEPTH = 0.0052;
/** Where the light rests once the name is pressed: from the upper left, a little above the horizontal. */
const REST = { a: Math.PI * 1.2, rake: 1 };
/** The press: the name comes up out of the sheet in this long, then the light swings round to rest. */
const PRESS = 700;
const SWING = 1700;

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/** The whole lockup, the accents with it: what stands up out of the sheet. */
function Relief({ id, fill, soft }: { id: string; fill: string; soft: number }) {
  return (
    <svg className={styles.layer} viewBox={LOCKUP_VIEWBOX} aria-hidden="true" data-relief={id}>
      <filter id={`preget-${id}`} x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation={soft} />
      </filter>
      <g filter={`url(#preget-${id})`} fill={fill}>
        {MARK_LETTERS.map((p, k) => (
          <path key={k} transform={p.transform} d={p.d} />
        ))}
        {MARK_ACCENTS.map((p, k) => (
          <path key={k} transform={p.transform} d={p.d} />
        ))}
        {LOCKUP_WORD.map((p, k) => (
          <path key={k} transform={p.transform} d={p.d} />
        ))}
      </g>
    </svg>
  );
}

/**
 * MOCK 13 Preget. The name pressed into the page. The hero is a sheet of the guide's navy, and the
 * mark «iQRa» is not printed on it but blind-embossed: the letters are the sheet's own navy, raised
 * out of it, and told apart only by light — a lit edge on the side the light comes from, a dark edge on
 * the far side. FOUNDATION is pressed with it; the only ink on the sheet is the logo's crimson, in
 * the two accents, raised the same way. On arrival the press comes down and the name rises out of the sheet,
 * then the light swings round from low on the left to rest above it. After that the light is the
 * visitor's: it comes from wherever the pointer is (a tap on a phone), raking long when it is far
 * away and short when it is over the name. Nothing else moves; the paragraph and the buttons stand
 * printed on the sheet from the first frame.
 */
export function Preget() {
  const hero = useRef<HTMLElement>(null);
  const plate = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const h = hero.current;
    const p = plate.current;
    if (!h || !p) return;
    const lit = p.querySelector<SVGElement>('[data-relief="light"]');
    const dark = p.querySelector<SVGElement>('[data-relief="dark"]');
    if (!lit || !dark) return;
    h.setAttribute('data-live', '');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let box = p.getBoundingClientRect();
    const measure = () => (box = p.getBoundingClientRect());
    // The light now, and where it is going: an angle (towards the light, screen axes) and a rake (1 overhead-ish, 2 low and long).
    const now = { a: Math.PI * 0.85, rake: 2.4, press: 0 };
    const aim = { ...REST };
    const place = () => {
      const d = box.width * DEPTH * now.press * now.rake;
      const cx = Math.cos(now.a);
      const cy = Math.sin(now.a);
      lit.style.transform = `translate3d(${(cx * d * 0.7).toFixed(2)}px, ${(cy * d * 0.7).toFixed(2)}px, 0)`;
      dark.style.transform = `translate3d(${(-cx * d * 1.15).toFixed(2)}px, ${(-cy * d * 1.15).toFixed(2)}px, 0)`;
      lit.style.opacity = String(Math.max(0.002, Math.min(0.88, 0.72 + 0.16 * (now.rake - 1)) * now.press));
      dark.style.opacity = String(Math.max(0.002, now.press));
    };

    if (reduced) {
      now.a = REST.a;
      now.rake = REST.rake;
      now.press = 1;
      place();
      return;
    }

    let raf = 0;
    let t0 = -1;
    let last = 0;
    let arriving = true;
    const from = { a: now.a, rake: now.rake };
    const frame = (t: number) => {
      if (t0 < 0) {
        t0 = t;
        last = t;
      }
      const e = t - t0;
      const dt = Math.min(64, t - last);
      last = t;
      if (arriving) {
        now.press = easeOut(e / PRESS);
        const s = easeOut((e - PRESS * 0.4) / SWING);
        now.a = from.a + (aim.a - from.a) * s;
        now.rake = from.rake + (aim.rake - from.rake) * s;
        if (e > PRESS * 0.4 + SWING) arriving = false;
      } else {
        // Towards the pointer's light: the shorter way round, eased by the frame's own length.
        const k = 1 - Math.pow(1 - 0.075, dt / 16.7);
        let da = aim.a - now.a;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        now.a += da * k;
        now.rake += (aim.rake - now.rake) * k;
      }
      place();
      const still = !arriving && Math.abs(Math.atan2(Math.sin(aim.a - now.a), Math.cos(aim.a - now.a))) < 0.002 && Math.abs(aim.rake - now.rake) < 0.002;
      raf = still ? 0 : requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    // The visitor's light: from the pointer's side of the name, longer the further away it is.
    const lightFrom = (x: number, y: number) => {
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const far = Math.min(1, Math.hypot(dx / box.width, dy / box.height) * 1.4);
      aim.a = Math.atan2(dy, dx);
      aim.rake = 0.85 + far * 0.9;
      if (arriving) {
        // The pointer arrived before the light did: let it take over from where the light is.
        arriving = false;
        now.press = 1;
      }
      wake();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      lightFrom(e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      lightFrom(e.clientX, e.clientY);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      aim.a = REST.a;
      aim.rake = REST.rake;
      wake();
    };
    h.addEventListener('pointermove', onMove);
    h.addEventListener('pointerdown', onDown);
    h.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      h.removeEventListener('pointermove', onMove);
      h.removeEventListener('pointerdown', onDown);
      h.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, []);

  return (
    <section ref={hero} className={styles.hero} aria-labelledby="hovedtekst" data-header="dark">
      <h1 id="hovedtekst" className={styles.mark}>
        <span ref={plate} className={styles.plate}>
          <Relief id="dark" fill="var(--preget-shade)" soft={1.6} />
          <Relief id="light" fill="var(--preget-light)" soft={0.9} />
          <svg className={styles.face} viewBox={LOCKUP_VIEWBOX} role="img" aria-label={site.logoAlt}>
            {MARK_LETTERS.map((p, k) => (
              <path key={k} className={styles.sheet} transform={p.transform} d={p.d} />
            ))}
            {MARK_ACCENTS.map((p, k) => (
              <path key={k} className={styles.accent} transform={p.transform} d={p.d} />
            ))}
            {LOCKUP_WORD.map((p, k) => (
              <path key={k} className={styles.sheet} transform={p.transform} d={p.d} />
            ))}
          </svg>
        </span>
      </h1>
      <div className={styles.band}>
        <p className={styles.lede}>{brief.home.paragraph}</p>
        <p className={styles.buttons}>
          <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
          <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
        </p>
      </div>
    </section>
  );
}
