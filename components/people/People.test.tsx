import { fireEvent, render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { People } from './People';

const [story, menneskene] = site.about.chapters;
const team = menneskene.team;
const n = team.length;

/** There is no auto-cleanup configured, so every query is scoped to its own render. */
const mount = () => {
  const { container } = render(<People />);
  return container.querySelector('#om-oss-teamet') as HTMLElement;
};

/**
 * The words are the book's own first chapter, read from the same place `/om-oss` reads
 * them, so the landing page and the book cannot drift: the lede and its paragraph, once.
 * The second chapter's count line used to follow; with every paragraph on the site the
 * same stand-in (2026-09-14) it would be the paragraph printed twice, so it went.
 */
test('the words are the first chapter’s lede and paragraph, once', () => {
  const section = mount();
  const words = section.querySelector('[data-words]') as HTMLElement;
  expect(within(words).getByText(site.about.label)).toBeInTheDocument();
  expect(within(words).getByText(story.lede)).toBeInTheDocument();
  expect(within(words).getAllByText(story.paras[0])).toHaveLength(1);
  expect(words.querySelectorAll('p')).toHaveLength(3); // the legend, the lede, the paragraph
});

test('the link to the chapter is in the band under the book, once', () => {
  const section = mount();
  const links = within(section).getAllByRole('link', { name: new RegExp(site.people.more) });
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAttribute('href', '/om-oss');
  expect(links[0].closest('[data-controls]')).not.toBeNull();
});

/**
 * jsdom has no WebGL, so the renderer declines and the section is its readable layout —
 * which is also what a visitor without WebGL gets: the words, then the member card.
 * Everything the book shows as text exists as real text under it; the logo page is
 * decoration, like the cover was, and has no copy to keep.
 */
test('without WebGL the section is the readable layout: the words and the card, no picture', () => {
  const section = mount();
  expect(section.dataset.book).toBe('off');
  expect(section.querySelector('[data-photo]')).toBeNull();
  expect(section.querySelector('img')).toBeNull();
  const card = section.querySelector('[data-row]') as HTMLElement;
  expect(card).toHaveAttribute('data-index', '0');
  expect(card).toHaveTextContent(team[0].role);
  expect(card).toHaveTextContent(team[0].first);
  expect(card).toHaveTextContent(team[0].last);
  expect(card).toHaveTextContent(team[0].bio);
});

/**
 * The rings turn the book; without one they step the card, and the section says which
 * spread it is on (`data-spread`, the state the tests and the e2e read now that the band
 * no longer says «Teamet · 1 / 6»). After the last member the large ring comes round to
 * the first: a button that stopped working on the sixth press would look broken, not
 * finished. Without a book the first member is the first stop, at spread 2.
 */
test('the large ring steps the card through every member and wraps', () => {
  const section = mount();
  const next = within(section).getByRole('button', { name: site.people.next });
  const card = section.querySelector('[data-row]') as HTMLElement;
  team.forEach((member, i) => {
    expect(section).toHaveAttribute('data-spread', String(i + 2));
    expect(card).toHaveAttribute('data-index', String(i));
    expect(card).toHaveTextContent(member.role);
    fireEvent.click(next);
  });
  expect(section).toHaveAttribute('data-spread', '2');
  expect(card).toHaveAttribute('data-index', '0');
});

test('the small ring steps back, and from the first member goes to the last', () => {
  const section = mount();
  const back = within(section).getByRole('button', { name: site.people.prev });
  const card = section.querySelector('[data-row]') as HTMLElement;
  fireEvent.click(back);
  expect(card).toHaveAttribute('data-index', String(n - 1));
  expect(section).toHaveAttribute('data-spread', String(n + 1));
  fireEvent.click(back);
  expect(card).toHaveAttribute('data-index', String(n - 2));
  fireEvent.click(within(section).getByRole('button', { name: site.people.next }));
  expect(card).toHaveAttribute('data-index', String(n - 1));
});

/**
 * The band under the book is the offer and the two rings, nothing between them: the
 * «Teamet · 1 / 6» that stood in the middle went («take away team 01/06», 2026-09-14),
 * and so did the count in the card's corner. What a press changed is who is on the page,
 * and a screen reader still hears that from the card.
 */
test('the band is the offer and the rings; the count is gone from the band and the card', () => {
  const section = mount();
  expect(section.querySelector('[data-where]')).toBeNull();
  expect(section.querySelector('[data-counter]')).toBeNull();
  const band = section.querySelector('[data-controls]') as HTMLElement;
  expect(within(band).getByRole('link', { name: new RegExp(site.people.more) })).toBeInTheDocument();
  expect(within(band).getAllByRole('button')).toHaveLength(2);
  expect(band.textContent).not.toMatch(/\d\s*\/\s*\d/);
  expect(section.textContent).not.toContain(`${site.people.teamLabel} ·`);
});

/** What a press changed is who is on the page; a screen reader hears it from the card. */
test('the member’s name and line are a live region', () => {
  const section = mount();
  const info = section.querySelector('[data-part="info"]');
  expect(info).toHaveAttribute('aria-live', 'polite');
  expect(info).toHaveTextContent(team[0].first);
  expect(info).toHaveTextContent(team[0].bio);
});

/** No name, no face, no sentence about anyone is invented until there is someone to name. */
test('every slot on every member card is still a bracket', () => {
  for (const m of team) {
    expect(m.first).toMatch(/^\[.+\]$/);
    expect(m.last).toMatch(/^\[.+\]$/);
    expect(m.bio).toMatch(/^\[.+\]$/);
  }
});

/**
 * The box is water — sage — and the class is the section's, not the scene's, so the colour
 * can move without the markup lying about it. The canvas is what the simulation paints on.
 */
test('the box is the people’s floor, with a canvas for the water to paint on', () => {
  const section = mount();
  const canvas = section.querySelector('canvas[data-water]');
  expect(canvas).not.toBeNull();
  expect(canvas?.parentElement?.className).toMatch(/people/);
});

/**
 * The book is drawn on a canvas, which is decorative: the readable copy is the section's
 * content. The words and the member card are frames drawn with the tree's pen, each with
 * its legend on the line — the label, and the member's role.
 */
test('the book canvas is decorative; the words and the card are frames with legends on the line', () => {
  const section = mount();
  expect(section.querySelector('canvas[data-book]')).toHaveAttribute('aria-hidden', 'true');
  expect(section.querySelectorAll('canvas[data-frame-canvas]')).toHaveLength(2);
  const legends = [...section.querySelectorAll('[data-legend]')].map((l) => l.textContent);
  expect(legends).toEqual([site.about.label, team[0].role]);
  const card = section.querySelector('[data-row]') as HTMLElement;
  expect(card.querySelector('[data-legend]')).toHaveAttribute('data-part', 'role');
});
