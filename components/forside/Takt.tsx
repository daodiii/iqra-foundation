'use client';

import { useEffect } from 'react';
import { WHERE } from '@/lib/smooth';
import { steps, touchSettle, type Beats } from '@/lib/steps';
import { pageTop } from './frame';
import { PARA, WHY } from './Pour';
import { sporStops } from './Spor';

/**
 * The front page's beats (the owner, 2026-11-20: «a way for the scrolling to stop at certain
 * important stuff … you get the full page and then you can scroll fast again … the first thing
 * underneath the hero section, it should be shown»; then: «there are places that don't need any
 * magnet»). Two runs of stops, both choreographed parts rather than reading: the chapter turn after
 * the hero (the hero, the opening paragraph on white, the «Hvorfor vi finnes» poster), and the
 * sideways track of «Dette ønsker vi å skape» (its intro, then each panel whole). Everywhere else
 * the page scrolls freely. The keys also stop at the tops of the sections below.
 *
 * Read live from the page on every move, so it follows resizes and a phone's address bar.
 */
export function readBeats(): Beats {
  const zone: number[] = [0];
  const sc = document.querySelector<HTMLElement>('[data-lag="sc"]');
  const stage = sc?.firstElementChild as HTMLElement | null;
  if (sc && stage?.clientHeight) {
    const top = pageTop(sc);
    zone.push(top + PARA * stage.clientHeight, top + WHY * stage.clientHeight);
  }
  // «Dette ønsker vi å skape», the sideways track: a choreographed part, so carried inside it, one
  // panel a swipe, each standing whole; free on either side of it
  const spor = document.querySelector<HTMLElement>('[data-spor]');
  const track = spor ? sporStops(spor) : [];
  const marks = ['#handling', '#aktuelt', '#sammen'].flatMap((s) => {
    const el = document.querySelector<HTMLElement>(s);
    return el ? [pageTop(el)] : [];
  });
  return { zones: [zone, track], marks };
}

/** Starts the beats: carried by the glide on a laptop (lib/steps.ts), settled after a swipe on a phone. Renders nothing. */
export function Takt() {
  useEffect(() => {
    let stop = steps(readBeats);
    let raf = 0;
    // the glide comes and goes with the device (a laptop turned tablet, motion turned off): follow it
    const where = window.matchMedia(WHERE);
    const follow = () => {
      stop();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => (stop = steps(readBeats)));
    };
    where.addEventListener('change', follow);
    const stopTouch = touchSettle(() => readBeats().zones);
    return () => {
      where.removeEventListener('change', follow);
      cancelAnimationFrame(raf);
      stop();
      stopTouch();
    };
  }, []);
  return null;
}
