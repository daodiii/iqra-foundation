import { render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Happenings } from './Happenings';

/** There is no auto-cleanup configured, so every query is scoped to its own render. */
const mount = () => {
  const { container } = render(<Happenings />);
  return container.querySelector('#arrangementer') as HTMLElement;
};

const boxes = (section: HTMLElement) =>
  Array.from(section.querySelectorAll('li')).map((li) => li.textContent ?? '');

const NEWS = [
  { date: '2026-09-06', note: 'Første etasje fra august.', image: null },
  { date: '2026-08-30', note: 'Den svarer på det folk spør om.', image: null },
];

const EVENTS = [
  { date: '2026-09-24', note: 'Kom med spørsmål.', image: null },
  { date: '2026-10-08', note: 'En time om det grunnleggende.', image: null },
];

const both = () => render(<Happenings events={{ ...site.events, items: EVENTS }} news={{ ...site.news, items: NEWS }} />);

test('the section carries one heading for both lists, not one each, and nothing above it', () => {
  const section = mount();
  expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent(site.happenings.line);
  expect(within(section).getAllByRole('heading', { level: 2 })).toHaveLength(1);
  // The heading is the section's name now; the small label that stood over the old line is gone.
  expect(section.querySelector('h2')!.previousElementSibling).toBeNull();
});

/**
 * The row is the boxes and nothing else: the events in the order they are listed, then
 * the news. There is no «i dag» standing between them and no date to sort them by — the
 * timeline went on 2026-09-14 («take away today … let it just be four boxes») — and with
 * nothing to page through there are no arrows either.
 */
test('the row is the boxes in the order they are listed, the events then the news, and nothing else', () => {
  const { container } = both();
  const section = container.querySelector('#arrangementer') as HTMLElement;
  const text = boxes(section);
  expect(text).toHaveLength(EVENTS.length + NEWS.length);
  expect(text[0]).toContain(EVENTS[0].note);
  expect(text[1]).toContain(EVENTS[1].note);
  expect(text[2]).toContain(NEWS[0].note);
  expect(text[3]).toContain(NEWS[1].note);
  expect(section.querySelector('[data-today]')).toBeNull();
  expect(within(section).queryByRole('button')).toBeNull();
});

/**
 * A box is the picture, the date and the words: the kind as the legend on the frame's
 * line, the picture on top, the date written out under it, the paragraph, and nothing
 * else — no title, no line under it. The date is one thing to type, ISO, and is read
 * back as a Norwegian date.
 */
test('a box is its kind, the picture, the date written out, and the words', () => {
  const item = { date: '2026-09-24', note: 'Kom med spørsmål.', image: { src: '/media/kveld.jpg', alt: 'Folk rundt et bord' } };
  const { container } = render(
    <Happenings events={{ ...site.events, items: [item] }} news={{ ...site.news, items: [] }} />,
  );
  const section = container.querySelector('#arrangementer') as HTMLElement;
  const card = section.querySelector('article') as HTMLElement;
  expect(card.textContent).toBe(`${site.happenings.kinds.event}24. september 2026${item.note}`);
  const picture = within(card).getByAltText(item.image.alt);
  const date = within(card).getByText('24. september 2026');
  const words = within(card).getByText(item.note);
  // The picture is on top, the date under it, the words under that.
  expect(picture.compareDocumentPosition(date) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(date.compareDocumentPosition(words) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

/** «8. oktober 2026», not «08. Okt»: a day without its zero, the month in full and in lower case. */
test('the date is read off the ISO date as a plain Norwegian one', () => {
  const items = [
    { date: '2026-10-08', note: 'a', image: null },
    { date: '2027-01-01', note: 'b', image: null },
    { date: '2026-12-31', note: 'c', image: null },
  ];
  const { container } = render(<Happenings events={{ ...site.events, items }} news={{ ...site.news, items: [] }} />);
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(within(section).getByText('8. oktober 2026')).toBeInTheDocument();
  expect(within(section).getByText('1. januar 2027')).toBeInTheDocument();
  expect(within(section).getByText('31. desember 2026')).toBeInTheDocument();
});

test('every box says which list it came from', () => {
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
 * A box with no picture keeps the frame where one would go — the same answer the team
 * list gives with its empty circles. It is bracketed so it cannot be read as content, and
 * it is `aria-hidden` because an empty frame has nothing to say out loud.
 */
test('a box with no photograph shows an empty frame rather than a broken image', () => {
  const { container } = both();
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(section.querySelectorAll('img')).toHaveLength(0);
  expect(within(section).getAllByText(site.happenings.imageLabel, { ignore: '' }))
    .toHaveLength(NEWS.length + EVENTS.length);
});

test('a box with a photograph shows it, with the alt text from the content file', () => {
  const withPhoto = [{ ...NEWS[0], image: { src: '/media/kveld.jpg', alt: 'Folk rundt et bord' } }];
  const { container } = render(
    <Happenings events={{ ...site.events, items: [] }} news={{ ...site.news, items: withPhoto }} />,
  );
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(within(section).getByAltText('Folk rundt et bord')).toBeInTheDocument();
});

/**
 * The four boxes in the content file are filled, so the section can be seen with something
 * in it («fill them with some stock pictures … different dates on all of them so I get the
 * complete look», 2026-09-14): the words are the site's own — the hero's, «Iqra betyr les»
 * — in every box, so nothing on the page is invented; every box has a date of its own; and
 * the pictures are stand-ins whose alt carries a bracket, so `check-content` reports them
 * with everything else the site still lacks.
 */
test('the content file holds four filled boxes with the hero’s words, four dates, the pictures marked as stand-ins', () => {
  const items = [...site.events.items, ...site.news.items];
  expect(items).toHaveLength(4);
  expect(new Set(items.map((i) => i.date)).size).toBe(4);
  for (const item of items) {
    expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(item.note).toBe(site.hero.lede);
    expect(item.image).not.toBeNull();
    expect(item.image!.src).toMatch(/^\/media\/midlertidig-/);
    expect(item.image!.alt).toMatch(/^\[Midlertidig bilde\] /);
  }
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

test('one empty list leaves the other one standing', () => {
  const { container } = render(
    <Happenings events={{ ...site.events, items: EVENTS }} news={{ ...site.news, items: [] }} />,
  );
  const section = container.querySelector('#arrangementer') as HTMLElement;
  expect(boxes(section)).toHaveLength(EVENTS.length);
});

/**
 * The box is a line drawn with the tree's pen: every box carries the canvas the pen draws
 * on, and its kind — «Nyhet» or «Arrangement» — is the legend that sits on the line.
 */
test('every box is a frame with its kind as the legend on the line', () => {
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
