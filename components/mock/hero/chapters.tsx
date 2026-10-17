'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { brief } from '@/content/brief.no';

/**
 * MOCK (hero round, 2026-10-16): the four areas as the film's chapters. The film's own shots,
 * cut at its cuts and slowed to 0.45 with motion interpolation (public/mock/hero, ffmpeg
 * minterpolate, ~1.9 s each): the scholar at his desk is Kunnskap, the young circle under the
 * windows Samfunnsdeltakelse, the ring in the light Dialog, the courtyard Møteplasser. The
 * handshake is left out.
 */
const SHOT: Record<string, string> = {
  kunnskap: 'kunnskap',
  samfunnsdeltakelse: 'samfunnsdeltakelse',
  dialog: 'dialog',
  moteplasser: 'moteplasser',
};

export type Chapter = { key: string; name: string; src: string };

const byKey = (key: string): Chapter => {
  const a = brief.areas.find((x) => x.key === key)!;
  return { key, name: a.name, src: `/mock/hero/${SHOT[key]}` };
};

/** The home page's order (the sea's and the thread's). */
export const HOME_ORDER = ['kunnskap', 'samfunnsdeltakelse', 'dialog', 'moteplasser'].map(byKey);
/** The brief's headline's order. */
export const HEADLINE_ORDER = ['kunnskap', 'dialog', 'moteplasser', 'samfunnsdeltakelse'].map(byKey);

/** After a shot has played, it rests on its last frame this long before the next comes in. */
const HOLD = 900;

/**
 * Runs the chapters once from `startAt` ms after mount (each shot, its rest, the next), then rests
 * on the last; a choice stops the run and plays that one shot, then rests. Each chapter's progress
 * (0–1) is written as `--p` on the elements registered with `bar(i)`. Under reduced motion nothing
 * plays: the posters stand, a choice changes the poster.
 */
export function useChapters(chapters: Chapter[], startAt: number) {
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const bars = useRef<(HTMLElement | null)[][]>(chapters.map(() => []));
  const auto = useRef(true);
  const current = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const reduced = useRef(false);

  const play = useCallback((i: number) => {
    current.current = i;
    setActive(i);
    window.clearTimeout(timer.current);
    vids.current.forEach((v, k) => {
      if (v && k !== i) v.pause();
    });
    const v = vids.current[i];
    if (!v || reduced.current) return;
    v.currentTime = 0;
    Promise.resolve(v.play()).catch(() => {});
  }, []);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const webm = document.createElement('video').canPlayType('video/webm; codecs="vp9"') !== '';
    const offs: (() => void)[] = [];
    vids.current.forEach((v, k) => {
      if (!v || reduced.current) return;
      v.muted = true;
      v.src = `${chapters[k].src}.${webm ? 'webm' : 'mp4'}`;
      v.preload = 'auto';
      v.load();
      const ended = () => {
        if (!auto.current || current.current !== k) return;
        if (k < chapters.length - 1) timer.current = window.setTimeout(() => play(k + 1), HOLD);
        else auto.current = false;
      };
      v.addEventListener('ended', ended);
      offs.push(() => v.removeEventListener('ended', ended));
    });
    const start = window.setTimeout(() => {
      setStarted(true);
      play(0);
    }, reduced.current ? 0 : startAt);
    let raf = 0;
    const tick = () => {
      const a = current.current;
      chapters.forEach((_, k) => {
        let p = 0;
        if (k === a) {
          const v = vids.current[k];
          p = reduced.current ? 1 : v && v.duration ? Math.min(1, v.currentTime / v.duration) : 0;
        } else if (auto.current && k < a) p = 1;
        bars.current[k].forEach((el) => el?.style.setProperty('--p', p.toFixed(4)));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(timer.current);
      cancelAnimationFrame(raf);
      offs.forEach((f) => f());
    };
  }, [chapters, play, startAt]);

  const choose = useCallback((i: number) => {
    auto.current = false;
    setStarted(true);
    play(i);
  }, [play]);

  /** Register an element that shows chapter i's progress. */
  const bar = useCallback((i: number) => (el: HTMLElement | null) => {
    const list = bars.current[i];
    if (el && !list.includes(el)) list.push(el);
  }, []);

  const video = useCallback((i: number) => (el: HTMLVideoElement | null) => {
    vids.current[i] = el;
  }, []);

  return { active, started, choose, bar, video };
}

/** The chapters' shots stacked, the active one on top; crossfaded. */
export function ChapterFilm({
  chapters,
  active,
  video,
  className,
  style,
}: {
  chapters: Chapter[];
  active: number;
  video: (i: number) => (el: HTMLVideoElement | null) => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className} style={style} aria-hidden="true">
      {chapters.map((c, i) => (
        <video
          key={c.key}
          ref={video(i)}
          poster={`${c.src}.webp`}
          muted
          playsInline
          preload="none"
          data-on={i === active ? '' : undefined}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: i === active ? 1 : 0,
            transition: 'opacity 700ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      ))}
    </div>
  );
}
