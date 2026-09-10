import { render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Happenings } from './Happenings';

/** There is no auto-cleanup configured, so every query is scoped to its own render. */
const mount = () => {
  const { container } = render(<Happenings />);
  return container.querySelector('#arrangementer') as HTMLElement;
};

const stops = (section: HTMLElement) =>
  Array.from(section.querySelectorAll('li')).map((li) => li.textContent ?? '');

const NEWS = [
  { day: '3', month: 'jul', title: 'Vi flytter kveldene', note: 'Første etasje fra august.', image: null },
  { day: '4', month: 'sep', title: 'Ny brosjyre', note: 'Den svarer på det folk spør om.', image: null },
];

const EVENTS = [
  { day: '18', month: 'sep', title: 'Åpen kveld', meta: 'Torsdag kl. 18.00', note: 'Kom med spørsmål.', image: null },
  { day: '8', month: 'okt', title: 'Hva er islam?', meta: 'Onsdag kl. 19.00', note: 'En time om det grunnleggende.', image: null },
];

const both = () => render(<Happenings events={{ ...site.events, items: EVENTS }} news={{ ...site.news, items: NEWS }} />);

test('the section carries one heading for both lists, not one each', () => {
  const section = mount();
  expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent(site.happenings.line);
  expect(within(section).getAllByRole('heading', { level: 2 })).toHaveLength(1);
});

/**
 * The whole idea, as a test. Nyheter lie behind «i dag» and Arrangementer ahead of it,
 * which is what they are rather than how they are arranged — so the order of the axis is
 * the one thing about this section that cannot drift without the section losing its point.
 */
test('the axis runs oldest news, then today, then the nearest event', () => {
  const { container } = both();
  const section = container.querySelector('#arrangementer') as HTMLElement;
  const text = stops(section);
  expect(text[0]).toContain('Vi flytter kveldene');
  expect(text[1]).toContain('Ny brosjyre');
  expect(text[2]).toContain(site.happenings.today);
  expect(text[3]).toContain('Åpen kveld');
  expect(text[4]).toContain('Hva er islam?');
});

test('every stop says whether it is something coming or something that was', () => {
  const { container } = both();
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(within(section).getAllByText(site.happenings.kinds.news)).toHaveLength(NEWS.length);
  expect(within(section).getAllByText(site.happenings.kinds.event)).toHaveLength(EVENTS.length);
});

/** The month is written above the line where it changes and nowhere else — repeated on
 *  every stop it stops being a ruler and becomes noise. */
test('the month is named once, where it changes', () => {
  const { container } = both();
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(within(section).getAllByText(site.happenings.months.sep)).toHaveLength(1);
  expect(within(section).getByText(site.happenings.months.jul)).toBeInTheDocument();
  expect(within(section).getByText(site.happenings.months.okt)).toBeInTheDocument();
});

/**
 * There are no photographs of Iqra, so the frame stands where one would go — the same
 * answer the team list gives with its empty circles. It is bracketed so it cannot be read
 * as content, and it is `aria-hidden` because an empty frame has nothing to say out loud.
 */
test('a stop with no photograph shows an empty frame rather than a broken image', () => {
  const { container } = both();
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(section.querySelectorAll('img')).toHaveLength(0);
  expect(within(section).getAllByText(site.happenings.imageLabel, { ignore: '' }))
    .toHaveLength(NEWS.length + EVENTS.length);
});

test('a stop with a photograph shows it, with the alt text from the content file', () => {
  const withPhoto = [{ ...NEWS[0], image: { src: '/media/kveld.jpg', alt: 'Folk rundt et bord' } }];
  const { container } = render(
    <Happenings events={{ ...site.events, items: [] }} news={{ ...site.news, items: withPhoto }} />,
  );
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(within(section).getByAltText('Folk rundt et bord')).toBeInTheDocument();
});

/** "Alle arrangementer →" has nowhere to go until the route exists, and a link to `#` is
 *  the one thing on the page that would answer a click by doing nothing. */
test('no «alle» link is rendered while the content file has no route for it', () => {
  const section = mount();
  expect(within(section).queryByRole('link')).toBeNull();
});

test('an «alle» link is rendered as soon as the content file has a route', () => {
  const { container } = render(
    <Happenings events={{ ...site.events, href: '/arrangementer' }} news={site.news} />,
  );
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(within(section).getByRole('link', { name: new RegExp(site.events.more) }))
    .toHaveAttribute('href', '/arrangementer');
});

/** A timeline with nothing on it is an axis of white. The section goes rather than stand
 *  there as a headline over air. */
test('the section is not rendered at all when there is nothing on the axis', () => {
  const { container } = render(
    <Happenings events={{ ...site.events, items: [] }} news={{ ...site.news, items: [] }} />,
  );
  expect(container.querySelector('#arrangementer')).toBeNull();
});

test('one empty list leaves the other one and today still standing', () => {
  const { container } = render(
    <Happenings events={{ ...site.events, items: EVENTS }} news={{ ...site.news, items: [] }} />,
  );
  const section = container.querySelector('#arrangementer') as HTMLElement;
  const text = stops(section);
  expect(text[0]).toContain(site.happenings.today);
  expect(text).toHaveLength(EVENTS.length + 1);
});
