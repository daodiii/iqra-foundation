import { fireEvent, render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { People } from './People';

const [story, menneskene] = site.about.chapters;

/** There is no auto-cleanup configured, so every query is scoped to its own render. */
const mount = () => {
  const { container } = render(<People />);
  return container.querySelector('#om-oss-teamet') as HTMLElement;
};

test('the story card takes its lede and paragraphs from the book’s first chapter', () => {
  const section = mount();
  expect(within(section).getByText(site.about.label)).toBeInTheDocument();
  expect(within(section).getByText(story.lede)).toBeInTheDocument();
  expect(within(section).getByText(story.paras[0])).toBeInTheDocument();
  expect(within(section).getByText(story.paras[1])).toBeInTheDocument();
});

/**
 * Two paragraphs, not three. The chapter has a third and `/om-oss` shows it; the landing
 * page is an invitation to read the chapter rather than the chapter itself, and the link
 * below only means something if something has been held back.
 */
test('the story card stops short of the chapter’s last paragraph', () => {
  const section = mount();
  expect(within(section).queryByText(story.paras[2])).toBeNull();
});

test('the story card links to the chapter it is quoting', () => {
  const section = mount();
  expect(within(section).getByRole('link', { name: new RegExp(site.people.more) }))
    .toHaveAttribute('href', '/om-oss');
});

test('the team card takes its lede and its count line from the book’s second chapter', () => {
  const section = mount();
  expect(within(section).getByText(site.people.teamLabel)).toBeInTheDocument();
  expect(within(section).getByText(menneskene.lede)).toBeInTheDocument();
  expect(within(section).getByText(menneskene.paras[0])).toBeInTheDocument();
});

/** One person at a time: the first, with everything the card says about them. */
test('the member card opens on the first person: role, both names, the line, and the count', () => {
  const section = mount();
  const card = section.querySelector('[data-row]') as HTMLElement;
  const [first] = menneskene.team;
  expect(section.querySelectorAll('[data-row]')).toHaveLength(1);
  expect(card).toHaveTextContent(first.role);
  expect(card).toHaveTextContent(first.first);
  expect(card).toHaveTextContent(first.last);
  expect(card).toHaveTextContent(first.bio);
  expect(card).toHaveTextContent(`1 / ${menneskene.team.length}`);
});

/**
 * The arrow is how you meet the next one, and after the last it comes round to the first:
 * a button that stopped working on the sixth press would look broken, not finished.
 */
test('the arrow steps through every member and wraps to the first', () => {
  const section = mount();
  const next = within(section).getByRole('button', { name: site.people.next });
  const card = section.querySelector('[data-row]') as HTMLElement;
  menneskene.team.forEach((member, i) => {
    expect(card).toHaveAttribute('data-index', String(i));
    expect(card).toHaveTextContent(member.role);
    expect(card).toHaveTextContent(`${i + 1} / ${menneskene.team.length}`);
    fireEvent.click(next);
  });
  expect(card).toHaveAttribute('data-index', '0');
  expect(card).toHaveTextContent(menneskene.team[0].role);
});

/** The small ring goes the other way, and from the first person it goes to the last. */
test('the back arrow steps to the previous member and wraps to the last', () => {
  const section = mount();
  const back = within(section).getByRole('button', { name: site.people.prev });
  const card = section.querySelector('[data-row]') as HTMLElement;
  const last = menneskene.team.length - 1;
  fireEvent.click(back);
  expect(card).toHaveAttribute('data-index', String(last));
  expect(card).toHaveTextContent(menneskene.team[last].role);
  fireEvent.click(back);
  expect(card).toHaveAttribute('data-index', String(last - 1));
  fireEvent.click(within(section).getByRole('button', { name: site.people.next }));
  expect(card).toHaveAttribute('data-index', String(last));
});

/** What changed on a step is the name and the line; a screen reader hears them. */
test('the name and the line about the person are a live region', () => {
  const section = mount();
  const info = section.querySelector('[data-part="info"]');
  expect(info).toHaveAttribute('aria-live', 'polite');
  expect(info).toHaveTextContent(menneskene.team[0].first);
  expect(info).toHaveTextContent(menneskene.team[0].bio);
});

/** No name, no face, no sentence about anyone is invented until there is someone to name. */
test('every slot on every member card is still a bracket', () => {
  for (const m of menneskene.team) {
    expect(m.first).toMatch(/^\[.+\]$/);
    expect(m.last).toMatch(/^\[.+\]$/);
    expect(m.bio).toMatch(/^\[.+\]$/);
  }
});

/**
 * The box is water — sage since the reorder of 2026-09-13, Arafat's stone before that — and
 * the class is the section's, not the scene's, so the colour can move without the markup
 * lying about it. The canvas is what the simulation paints on; the class is what carries
 * the floor colour before it.
 */
test('the box is the people’s floor, with a canvas for the water to paint on', () => {
  const section = mount();
  const canvas = section.querySelector('canvas[data-water]');
  expect(canvas).not.toBeNull();
  expect(canvas?.parentElement?.className).toMatch(/people/);
});

/**
 * The box is a line drawn with the tree's pen: the two cards and the member card each carry
 * the canvas the pen draws on and a legend on the line — the two labels, and on the member
 * card the role, with the count kept inside at the top right.
 */
test('the two cards and the member card are frames; the role is the member card’s legend and the count stays inside', () => {
  const section = mount();
  expect(section.querySelectorAll('canvas[data-frame-canvas]')).toHaveLength(3);
  const legends = [...section.querySelectorAll('[data-legend]')].map((l) => l.textContent);
  expect(legends).toEqual([site.about.label, site.people.teamLabel, menneskene.team[0].role]);
  const card = section.querySelector('[data-row]') as HTMLElement;
  expect(card.querySelector('[data-legend]')).toHaveAttribute('data-part', 'role');
  expect(card.querySelector('[data-counter]')).toHaveTextContent(`1 / ${menneskene.team.length}`);
});
