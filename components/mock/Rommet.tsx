'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { CAST_W, frameOf, makeCast, token } from './cast';
import { MARK_ASPECT } from './markCanvas';
import { makeWindow, WRITE } from './window';
import styles from './rommet.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);

/**
 * 14 Rommet, from 9: the room is a room. The far wall, the floor, the ceiling and the two
 * side walls are planes in a CSS perspective, hinged on the wall's edges and reaching
 * towards the eye; the window with the film is on the far wall, and the film's light lies
 * on the floor as a floor — the same mirrored frame as 9's beam, but on a plane the
 * perspective foreshortens instead of a stretch. On arrival the eye is outside the room
 * and comes in through the opening over two seconds while the lamps come on; from then on
 * the pointer turns the head a little, about the eye, and the walls swing while the window
 * holds. The film is drawn into a canvas here rather than clipped as a video: a clipped
 * video under a 3D transform leaked its frame past the letters (9's finding). Reduced
 * motion, or no script: the room, seen from inside, still.
 */
export function Rommet() {
  const room = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLCanvasElement>(null);
  const cast = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const r = room.current;
    const st = stage.current;
    const f = film.current;
    const c = cast.current;
    const v = video.current;
    if (!r || !st || !f || !c || !v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const narrow = window.matchMedia('(max-width: 767px)').matches;
    v.src = pickSource({ narrow, webm: v.canPlayType('video/webm; codecs="vp9"') !== '' });
    v.muted = true;
    v.load();
    Promise.resolve(v.play()).catch(() => {});
    r.dataset.live = '';

    const crimson = token('--color-crimson', '#ab5261');
    const poster = new Image();
    poster.src = POSTER;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // The window at the stage's own resolution; remade when the stage changes size.
    let drawWin: ReturnType<typeof makeWindow> | null = null;
    let winW = 0;
    // The light on the floor: 9's cast drawn once, then laid on the floor blurred — the blur
    // in the canvas, since a CSS filter on a canvas under a 3D transform is the grey-box trap.
    const src = document.createElement('canvas');
    const drawCast = makeCast(src, crimson);
    c.width = CAST_W;
    c.height = Math.round(CAST_W / MARK_ASPECT);
    const cctx = c.getContext('2d');
    let px = 0;
    let py = 0;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const frame = frameOf(v, poster);
      if (!frame) return;
      const w = Math.round(st.clientWidth * dpr);
      if (w !== winW && w > 0) {
        winW = w;
        drawWin = makeWindow(f, w, crimson, -Infinity);
      }
      drawWin?.(frame, 0, [px * -18 * dpr, py * -12 * dpr]);
      drawCast(frame);
      if (cctx) {
        cctx.clearRect(0, 0, c.width, c.height);
        cctx.filter = 'blur(6px)';
        cctx.drawImage(src, 0, 0);
        cctx.filter = 'none';
      }
    };
    raf = requestAnimationFrame(tick);

    const onMove = (e: PointerEvent) => {
      px = e.clientX / innerWidth - 0.5;
      py = e.clientY / innerHeight - 0.5;
      r.style.setProperty('--px', px.toFixed(3));
      r.style.setProperty('--py', py.toFixed(3));
    };
    addEventListener('pointermove', onMove, { passive: true });
    return () => {
      removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      v.pause();
    };
  }, []);

  return (
    <section ref={room} className={styles.room} aria-labelledby="hovedtekst">
      <video ref={video} className={styles.source} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
      <div className={styles.camera} aria-hidden="true">
        <div className={styles.dolly}>
          <div className={styles.box}>
            <div className={`${styles.plane} ${styles.wall}`} />
            <div className={`${styles.plane} ${styles.left}`} />
            <div className={`${styles.plane} ${styles.right}`} />
            <div className={`${styles.plane} ${styles.ceiling}`} />
            <div className={`${styles.plane} ${styles.floor}`}>
              <canvas ref={cast} className={styles.cast} />
            </div>
            <div className={styles.glow} />
            <div ref={stage} className={styles.stage}>
              <img className={styles.still} src={POSTER} alt="" />
              <canvas ref={film} className={styles.film} />
              <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
                <defs>
                  <clipPath id="rom-letters" clipPathUnits="objectBoundingBox">
                    {MARK_LETTERS.map((p, i) => (
                      <path key={i} transform={`scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${p.transform}`} d={p.d} />
                    ))}
                  </clipPath>
                </defs>
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} className={styles.lamp} style={{ '--i': WRITE[i] } as React.CSSProperties} transform={p.transform} d={p.d} />
                ))}
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} className={styles.edge} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
                ))}
                {MARK_ACCENTS.map((p, i) => (
                  <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Band className={styles.band} title={(t) => <span className={styles.sweep}>{t}</span>} />
    </section>
  );
}
