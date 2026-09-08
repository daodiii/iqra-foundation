import { fireEvent, render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Support } from './Support';

const support = site.support;

const mount = () => {
  const { container } = render(<Support />);
  return container.querySelector('#stott-oss') as HTMLElement;
};

/** By the group rather than by their labels: the amounts are formatted with a
 *  non-breaking space, which is exactly the kind of thing a name matcher gets wrong. */
const tierButtons = (section: HTMLElement) =>
  within(section).getByRole('group', { name: support.amountLabel }).querySelectorAll('button');

const freq = (section: HTMLElement, name: string) =>
  within(section).getByRole('button', { name });

test('the label, the amount and what it buys all come from the content file', () => {
  const section = mount();
  expect(section).toHaveAttribute('aria-labelledby', 'stott-label');
  expect(within(section).getByText(support.label)).toHaveAttribute('id', 'stott-label');
  expect(section.querySelector('[data-amount]')).toHaveTextContent(`250 ${support.unit.once}`);
  expect(section.querySelector('[data-outcome]')).toHaveTextContent(support.tiers[1].once);
});

test('choosing an amount changes the figure, and only one amount is chosen at a time', () => {
  const section = mount();
  const tiers = tierButtons(section);
  expect(tiers).toHaveLength(support.tiers.length);

  fireEvent.click(tiers[4]);
  expect(section.querySelector('[data-amount]')).toHaveTextContent('2 500');
  expect(section.querySelector('[data-outcome]')).toHaveTextContent(support.tiers[4].once);
  expect(tiers[4]).toHaveAttribute('aria-pressed', 'true');
  expect(tiers[1]).toHaveAttribute('aria-pressed', 'false');
});

/**
 * The whole point of the section. AvtaleGiro is the recurring mechanism and a plain
 * transfer is the one-off one, so the second route is not a third button but the same
 * one saying something else. If this ever stops swapping, the page is offering the wrong
 * mechanism to half the people who read it, and it will look perfectly fine doing so.
 */
test('the second way to pay follows the frequency', () => {
  const section = mount();
  expect(freq(section, support.alt.once)).toBeInTheDocument();
  expect(within(section).getByText(support.transfer.title)).toBeInTheDocument();
  expect(within(section).getByText(support.vippsNumber)).toBeInTheDocument();
  expect(within(section).queryByText(support.avtalegiro.title)).toBeNull();

  fireEvent.click(freq(section, support.frequency.month));

  expect(freq(section, support.alt.month)).toBeInTheDocument();
  expect(within(section).getByText(support.avtalegiro.title)).toBeInTheDocument();
  expect(within(section).getByText(support.kid)).toBeInTheDocument();
  expect(within(section).queryByText(support.transfer.title)).toBeNull();
  expect(within(section).queryByText(support.vippsNumber)).toBeNull();
});

test('the frequency also changes the unit and what the amount buys', () => {
  const section = mount();
  fireEvent.click(freq(section, support.frequency.month));
  expect(section.querySelector('[data-amount]')).toHaveTextContent(`250 ${support.unit.month}`);
  expect(section.querySelector('[data-outcome]')).toHaveTextContent(support.tiers[1].month);
});

test('the Vipps sentence has the amount put into it, and nothing left over', () => {
  const section = mount();
  const button = within(section).getByRole('button', { name: /Vipps/ });
  expect(button).toHaveTextContent('Gi 250 kr med Vipps');
  expect(button.textContent).not.toContain('{');

  fireEvent.click(freq(section, support.frequency.month));
  expect(within(section).getByRole('button', { name: /Vipps/ }))
    .toHaveTextContent('Gi 250 kr i måneden med Vipps');
});

test('the account details are shut until asked for, and say so', () => {
  const section = mount();
  const alt = freq(section, support.alt.once);
  const panel = section.querySelector('#stott-detaljer');
  expect(alt).toHaveAttribute('aria-controls', 'stott-detaljer');
  expect(alt).toHaveAttribute('aria-expanded', 'false');
  expect(panel).toHaveAttribute('data-open', 'false');

  fireEvent.click(alt);
  expect(alt).toHaveAttribute('aria-expanded', 'true');
  expect(panel).toHaveAttribute('data-open', 'true');
});

/**
 * These four are the reason the production build can still refuse this page. They have
 * to reach the DOM as the bracketed tokens rather than be quietly formatted into
 * something else, because the gate reads the content file and a human reads the page,
 * and the two are only the same check if what ships is what was checked.
 */
test('the numbers nobody has supplied yet render as the placeholders', () => {
  const section = mount();
  for (const value of [support.account, support.vippsNumber, support.orgnr]) {
    expect(within(section).getAllByText(value).length).toBeGreaterThan(0);
  }
  expect(section.querySelector('[data-outcome]')?.textContent).toMatch(/^\[.+\]$/);
});

/**
 * The section is revealed by a scroll trigger, and every control on it is interactive.
 * `autoAlpha` would add visibility:hidden and take the amount, the toggle and the button
 * out of the accessibility tree until a scroll event that may never come.
 */
test('the section is only ever transparent, never visibility:hidden', () => {
  const section = mount();
  section.querySelectorAll<HTMLElement>('[data-rise]').forEach((el) => {
    expect(el.style.visibility).not.toBe('hidden');
  });
});

test('the field is decorative', () => {
  const section = mount();
  expect(section.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
});
