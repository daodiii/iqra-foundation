'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { frameOf, makeCast, token } from './cast';
import { makeWindow, WRITE } from './window';
import styles from './galleriet.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);

/**
 * 16 Galleriet, from 14 on white: the room is a white room. The same planes in the same
 * perspective — far wall, floor, ceiling, side walls — told apart by their shading and
 * the hairline seams, the window with the film on the far wall, and the film's light
 * lying on the white floor as coloured light: the floor is a canvas painted white with
 * its own fall-off, and the mirrored, blurred frame multiplied onto it (a blend mode on
 * an element under a 3D transform is not to be trusted; in the canvas it is a number).
 * The eye comes in through the opening on arrival while the panes light; the pointer
 * turns the head. The film is drawn into a canvas as in 14. Reduced motion, or no
 * script: the room, from inside, still.
 */
export function Galleriet() {
  const room = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLCanvasElement>(null);
  const floor = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const r = room.current;
    const st = stage.current;
    const f = film.current;
    const fl = floor.current;
    const v = video.current;
    if (!r || !st || !f || !fl || !v) return;
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
    let drawWin: ReturnType<typeof makeWindow> | null = null;
    let winW = 0;
    const src = document.createElement('canvas');
    const drawCast = makeCast(src, crimson);
    const soft = document.createElement('canvas');
    soft.width = src.width;
    soft.height = src.height;
    const sctx = soft.getContext('2d');
    const fctx = fl.getContext('2d');
    const t0 = performance.now();
    let px = 0;
    let py = 0;
    let raf = 0;
    const tick = (now: number) => {
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
      if (!sctx || !fctx) return;
      sctx.clearRect(0, 0, soft.width, soft.height);
      sctx.filter = 'blur(7px)';
      sctx.drawImage(src, 0, 0);
      sctx.filter = 'none';
      // The floor: white, falling off towards the eye, the light multiplied onto it.
      const FW = fl.clientWidth;
      const FH = fl.clientHeight;
      if (fl.width !== FW || fl.height !== FH) {
        fl.width = FW;
        fl.height = FH;
      }
      const g = fctx.createLinearGradient(0, 0, 0, FH);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.5, '#f5f6f7');
      g.addColorStop(1, '#e6e8eb');
      fctx.globalCompositeOperation = 'source-over';
      fctx.fillStyle = g;
      fctx.fillRect(0, 0, FW, FH);
      const cw = st.clientWidth * 1.22;
      const ch = st.clientWidth * (narrow ? 0.9 : 1.15);
      const up = Math.min(1, Math.max(0, (now - t0 - 1200) / 1200));
      fctx.globalAlpha = 0.9 * up;
      fctx.globalCompositeOperation = 'multiply';
      fctx.drawImage(soft, (FW - cw) / 2, 0, cw, ch);
      fctx.globalAlpha = 1;
      fctx.globalCompositeOperation = 'source-over';
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
            <canvas ref={floor} className={`${styles.plane} ${styles.floor}`} />
            <div ref={stage} className={styles.stage}>
              <img className={styles.still} src={POSTER} alt="" />
              <canvas ref={film} className={styles.film} />
              <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
                <defs>
                  <clipPath id="galleri-letters" clipPathUnits="objectBoundingBox">
                    {MARK_LETTERS.map((p, i) => (
                      <path key={i} transform={`scale(${1 / VW} ${1 / VH}) translate(${-VX} ${-VY}) ${p.transform}`} d={p.d} />
                    ))}
                  </clipPath>
                </defs>
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} className={styles.pane} style={{ '--i': WRITE[i] } as React.CSSProperties} transform={p.transform} d={p.d} />
                ))}
                {MARK_LETTERS.map((p, i) => (
                  <path key={i} className={styles.lead} transform={p.transform} d={p.d} vectorEffect="non-scaling-stroke" />
                ))}
                {MARK_ACCENTS.map((p, i) => (
                  <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Band tone="dark" className={styles.band} title={(t) => <span className={styles.sweep}>{t}</span>} />
    </section>
  );
}
