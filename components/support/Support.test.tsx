import { fireEvent, render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { film } from '@/lib/film';
import { Support } from './Support';

const s = site.support;

/** U+00A0. Named, so it cannot be mistaken for an ordinary space and 'fixed' into a
 *  failing test by an editor or a careless hand. */
const NBSP = '\u00a0';

/** There is no auto-cleanup configured per file, so every query is scoped to its render. */
const mount = () => {
  const { container } = render(<Support />);
  return container.querySelector('#stott-oss') as HTMLElement;
};

const tierButtons = (section: HTMLElement) =>
  within(section).getByRole('group', { name: s.giver.amountLabel }).querySelectorAll('button');

test('the section is labelled by its own label', () => {
  const section = mount();
  expect(section).toHaveAttribute('aria-labelledby', 'stott-label');
  expect(within(section).getByText(s.label)).toHaveAttribute('id', 'stott-label');
});

/**
 * The heading is measured and scaled at runtime, so each line has to be its own element for
 * there to be anything to measure. Collapsing them into one string would leave the fit
 * measuring the whole paragraph and sizing the type to a fraction of what it should be.
 */
test('the title renders one element per hand-set line', () => {
  const section = mount();
  const lines = section.querySelectorAll('[data-title] span');
  expect(lines).toHaveLength(s.title.length);
  s.title.forEach((line, i) => expect(lines[i]).toHaveTextContent(line));
});

/**
 * The three routes are the part of this section that works today: every number on the page
 * is a placeholder and nothing is wired to a payment provider, so a number you copy into
 * your own bank is the only giving that needs nothing built. All three are on screen with
 * nothing to open — there is no disclosure panel here any more.
 */
test('all three ways to give are on screen, with their numbers', () => {
  const section = mount();
  const items = within(section).getByRole('list', { name: s.routesLabel })
    .querySelectorAll(':scope > li');
  expect(items).toHaveLength(s.routes.length);
  s.routes.forEach((route, i) => {
    // Scoped to the route's own item, not the section: «Vipps» is both a route label and
    // the title over the code in the card below, so a section-wide lookup finds two.
    const item = within(items[i] as HTMLElement);
    expect(item.getByText(route.label)).toBeInTheDocument();
    expect(item.getByText(route.value)).toBeInTheDocument();
    expect(item.getByText(route.how)).toBeInTheDocument();
  });
});

/** Imported from the palette, never re-picked here, so the sections cannot drift apart. */
test('each route number carries its own stop of the film palette', () => {
  const section = mount();
  s.routes.forEach((route, i) => {
    expect(within(section).getByText(route.value)).toHaveStyle({ color: film.routes[i] });
  });
});

test('the preselected amount is the one the content file names', () => {
  const section = mount();
  const buttons = tierButtons(section);
  expect(buttons).toHaveLength(s.tiers.length);
  expect(buttons[s.giver.preselect]).toHaveAttribute('aria-pressed', 'true');
  expect(section.querySelector('[data-amount]'))
    .toHaveTextContent(String(s.tiers[s.giver.preselect]));
});

test('choosing an amount changes the figure and moves the pressed state', () => {
  const section = mount();
  const buttons = tierButtons(section);
  const last = buttons.length - 1;
  fireEvent.click(buttons[last]);
  expect(buttons[last]).toHaveAttribute('aria-pressed', 'true');
  expect(buttons[s.giver.preselect]).toHaveAttribute('aria-pressed', 'false');
  // A NON-BREAKING space, written as an escape so it cannot be mistaken for an ordinary
  // one here and silently "fixed" into a failing test. nb-NO groups thousands, and this is
  // grouped by hand rather than by toLocaleString, whose output depends on the ICU data
  // the renderer happens to carry — and this component renders on the server too, where a
  // difference of one space is a hydration mismatch.
  expect(section.querySelector('[data-amount]')?.textContent).toBe(`1${NBSP}000`);
});

/**
 * There is no one-off/monthly toggle any more: the section asks for a standing gift and
 * says so once, in the unit beside the amount. This is here because the toggle is the thing
 * most likely to come back with someone restoring "the amount picker", and it would put the
 * section back where it started.
 */
test('there is no frequency toggle, and the unit carries the meaning instead', () => {
  const section = mount();
  expect(within(section).queryByRole('group', { name: /hvor ofte/i })).toBeNull();
  expect(within(section).getByText(s.giver.unit)).toBeInTheDocument();
});

/**
 * A code Vipps has to issue against a real number. It renders as a visible placeholder like
 * every other number here, and must never become a drawn square: that would be the one
 * placeholder on this site a visitor could actually try, and it would fail in their bank
 * app rather than on the page.
 */
test('the QR is a visible placeholder, not a drawn code', () => {
  const section = mount();
  expect(within(section).getByText(s.qr.value)).toBeInTheDocument();
  expect(section.querySelector('svg')).toBeNull();
  expect(section.querySelector('img')).toBeNull();
});

test('the skattefradrag sentence is present, brackets and all', () => {
  const section = mount();
  expect(within(section).getByText(s.tax)).toBeInTheDocument();
});

/**
 * The copy starts transparent and is revealed by a trigger. It must stay in the
 * accessibility tree while it waits, so this asserts the reveal never reaches for
 * `visibility` — `autoAlpha` would hide the amount and every control from a screen reader
 * until a scroll event that may never come.
 */
test('the section is only ever transparent, never visibility:hidden', () => {
  const section = mount();
  section.querySelectorAll<HTMLElement>('[data-rise]').forEach((el) => {
    expect(el.style.visibility).not.toBe('hidden');
  });
});

/**
 * jsdom has no WebGL, so both simulations decline here exactly as they do on a device
 * without it. Everything that matters still has to render: this is the fallback path, and
 * otherwise it would only ever be exercised on somebody else's hardware.
 */
test('the whole section renders even though neither ink can start', () => {
  const section = mount();
  // The two water canvases, the box's and the night card's; the four frame canvases are the pen's.
  expect(section.querySelectorAll('canvas[data-water], canvas[data-water-card]')).toHaveLength(2);
  expect(within(section).getByText(s.title[0])).toBeInTheDocument();
  expect(tierButtons(section)).toHaveLength(s.tiers.length);
});

/**
 * The box is a line drawn with the tree's pen: the head and the three routes each carry the
 * canvas the pen draws on and their label on the line. The night card is a box in its own
 * right — dark, with its own water — and wears none of it.
 */
test('the head and the three routes are frames with their labels on the line; the night card is not', () => {
  const section = mount();
  expect(section.querySelectorAll('canvas[data-frame-canvas]')).toHaveLength(4);
  const legends = [...section.querySelectorAll('[data-legend]')].map((l) => l.textContent);
  expect(legends).toEqual([s.label, ...s.routes.map((r) => r.label)]);
  const night = section.querySelector('[data-water-card]')!.parentElement!;
  expect(night.querySelector('[data-frame-canvas]')).toBeNull();
});
