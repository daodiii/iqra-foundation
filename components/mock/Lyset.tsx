'use client';

import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { Band } from './Band';
import { MARK_ASPECT, markPaths } from './markCanvas';
import styles from './lyset.module.css';

const POSTER = '/media/iqra-poster.jpg';
const [VX, VY, VW, VH] = MARK_VIEWBOX.split(' ').map(Number);
/** The lamps' order, i Q R a, for the art's order, a i Q R. */
const WRITE = [3, 0, 1, 2];
/** The beam is drawn this wide; its softness is the upscale and the blur. */
const BEAM_W = 640;

/**
 * 9 Lyset: a dark room. The letters are a window in the far wall — the film clipped to the
 * mark's paths — and on arrival each is a lamp still off: a dark fill over it that flickers
 * out in turn, i Q R a, as the projector warms. The film's light falls through the name
 * onto the floor: the same frame, clipped to the letters, is drawn mirrored into a small
 * canvas every frame and laid under the window stretched, blurred and fading — the beam.
 * The room dollies in over the first two seconds; the pointer shifts the film behind the
 * window a little, and the beam with it; the light sweeps across the headline and leaves
 * it lit. Reduced motion, or no script: the room lit, nothing moves.
 */
export function Lyset() {
  const room = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const beam = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const r = room.current;
    const v = video.current;
    const c = beam.current;
    if (!r || !v || !c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    v.src = pickSource({
      narrow: window.matchMedia('(max-width: 767px)').matches,
      webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
    });
    v.muted = true;
    v.load();
    Promise.resolve(v.play()).catch(() => {});

    const ctx = c.getContext('2d');
    if (!ctx) return;
    c.width = BEAM_W;
    c.height = Math.round(BEAM_W / MARK_ASPECT);
    const paths = markPaths(0, 0, BEAM_W);
    const crimson = getComputedStyle(document.documentElement).getPropertyValue('--color-crimson').trim() || '#ab5261';
    const poster = new Image();
    poster.src = POSTER;
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const live = v.readyState >= 2 && !v.paused;
      const src: CanvasImageSource = live ? v : poster;
      const sw0 = live ? v.videoWidth : poster.naturalWidth;
      const sh0 = live ? v.videoHeight : poster.naturalHeight;
      if (!sw0) return;
      const W = c.width;
      const H = c.height;
      const va = sw0 / sh0;
      let sw = sw0;
      let sh = sh0;
      if (va > MARK_ASPECT) sw = sh0 * MARK_ASPECT;
      else sh = sw0 / MARK_ASPECT;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      // Mirrored: the light on the floor is the window upside down.
      ctx.translate(0, H);
      ctx.scale(1, -1);
      ctx.save();
      ctx.clip(paths.letters);
      // The light is a little warmer and brighter than the window: done here, on the drawn frame only.
      ctx.filter = 'saturate(1.2) brightness(1.25)';
      ctx.drawImage(src, (sw0 - sw) / 2, (sh0 - sh) / 2, sw, sh, 0, 0, W, H);
      ctx.restore();
      ctx.fillStyle = crimson;
      ctx.fill(paths.accents);
      ctx.restore();
      // The fade down the floor, in the canvas (a CSS mask with the blur and the transform
      // had Chrome painting the transparent box grey): the top row is nearest the window.
      const fade = ctx.createLinearGradient(0, 0, 0, H);
      fade.addColorStop(0, 'rgba(0,0,0,1)');
      fade.addColorStop(0.45, 'rgba(0,0,0,0.55)');
      fade.addColorStop(0.92, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    };
    raf = requestAnimationFrame(draw);

    // The pointer: the film behind the window, and the beam, shift a little with it.
    const onMove = (e: PointerEvent) => {
      r.style.setProperty('--px', ((e.clientX / innerWidth) - 0.5).toFixed(3));
      r.style.setProperty('--py', ((e.clientY / innerHeight) - 0.5).toFixed(3));
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
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.scene}>
        <div className={styles.stage}>
          <div className={styles.window} aria-hidden="true">
            <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline />
          </div>
          <svg className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
            <defs>
              {/* No <g> in a clipPath (SVG allows only shapes, paths, text and use): the box mapping goes on each path. */}
              <clipPath id="lyset-letters" clipPathUnits="objectBoundingBox">
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
          <canvas ref={beam} className={styles.beam} aria-hidden="true" />
        </div>
      </div>
      <Band className={styles.band} title={(t) => <span className={styles.sweep}>{t}</span>} />
    </section>
  );
}
