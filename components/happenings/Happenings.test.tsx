import { render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Happenings } from './Happenings';

/** There is no auto-cleanup configured, so every query is scoped to its own render. */
const mount = () => {
  const { container } = render(<Happenings />);
  return container.querySelector('#arrangementer') as HTMLElement;
};

test('both columns carry their label and their headline from the content file', () => {
  const section = mount();
  expect(within(section).getByText(site.events.label)).toBeInTheDocument();
  expect(within(section).getByText(site.events.line)).toBeInTheDocument();
  expect(within(section).getByText(site.news.label)).toBeInTheDocument();
  expect(within(section).getByText(site.news.line)).toBeInTheDocument();
});

test('there is one row for every event and every news item', () => {
  const section = mount();
  expect(within(section).getByRole('list', { name: site.events.label }).children)
    .toHaveLength(site.events.items.length);
  expect(within(section).getByRole('list', { name: site.news.label }).children)
    .toHaveLength(site.news.items.length);
});

/** The day and the month are a date column, not a sentence: they have to stay two elements
 *  so the number can be set large and the month small under it. */
test('an event row keeps its day and month as separate elements', () => {
  const section = mount();
  const first = within(section).getByRole('list', { name: site.events.label }).children[0];
  expect(first.textContent).toContain(site.events.items[0].day);
  expect(first.textContent).toContain(site.events.items[0].month);
  expect(first.querySelector('[data-date]')?.childElementCount).toBe(2);
});

/**
 * «Alle arrangementer →» has nowhere to go until the route exists, and a link to `#` is the
 * one thing on the page that would answer a click by doing nothing. It is rendered from an
 * href, so it appears the day there is one and cannot be left pointing at nothing.
 */
test('no «alle» link is rendered while the content file has no route for it', () => {
  const section = mount();
  expect(within(section).queryByText(new RegExp(site.events.more))).toBeNull();
  expect(within(section).queryByText(new RegExp(site.news.more))).toBeNull();
});

test('an «alle» link is rendered as soon as the content file has a route', () => {
  const { container } = render(
    <Happenings events={{ ...site.events, href: '/arrangementer' }} news={site.news} />,
  );
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(within(section).getByRole('link', { name: new RegExp(site.events.more) }))
    .toHaveAttribute('href', '/arrangementer');
});

/**
 * The section is the page's one breath between the ink above and the water below, and an
 * empty breath is just a gap. With nothing to list there is nothing to say, so it goes
 * rather than standing there as a headline over air.
 */
test('the section is not rendered at all when there is nothing to list', () => {
  const { container } = render(
    <Happenings events={{ ...site.events, items: [] }} news={{ ...site.news, items: [] }} />,
  );
  expect(container.querySelector('#arrangementer')).toBeNull();
});

test('a column with nothing in it goes while the other one stays', () => {
  const { container } = render(
    <Happenings events={{ ...site.events, items: [] }} news={site.news} />,
  );
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(section).not.toBeNull();
  expect(within(section).queryByText(site.events.line)).toBeNull();
  expect(within(section).getByText(site.news.line)).toBeInTheDocument();
});
