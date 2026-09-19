'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { MARK_ACCENTS, MARK_LETTERS, MARK_VIEWBOX } from '@/components/home/mark';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { pickSource } from '@/lib/media';
import { drawMark } from './markCanvas';
import styles from './speilet.module.css';

const POSTER = '/media/iqra-poster.jpg';
/** The composite's width: the reflection is drawn from a third-size frame, which is its softness. */
const OFF_W = 480;
/** How much of the sky the water reflects: the lower part, nearest the line, compressed. */
const REFLECT = 0.85;

/**
 * 3 Speilet: the film across the upper part of the screen, a waterline, and under it the
 * film's reflection — the frame and the white name drawn flipped into a canvas in slices,
 * each slice pushed sideways by two slow sines that deepen with the depth, and the whole
 * sunk into the site's navy towards the foot, where the copy stands in white and the sea
 * begins. Every frame the video and the mark are composited once at a third of the width
 * (`drawMark`), and the reflection is read from that: the soft image is the upscale.
 * Under reduced motion the poster stands in the sky and its reflection is drawn once.
 */
export function Speilet() {
  const sky = useRef<HTMLDivElement>(null);
  const mark = useRef<SVGSVGElement>(null);
  const water = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    const s = sky.current;
    const m = mark.current;
    const c = water.current;
    if (!v || !s || !m || !c) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      v.src = pickSource({
        narrow: window.matchMedia('(max-width: 767px)').matches,
        webm: v.canPlayType('video/webm; codecs="vp9"') !== '',
      });
      v.muted = true;
      v.load();
      Promise.resolve(v.play()).catch(() => {});
    }
    const ctx = c.getContext('2d');
    const off = document.createElement('canvas');
    const octx = off.getContext('2d');
    if (!ctx || !octx) return;
    const poster = new Image();
    poster.src = POSTER;
    const navy = getComputedStyle(document.documentElement).getPropertyValue('--color-navy').trim() || '#2c394b';
    const crimson = getComputedStyle(document.documentElement).getPropertyValue('--color-crimson').trim() || '#ab5261';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    const t0 = performance.now();

    const size = () => {
      const sr = s.getBoundingClientRect();
      const wr = c.getBoundingClientRect();
      c.width = Math.round(wr.width * dpr);
      c.height = Math.round(wr.height * dpr);
      off.width = OFF_W;
      off.height = Math.round((OFF_W * sr.height) / sr.width);
    };

    const frame = (now: number) => {
      raf = 0;
      const live = !reduced && v.readyState >= 2 && !v.paused;
      const src: HTMLVideoElement | HTMLImageElement = live ? v : poster;
      const sw = live ? v.videoWidth : poster.naturalWidth;
      const sh = live ? v.videoHeight : poster.naturalHeight;
      if (!sw || !sh) {
        if (!reduced) raf = requestAnimationFrame(frame);
        return;
      }
      const W = off.width;
      const H = off.height;
      // The sky's cover crop of the frame, and the white name where the SVG stands.
      const k = Math.max(W / sw, H / sh);
      const cw = W / k;
      const ch = H / k;
      octx.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, W, H);
      const sr = s.getBoundingClientRect();
      const mr = m.getBoundingClientRect();
      const q = W / sr.width;
      drawMark(octx, (mr.left - sr.left) * q, (mr.top - sr.top) * q, mr.width * q, '#ffffff', crimson);
      // The reflection: the composite flipped, in slices, each pushed sideways by the water.
      const RW = c.width;
      const RH = c.height;
      const hs = Math.max(1, Math.round(2 * dpr));
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, RW, RH);
      for (let y = 0; y < RH; y += hs) {
        const f = y / RH;
        const srcY = Math.min(H - 1, Math.max(0, (H - 1) - f * (H - 1) * REFLECT));
        const amp = (1.2 + 9 * f) * dpr;
        const dx = amp * (Math.sin(f * 26 + t * 1.7) * 0.6 + Math.sin(f * 59 - t * 2.6) * 0.4);
        ctx.drawImage(off, 0, srcY, W, 1, dx, y, RW, hs + 1);
      }
      const g = ctx.createLinearGradient(0, 0, 0, RH);
      g.addColorStop(0, `${navy}30`);
      g.addColorStop(0.42, `${navy}a8`);
      g.addColorStop(0.75, `${navy}ee`);
      g.addColorStop(1, navy);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, RW, RH);
      if (!reduced) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      size();
      if (!raf) raf = requestAnimationFrame(frame);
    };
    poster.addEventListener('load', start, { once: true });
    if (poster.complete) start();
    const onResize = () => {
      size();
      if (reduced && !raf) raf = requestAnimationFrame(frame);
    };
    addEventListener('resize', onResize);
    return () => {
      removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      v.pause();
    };
  }, []);

  return (
    <section className={styles.hero} aria-labelledby="hovedtekst">
      <div ref={sky} className={styles.sky}>
        <video ref={video} className={styles.film} poster={POSTER} preload="metadata" muted loop playsInline aria-hidden="true" />
        <svg ref={mark} className={styles.mark} viewBox={MARK_VIEWBOX} role="img" aria-label={site.logoAlt}>
          {MARK_LETTERS.map((p, i) => (
            <path key={i} className={styles.letter} transform={p.transform} d={p.d} />
          ))}
          {MARK_ACCENTS.map((p, i) => (
            <path key={i} className={styles.accent} transform={p.transform} d={p.d} />
          ))}
        </svg>
        <div className={styles.line} aria-hidden="true" />
      </div>
      <div className={styles.water}>
        <canvas ref={water} className={styles.reflection} aria-hidden="true" />
        <div className={styles.copy}>
          <h1 id="hovedtekst" className={styles.title}>{brief.home.headline}</h1>
          <p className={styles.lede}>{brief.home.paragraph}</p>
          <p className={styles.buttons}>
            <Link href={site.cta.work.href} prefetch={false} className={styles.work}>{site.cta.work.label}</Link>
            <Link href={site.cta.support.href} prefetch={false} className={styles.support}>{site.cta.support.label}</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
