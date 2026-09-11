import { render, within } from '@testing-library/react';
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

test('every member of the team gets a card: role, both names, the line about them', () => {
  const section = mount();
  const list = within(section).getByRole('list', { name: site.people.teamLabel });
  expect(list.children).toHaveLength(menneskene.team.length);
  menneskene.team.forEach((member, i) => {
    const row = list.children[i] as HTMLElement;
    expect(row).toHaveTextContent(member.role);
    expect(row).toHaveTextContent(member.first);
    expect(row).toHaveTextContent(member.last);
    expect(row).toHaveTextContent(member.bio);
  });
});

/**
 * Portrait left, then right, then left: six identical rows would be a column, and the
 * alternation is what makes them a sequence. The side is data rather than a class so the
 * stylesheet and the entrance (which slides the parts in from the portrait's side) read
 * the same value.
 */
test('the member cards alternate sides, starting on the left', () => {
  const section = mount();
  const list = within(section).getByRole('list', { name: site.people.teamLabel });
  const sides = Array.from(list.children).map((row) => (row as HTMLElement).dataset.side);
  expect(sides).toEqual(menneskene.team.map((_, i) => (i % 2 ? 'right' : 'left')));
});

/** The round arrow goes to the chapter about the people; a dead button would be the only one on the site. */
test('every member card’s arrow links to /om-oss', () => {
  const section = mount();
  const arrows = within(section).getAllByRole('link', { name: site.people.memberMore });
  expect(arrows).toHaveLength(menneskene.team.length);
  for (const a of arrows) expect(a).toHaveAttribute('href', '/om-oss');
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
 * The box is Arafat in clear water — the one scene of the film the page had never used, and
 * the gathering, which is why it belongs under the section about who «we» are. The canvas
 * is what the simulation paints on; the class is what carries the floor colour before it.
 */
test('the box is the arafat floor, with a canvas for the water to paint on', () => {
  const section = mount();
  const canvas = section.querySelector('canvas[data-water]');
  expect(canvas).not.toBeNull();
  expect(canvas?.parentElement?.className).toMatch(/arafat/);
});
