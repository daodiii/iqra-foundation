'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { onScroll } from '@/lib/smooth';
import styles from './bagdad.module.css';
import { Hybrid } from './Hybrid';

/** How much slower than the page the drawing moves as the hero scrolls away. */
const DEPTH = 0.35;

/**
 * The library, as ink: al-Wasiti's painting turned into one flat colour of the guide's with the
 * paint's tone as its transparency (the paint's dark as crimson on the rose, its light as a pale
 * blue on the navy), so the drawing is in the page's own colour and nothing of the paint's yellows
 * and greens comes through. Baked into the image: a CSS mask did the same and cost frames.
 */
function Library({ base, at = '50% 42%', phoneAt = '62% 50%' }: { base: string; at?: string; phoneAt?: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const b = box.current;
    if (!b || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const place = () => {
      raf = 0;
      const y = Math.min(window.scrollY, window.innerHeight * 1.2);
      b.style.transform = y > 0 ? `translate3d(0, ${(y * DEPTH).toFixed(1)}px, 0)` : '';
    };
    const onMove = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    const off = onScroll(onMove);
    window.addEventListener('scroll', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      off();
      window.removeEventListener('scroll', onMove);
    };
  }, []);
  return (
    <>
      <div className={styles.floor} aria-hidden="true" />
      <div ref={box} className={styles.library} aria-hidden="true">
        <img
          className={styles.ink}
          style={{ '--at': at, '--phone-at': phoneAt } as CSSProperties}
          src={`/mock/hero/${base}-960.webp`}
          srcSet={`/mock/hero/${base}-960.webp 960w, /mock/hero/${base}-1920.webp 1920w`}
          sizes="100vw"
          alt=""
          width={1920}
          height={1386}
          decoding="async"
        />
      </div>
    </>
  );
}

const credit = <p className={styles.credit}>Bilde: Yahya ibn Mahmud al-Wasiti, et bibliotek, fra al-Hariris Maqamat (1237). Bibliothèque nationale de France (fri bruk)</p>;

/**
 * MOCK 19 Bagdad, rød. 18 Skyggen on a fixed ground: a light rose (the guide's crimson in the
 * light), and on it, drawn in the crimson, a library painted in Baghdad's own time — Yahya
 * al-Wasiti's scholars under the shelves of books, from al-Hariri's Maqamat, 1237 (Bibliothèque
 * nationale de France, Arabe 5847). The guide's logo, navy with the crimson accents, steps out of
 * the header; once it lands it casts the real dark of the minute on the floor.
 */
export function BagdadRod() {
  return (
    <Hybrid
      replay
      cast
      className={styles.rod}
      palette={{ sky: '#ecdde0', floor: '#e2cdd2', ink: 'dark' }}
      ground={<Library base="bagdad-rod" />}
      note={credit}
    />
  );
}

/**
 * MOCK 20 Bagdad, blå. The same on the guide's navy: the library drawn in a pale blue, light where
 * the paint is light, and the logo reversed with the crimson accents (not the turquoise of the
 * guide's reversed file) — the header's reversed logo is swapped to the same while the mock is up.
 */
export function BagdadBla() {
  return (
    <Hybrid
      replay
      cast
      className={styles.bla}
      palette={{ sky: '#2c394b', floor: '#222e3e', ink: 'light' }}
      darkLogo="/mock/hero/iqra-logo-on-navy-crimson.svg"
      ground={<Library base="bagdad-bla" />}
      note={credit}
    />
  );
}

const NAVY = { sky: '#2c394b', floor: '#222e3e', ink: 'light' } as const;

/** 21–25: 20 Bagdad, blå with another picture and the stacked layout, and without the name's cast (the owner, 2026-10-17: «take it away»). */
function Scene({
  base,
  at,
  phoneAt,
  credit: line,
  layout = 'stack',
  palette = NAVY,
}: {
  base: string;
  at?: string;
  phoneAt?: string;
  credit?: ReactNode;
  layout?: 'stack' | 'center';
  palette?: { sky: string; floor: string; ink: 'light' | 'dark' };
}) {
  return (
    <Hybrid
      replay
      layout={layout}
      className={styles.bla}
      palette={palette}
      darkLogo="/mock/hero/iqra-logo-on-navy-crimson.svg"
      ground={<Library base={base} at={at} phoneAt={phoneAt} />}
      note={line ? <p className={styles.credit}>{line}</p> : undefined}
    />
  );
}

/** MOCK 21 Samtalen: two men in conversation over their jugs, al-Wasiti, al-Hariri's Maqamat, Baghdad 1237 (BnF Arabe 5847, f. 86r). Dialog. */
export function Samtalen() {
  return <Scene base="samtalen-bla" at="50% 30%" phoneAt="24% 30%" credit="Bilde: Yahya ibn Mahmud al-Wasiti, en samtale, fra al-Hariris Maqamat (1237). Bibliothèque nationale de France (fri bruk)" />;
}

/** MOCK 22 Skolen: a teacher with his pupils and their writing tablets, al-Hariri's Maqamat, 1256 (British Library, Or. 1200, f. 156v). Kunnskap. */
export function Skolen() {
  return <Scene base="skolen-bla" at="50% 62%" phoneAt="38% 60%" credit="Bilde: en lærer og elevene hans, fra al-Hariris Maqamat (1256). British Library (fri bruk)" />;
}

/** MOCK 23 Forsamlingen: a crowd gathered to hear a preacher at Rayy, al-Wasiti, al-Hariri's Maqamat, Baghdad 1237 (BnF Arabe 5847, ff. 58v–59r). Møteplasser. */
export function Forsamlingen() {
  return <Scene base="forsamlingen-bla" at="50% 50%" phoneAt="80% 50%" credit="Bilde: Yahya ibn Mahmud al-Wasiti, en forsamling i Rayy, fra al-Hariris Maqamat (1237). Bibliothèque nationale de France (fri bruk)" />;
}

/**
 * MOCK 24 Staden: the owner's own picture (2026-10-17, «try with this»; they made it with Google's
 * image generator, so it is theirs to use): a city of domes, minarets, arcades and a crowded court
 * by a river, as pale-blue ink like 21–23. No credit line.
 */
export function Staden() {
  return <Scene base="staden-bla" at="50% 40%" phoneAt="50% 50%" />;
}

/**
 * MOCK 25 Staden, midtstilt: 24 with everything on the centre line (the owner, 2026-10-17: «make the
 * hero section be in the center»), on one ground: the darker of the two navies, sky and floor alike,
 * and the header with it («we don't need the hero section to be split … just have the darkest»).
 */
const DEEP = { sky: '#222e3e', floor: '#222e3e', ink: 'light' } as const;

export function StadenMidt() {
  return <Scene base="staden-bla" at="50% 40%" phoneAt="50% 50%" layout="center" palette={DEEP} />;
}

