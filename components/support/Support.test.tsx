import { render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Support } from './Support';

const s = site.support;

/** There is no auto-cleanup configured per file, so every query is scoped to its render. */
const mount = () => {
  const { container } = render(<Support />);
  return container.querySelector('#stott-oss') as HTMLElement;
};

test('the section is labelled by its own label', () => {
  const section = mount();
  expect(section).toHaveAttribute('aria-labelledby', 'stott-label');
  expect(within(section).getByText(s.label)).toHaveAttribute('id', 'stott-label');
});

/** The user's own question, and the one heading in the section. */
test('the title is the question, as one heading', () => {
  const section = mount();
  const headings = within(section).getAllByRole('heading');
  expect(headings).toHaveLength(1);
  expect(headings[0]).toHaveTextContent(s.title);
});

/**
 * The section says one thing: here is the Vipps number. It is the answer to the question
 * above it, so it is on screen with its name, and nothing has to be opened to reach it.
 */
test('the Vipps number is on screen with its name', () => {
  const section = mount();
  expect(within(section).getByText(s.vipps.value)).toBeInTheDocument();
  expect(within(section).getByText(s.vipps.label)).toBeInTheDocument();
});

test('the other ways to give are one sentence under the number', () => {
  const section = mount();
  expect(within(section).getByText(s.also)).toBeInTheDocument();
});

/**
 * There is no amount picker, no card and no QR any more: the picker was the one control on
 * the page that led nowhere, because nothing is wired to a payment. This is here because
 * "the amount picker" is the thing most likely to come back, and it would put the section
 * back where it started — a checkout with nothing behind it.
 */
test('nothing in the section is a control', () => {
  const section = mount();
  expect(within(section).queryAllByRole('button')).toHaveLength(0);
  expect(within(section).queryAllByRole('group')).toHaveLength(0);
  expect(section.querySelector('[data-amount]')).toBeNull();
  expect(section.querySelector('[data-water-card]')).toBeNull();
});

/**
 * One box, two frames. The green water is the box; on it two squares drawn with the tree's
 * pen, «Støtt oss» on the first line and «Kort» on the second.
 */
test('the section is the green water and two frames, their labels on the line', () => {
  const section = mount();
  expect(section.querySelectorAll('canvas[data-water]')).toHaveLength(1);
  expect(section.querySelectorAll('canvas[data-frame-canvas]')).toHaveLength(2);
  const legends = [...section.querySelectorAll('[data-legend]')].map((l) => l.textContent);
  expect(legends).toEqual([s.label, s.card.label]);
});

/**
 * The card square is a picture of a form — «just for the visuals» (2026-09-12). Every field
 * is a drawn box and the pay button is a span, so a screen reader is not offered a form that
 * goes nowhere: the drawing is hidden from it, and what it gets instead is the one honest
 * line under the form, which says card payment is not connected yet.
 */
test('the card square shows the fields and the amount, and none of it is a control', () => {
  const section = mount();
  const c = s.card;
  for (const text of [c.amount, c.number, c.expiry, c.cvc, c.name]) {
    expect(within(section).getByText(text)).toBeInTheDocument();
  }
  expect(within(section).getByText(`${c.pay} ${c.tiers[c.preselect]} ${c.unit}`)).toBeInTheDocument();
  expect(section.querySelectorAll('input, button, select, textarea, a')).toHaveLength(0);
});

test('the drawn form is hidden from assistive tech; the notice is not', () => {
  const section = mount();
  const drawing = section.querySelector('[data-card-form]') as HTMLElement;
  expect(drawing).toHaveAttribute('aria-hidden', 'true');
  const notice = within(section).getByText(s.card.notice);
  expect(notice.closest('[aria-hidden="true"]')).toBeNull();
});

/**
 * The copy starts transparent and is revealed by a trigger. It must stay in the
 * accessibility tree while it waits, so this asserts the reveal never reaches for
 * `visibility` — `autoAlpha` would hide the number from a screen reader until a scroll
 * event that may never come.
 */
test('the section is only ever transparent, never visibility:hidden', () => {
  const section = mount();
  section.querySelectorAll<HTMLElement>('[data-rise]').forEach((el) => {
    expect(el.style.visibility).not.toBe('hidden');
  });
});

/**
 * jsdom has no WebGL, so the water declines here exactly as it does on a device without it.
 * Everything that matters still has to render: this is the fallback path, and otherwise it
 * would only ever be exercised on somebody else's hardware.
 */
test('the whole section renders even though the water cannot start', () => {
  const section = mount();
  expect(within(section).getByRole('heading')).toHaveTextContent(s.title);
  expect(within(section).getByText(s.vipps.value)).toBeInTheDocument();
});
