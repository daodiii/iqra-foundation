import { render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import wash from '@/components/wash.module.css';
import { site } from '@/content/site.no';
import { Mission } from './Mission';

/** There is no auto-cleanup configured, so every query is scoped to its own render. */
const mount = () => {
  const { container } = render(<Mission />);
  return container.querySelector('#misjon') as HTMLElement;
};

const stanzaEls = (section: HTMLElement) =>
  section.querySelectorAll('p[data-rise]:not([id])');

const lastLine = site.mission.stanzas[site.mission.stanzas.length - 1].at(-1)!.replace(/\.$/, '');

test('label, the mission copy and the call to action come from the content file', () => {
  const section = mount();
  expect(section).toHaveAttribute('aria-labelledby', 'misjon-label');
  expect(within(section).getByText(site.mission.label)).toHaveAttribute('id', 'misjon-label');
  expect(within(section.querySelector('[data-mission-text]')!).getByText(lastLine)).toBeInTheDocument();
  expect(within(section).getByRole('link', { name: site.hero.cta }))
    .toHaveAttribute('href', `mailto:${site.contact.email}`);
});

/**
 * The breaks are chosen in the content file, so the markup has to keep one element per
 * hand-set line. If a change ever collapses a stanza back into flowing text the browser
 * decides where the lines fall, which is the thing this setting exists to prevent.
 */
test('every stanza renders, one element per hand-set line', () => {
  const section = mount();
  const els = stanzaEls(section);
  expect(els).toHaveLength(site.mission.stanzas.length);
  site.mission.stanzas.forEach((lines, i) => {
    expect(els[i].childElementCount).toBe(lines.length);
  });
});

test('the last full stop is its own element, so it can be crimson', () => {
  const section = mount();
  const els = stanzaEls(section);
  const last = els[els.length - 1];
  const lines = site.mission.stanzas[site.mission.stanzas.length - 1];
  expect(last.textContent).toBe(lines.join(''));
  expect(last.lastElementChild?.lastElementChild?.textContent).toBe('.');
});

/**
 * The copy starts transparent and is revealed by a trigger. It must stay in the
 * accessibility tree while it waits, so this asserts the reveal never reaches for
 * `visibility` — `autoAlpha` would hide the call to action from a screen reader
 * until a scroll event that may never come.
 */
test('the copy is only ever transparent, never visibility:hidden', () => {
  const section = mount();
  section.querySelectorAll<HTMLElement>('[data-rise]').forEach((el) => {
    expect(el.style.visibility).not.toBe('hidden');
  });
});

/**
 * The wall: the words in the other boxes are the content file's, so the real ones drop in
 * there and nowhere else — and none of them is a bracketed placeholder, so the production
 * gate has nothing to refuse while they are stand-ins.
 */
test('the wall’s boxes and the film’s caption come from the content file', () => {
  const section = mount();
  const { wall } = site.mission;
  const q = within(section);
  expect(q.getByText(site.vision.label)).toBeInTheDocument();
  const vis = within(section.querySelector('[data-tile="vis"]')!);
  site.vision.lines.forEach((line) => expect(vis.getByText(line)).toBeInTheDocument());
  expect(vis.getByText(site.vision.sub)).toBeInTheDocument();
  expect(q.getByText(wall.question.label)).toBeInTheDocument();
  expect(q.getByText(wall.question.q)).toBeInTheDocument();
  expect(q.getByText(wall.question.a)).toBeInTheDocument();
  expect(q.getByText(wall.how.label)).toBeInTheDocument();
  wall.how.items.forEach((item) => expect(q.getByText(item)).toBeInTheDocument());
  expect(q.getByText(wall.contact.label)).toBeInTheDocument();
  expect(q.getByText(wall.contact.line)).toBeInTheDocument();
  expect(q.getByText(wall.film.title)).toBeInTheDocument();
  expect(q.getByText(wall.film.line)).toBeInTheDocument();
  expect(section.textContent).not.toMatch(/\[[^\]]+\]/);
});

