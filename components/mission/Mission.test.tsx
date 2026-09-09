import { render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Mission } from './Mission';

/** There is no auto-cleanup configured, so every query is scoped to its own render. */
const mount = () => {
  const { container } = render(<Mission />);
  return container.querySelector('#misjon') as HTMLElement;
};

const stanzaEls = (section: HTMLElement) =>
  section.querySelectorAll('p[data-rise]:not([id])');

test('label, the mission copy and the call to action come from the content file', () => {
  const section = mount();
  expect(section).toHaveAttribute('aria-labelledby', 'misjon-label');
  expect(within(section).getByText(site.mission.label)).toHaveAttribute('id', 'misjon-label');
  expect(within(section).getByText(/bygger vi broer/)).toBeInTheDocument();
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
 * The ink is decoration and nothing else, so it must not reach the accessibility tree. The
 * canvas carries no label of its own; what hides it is the box around it, so this asserts
 * on that ancestor rather than on the canvas element.
 */
test('the ink is decorative and the section carries no photograph', () => {
  const section = mount();
  const canvas = section.querySelector('canvas');
  expect(canvas).not.toBeNull();
  expect(canvas!.closest('[aria-hidden="true"]')).not.toBeNull();
  expect(section.querySelector('img')).toBeNull();
  expect(section.querySelector('picture')).toBeNull();
});

/**
 * jsdom has no WebGL, so `createInk` declines here exactly as it does on a device without
 * it. The section still has to render its words: this is the fallback path, and without
 * this it would only ever be exercised on somebody else's hardware.
 */
test('the copy renders even though the ink cannot start', () => {
  const section = mount();
  expect(within(section).getByText(/bygger vi broer/)).toBeInTheDocument();
  expect(within(section).getByRole('link', { name: site.hero.cta })).toBeInTheDocument();
});
