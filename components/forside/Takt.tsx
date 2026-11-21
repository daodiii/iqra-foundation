'use client';

import { useEffect, useLayoutEffect } from 'react';
import { WHERE } from '@/lib/smooth';
import { clean, steps, touchSettle, type Beats } from '@/lib/steps';
import { pageTop, plainPour } from './frame';
import f from './forside.module.css';
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
  const plainMarks: number[] = [];
  const sc = document.querySelector<HTMLElement>('[data-lag="sc"]');
  const stage = sc?.firstElementChild as HTMLElement | null;
  if (plainPour()) {
    // plain and open on a phone: the paragraph and the poster are places to stop, nothing is carried
    for (const s of ['[data-pour-tx]', '#hvorfor']) {
      const el = document.querySelector<HTMLElement>(s);
      if (el) plainMarks.push(pageTop(el));
    }
  } else if (sc && stage?.clientHeight) {
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
  // On a laptop the chapter turn runs straight on to the track's start: from the poster one gesture
  // carries to «Dette ønsker vi å skape» (the owner, 2026-11-21: the scroll between them was long; «it
  // should easily just lock to» it). From there on the scroll is free («almost a free scroll»): the
  // panels no longer stop one a gesture, the page only eases to the nearest pair once it comes to
  // rest, so no panel stands cut in half. A phone keeps its track zone.
  if (!plainMarks.length && track.length) return { zones: [[...zone, track[0]]], marks, soft: track };
  return { zones: [plainMarks.length ? [] : zone, track], marks: [...plainMarks, ...marks] };
}

/** Where a phone uses the browser's own snapping (its momentum is the browser's, so only the browser can stop it). */
export const PHONE_SNAP = '(pointer: coarse) and (prefers-reduced-motion: no-preference)';

/** Every place a phone's fling may not pass: the beats of both carried parts and the tops of the sections, merged and sorted. */
export function snapPoints(b: Beats, max: number): number[] {
  return clean([...b.zones.flat(), ...b.marks], max);
}

/**
 * On a phone, the fling after a swipe is the browser's own momentum: a long one used to carry from
 * the hero down to «Aktuelt», past half the page (the owner, 2026-11-20: «if you take a long scroll,
 * you go down to news and you miss the entire page almost»). The browser's scroll snapping is the one
 * thing that acts on that momentum: each point below is a snap point a fling cannot pass
 * (scroll-snap-stop: always). Mandatory snapping, because proximity lets a fling through (measured in
 * Chrome, 2026-11-20: a 5000 px throw passed every point with proximity, stopped at the first with
 * mandatory). So that the reader can still rest anywhere inside a section, each section is a snap
 * area too (forside.module.css): an area taller than the screen counts as snapped wherever it covers
 * the screen. One empty marker per point, laid out again whenever the page's size changes.
 */
function phoneSnaps(): () => void {
  const mq = window.matchMedia(PHONE_SNAP);
  if (!mq.matches) return () => {};
  const root = document.documentElement;
  const layer = document.createElement('div');
  layer.className = f.snaps;
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  root.style.scrollSnapType = 'y mandatory';
  // the site keeps room for its header when a link jumps to a heading (scroll-padding); a snap point
  // here is a scroll position itself, so it must not be pushed down by that room
  const pad = root.style.scrollPaddingTop;
  root.style.scrollPaddingTop = '0px';
  root.dataset.snapPhone = '';
  let raf = 0;
  const lay = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const ys = snapPoints(readBeats(), root.scrollHeight - window.innerHeight);
      while (layer.children.length > ys.length) layer.lastChild?.remove();
      while (layer.children.length < ys.length) layer.appendChild(document.createElement('i'));
      ys.forEach((y, i) => ((layer.children[i] as HTMLElement).style.top = `${y}px`));
    });
  };
  lay();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(lay) : null;
  ro?.observe(document.body);
  document.fonts?.ready.then(lay);
  return () => {
    cancelAnimationFrame(raf);
    ro?.disconnect();
    root.style.scrollSnapType = '';
    root.style.scrollPaddingTop = pad;
    delete root.dataset.snapPhone;
    layer.remove();
  };
}

/** Starts the beats: carried by the glide on a laptop (lib/steps.ts); on a phone, snap points a fling cannot pass and a settle after a swipe. Renders nothing. */
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
  // The phone's snapping is on the whole document, so it must go with the page itself: a layout
  // effect's cleanup runs as the front page leaves, before the next page scrolls to its top. In a
  // plain effect it stayed on a moment longer and snapped that scroll to one of the front page's
  // points, so every link from the front page opened the next page 650 to 950 px down (2026-11-21).
  useLayoutEffect(() => phoneSnaps(), []);
  return null;
}