/**
 * Every box on the wall is the same thing the mission's box is: a line drawn with the
 * tree's pen and a legend standing on it. Five boxes, five lines, five legends — the
 * mission's is the one that labels the section.
 */
test('every box carries a frame canvas and a legend on the line', () => {
  const section = mount();
  const boxes = section.querySelectorAll('[data-frame]');
  expect(boxes).toHaveLength(5);
  boxes.forEach((box) => {
    expect(box.querySelector('canvas[data-frame-canvas]')).toHaveAttribute('aria-hidden', 'true');
    expect(box.querySelector('[data-legend]')).not.toBeNull();
  });
  expect(section.querySelectorAll('[data-legend][id="misjon-label"]')).toHaveLength(1);
});

/**
 * The film: muted and inline or it may not start itself; no loop and no autoplay, because
 * it is written once, on arrival, and stays; the webm listed first, because a Chromium
 * without proprietary codecs (Playwright’s) plays nothing else and the first source that
 * plays wins; and a description, because the word it writes is not in the DOM.
 */
test('the film is muted, inline, unlooped, webm first, and described', () => {
  const section = mount();
  const video = section.querySelector('video') as HTMLVideoElement;
  expect(video).not.toBeNull();
  expect(video.muted).toBe(true);
  expect(video).toHaveAttribute('playsinline');
  expect(video).not.toHaveAttribute('loop');
  expect(video).not.toHaveAttribute('autoplay');
  expect(video).toHaveAttribute('aria-label', site.mission.wall.film.alt);
  const sources = Array.from(video.querySelectorAll('source')).map((s) => s.type);
  expect(sources).toEqual(['video/webm', 'video/mp4']);
});

/**
 * The ink is decoration and nothing else, so it must not reach the accessibility tree. The
 * canvas carries no label of its own; what hides it is the box around it, so this asserts
 * on that ancestor rather than on the canvas element. One box, the cream — Misjon's own
 * scene, which `sections.spec.ts` reads the section's ink canvas for — and no photograph:
 * the film is the picture.
 */
test('the ink is the cream box behind everything, decorative, and there is no photograph', () => {
  const section = mount();
  const inks = section.querySelectorAll<HTMLCanvasElement>('canvas[data-ink]');
  expect(inks).toHaveLength(1);
  expect(inks[0].parentElement).toHaveClass(wash.box, wash.mosque);
  expect(inks[0].closest('[aria-hidden="true"]')).not.toBeNull();
  expect(section.querySelector('img')).toBeNull();
  expect(section.querySelector('picture')).toBeNull();
});

/**
 * jsdom has no WebGL, so `createInk` declines here exactly as it does on a device without
 * it; and it has no media pipeline, so the film never plays. The section still has to
 * render its words: this is the fallback path, and without this it would only ever be
 * exercised on somebody else's hardware.
 */
test('the copy renders even though the ink cannot start and the film cannot play', () => {
  const section = mount();
  expect(within(section.querySelector('[data-mission-text]')!).getByText(lastLine)).toBeInTheDocument();
  expect(within(section).getByRole('link', { name: site.hero.cta })).toBeInTheDocument();
});

/**
 * The mission's box is a line drawn with the tree's pen: «Misjon» is the legend on the
 * line, the button sits in a seat over the bottom edge, and there is no rule between the
 * stanzas and the button — the frame is the line.
 */
test('the label is the legend, the button sits in a seat, and there is no rule', () => {
  const section = mount();
  const card = section.querySelector('[data-mission-text]') as HTMLElement;
  expect(card.querySelector('canvas[data-frame-canvas]')).toHaveAttribute('aria-hidden', 'true');
  expect(card.querySelector('[data-legend]')).toHaveAttribute('id', 'misjon-label');
  expect(card.querySelector('[data-rule]')).toBeNull();
  const link = within(card).getByRole('link', { name: site.hero.cta });
  expect(link.parentElement).toHaveAttribute('data-seat');
});
