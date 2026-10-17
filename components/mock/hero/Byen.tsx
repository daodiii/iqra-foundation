'use client';

import { useEffect, useRef } from 'react';
import { onScroll } from '@/lib/smooth';
import styles from './byen.module.css';
import { Hybrid } from './Hybrid';

/** How much slower than the page the picture moves as the hero scrolls away. */
const DEPTH = 0.35;

/** The city, faint in the sky's own colour; it settles as the name steps out, and lags the page on the way down. */
function City() {
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
    <div ref={box} className={styles.city} aria-hidden="true">
      <img
        className={styles.picture}
        src="/mock/hero/christiania-1280.webp"
        srcSet="/mock/hero/christiania-1280.webp 1280w, /mock/hero/christiania-2560.webp 2560w"
        sizes="100vw"
        alt=""
        width={1280}
        height={800}
        fetchPriority="high"
        decoding="async"
      />
    </div>
  );
}

/**
 * MOCK 16 Byen. 15 on 14's sky, with the city under it: John William Edy's aquatint of Christiania
 * (Oslo) seen from Ekeberg — the fjord, the town under the hills, two people on the slope pointing
 * at it — laid into the sky so faintly it is felt more than seen, in the sky's own colour (lighter
 * than the navy at night, darker than the light by day). It settles from a little larger as the
 * name steps out of the header, and stays behind as the page scrolls on. Public domain
 * (Nasjonalmuseet, via Wikimedia Commons); the credit stands under the buttons.
 */
export function Byen() {
  return (
    <Hybrid
      className={styles.byen}
      ground={<City />}
      note={<p className={styles.credit}>Bilde: John William Edy, «City of Christiania», Nasjonalmuseet (fri bruk)</p>}
    />
  );
}
