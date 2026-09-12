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

// Dated far enough either side of any «today» a test could run on.
const NEWS = [
  { date: '2020-07-03', title: 'Vi flytter kveldene', note: 'Første etasje fra august.', image: null },
  { date: '2021-09-04', title: 'Ny brosjyre', note: 'Den svarer på det folk spør om.', image: null },
];

const EVENTS = [
  { date: '2098-09-18', title: 'Åpen kveld', meta: 'Torsdag kl. 18.00', note: 'Kom med spørsmål.', image: null },
  { date: '2099-10-08', title: 'Hva er islam?', meta: 'Onsdag kl. 19.00', note: 'En time om det grunnleggende.', image: null },
];

const both = () => render(<Happenings events={{ ...site.events, items: EVENTS }} news={{ ...site.news, items: NEWS }} />);

test('the section carries one heading for both lists, not one each', () => {
  const section = mount();
  expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent(site.happenings.line);
  expect(within(section).getAllByRole('heading', { level: 2 })).toHaveLength(1);
});

/**
 * The whole idea, as a test. One row in date order, whichever list a stop came from —
 * «published by the date; news or arrangement doesn't matter» — with «i dag» set where
 * today falls. A news item dated after an event sits after it, because the date decides.
 */
test('the row runs in date order across both lists, with today between past and future', () => {
  const late = { date: '2098-10-01', title: 'Etter åpen kveld', note: 'En nyhet datert mellom to arrangementer.', image: null };
  const { container } = render(
    <Happenings events={{ ...site.events, items: EVENTS }} news={{ ...site.news, items: [...NEWS, late] }} />,
  );
  const section = container.querySelector('#arrangementer') as HTMLElement;
  const text = stops(section);
  expect(text[0]).toContain('Vi flytter kveldene');
  expect(text[1]).toContain('Ny brosjyre');
  expect(text[2]).toContain(site.happenings.today);
  expect(text[3]).toContain('Åpen kveld');
  expect(text[4]).toContain('Etter åpen kveld');
  expect(text[5]).toContain('Hva er islam?');
  expect(text).toHaveLength(6);
});

/** A placeholder has no date to sort by, so it sorts as its list would — news before
 *  today, events after — and shows the bracketed day and month from the content file. */
test('an undated stop keeps its list’s side of today and shows the bracketed date', () => {
  const news = [{ date: null, title: 'Uten dato', note: 'En nyhet.', image: null }];
  const events = [{ date: null, title: 'Kommer', meta: 'Snart', note: 'Et arrangement.', image: null }];
  const { container } = render(<Happenings events={{ ...site.events, items: events }} news={{ ...site.news, items: news }} />);
  const section = container.querySelector('#arrangementer') as HTMLElement;
  const text = stops(section);
  expect(text[0]).toContain('Uten dato');
  expect(text[1]).toContain(site.happenings.today);
  expect(text[2]).toContain('Kommer');
  expect(within(section).getAllByText(site.happenings.undated.day)).toHaveLength(2);
  expect(within(section).getAllByText(site.happenings.undated.month)).toHaveLength(2);
});

/** One thing to type: the day set large and the month beside it are both read off the date. */
test('the day and the month are read off the date', () => {
  const { container } = both();
  const section = container.querySelector('#arrangementer') as HTMLElement;
  const stop = within(section).getByText('Åpen kveld').closest('li') as HTMLElement;
  expect(within(stop).getByText('18')).toBeInTheDocument();
  expect(within(stop).getByText('sep')).toBeInTheDocument();
});

test('every stop says whether it is something coming or something that was', () => {
  const { container } = both();
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(within(section).getAllByText(site.happenings.kinds.news)).toHaveLength(NEWS.length);
  expect(within(section).getAllByText(site.happenings.kinds.event)).toHaveLength(EVENTS.length);
});

/**
 * One canvas in the box: the water. The ink that used to fall into it is gone — «something
 * much calmer» (2026-09-12) — and this is the assertion that keeps it gone: a second canvas
 * here would be the drops coming back. The box is hidden from assistive tech; the row is
 * what a screen reader gets.
 */
test('the box holds the water alone, hidden from assistive tech', () => {
  const section = mount();
  const box = section.querySelector('[data-box]') as HTMLElement;
  expect(box).toHaveAttribute('aria-hidden', 'true');
  const canvases = Array.from(box.querySelectorAll('canvas'));
  expect(canvases.map((c) => (c.hasAttribute('data-water') ? 'water' : c.hasAttribute('data-ink') ? 'ink' : '?')))
    .toEqual(['water']);
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

/** A row with nothing on it is a box of water under a headline. The section goes rather
 *  than stand there over nothing. */
test('the section is not rendered at all when there is nothing on the row', () => {
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

/**
 * The box is a line drawn with the tree's pen: every stop carries the canvas the pen draws
 * on, and its kind — «Nyhet» or «Arrangement» — is the legend that sits on the line.
 */
test('every stop is a frame with its kind as the legend on the line', () => {
  const { container } = both();
  const section = container.querySelector('#arrangementer') as HTMLElement;
  const cards = section.querySelectorAll('article');
  expect(cards.length).toBe(NEWS.length + EVENTS.length);
  cards.forEach((card) => {
    expect(card.querySelector('canvas[data-frame-canvas]')).toHaveAttribute('aria-hidden', 'true');
    const legend = card.querySelector('[data-legend]')!;
    expect([site.happenings.kinds.news, site.happenings.kinds.event]).toContain(legend.textContent);
  });
});
