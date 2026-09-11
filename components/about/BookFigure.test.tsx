import { render, within } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Book } from './BookFigure';
import { fullName } from './pages';

const mount = () => {
  const { container } = render(<Book />);
  return container.querySelector('#om-oss') as HTMLElement;
};

/**
 * The book is a canvas, so without this the whole of Om oss would be invisible to a
 * screen reader and to a search engine. The article is the page; the canvas is a way of
 * looking at it.
 */
test('the whole book exists as real text, not only on the canvas', () => {
  const section = mount();
  const article = section.querySelector('article')!;
  const q = within(article);
  expect(q.getByRole('heading', { level: 1 })).toHaveTextContent(site.about.cover.title);
  for (const ch of site.about.chapters) {
    expect(q.getByRole('heading', { level: 2, name: new RegExp(ch.title) })).toBeInTheDocument();
    for (const p of ch.paras) expect(q.getByText(p)).toBeInTheDocument();
  }
  expect(q.getByRole('heading', { level: 2, name: site.about.ask.title })).toBeInTheDocument();
  expect(q.getByRole('link', { name: site.hero.cta }))
    .toHaveAttribute('href', `mailto:${site.contact.email}`);
});

test('every team member is listed with their role', () => {
  const section = mount();
  const chapter = site.about.chapters.find((c) => 'team' in c)!;
  const items = section.querySelectorAll('article ul li');
  expect(items.length).toBeGreaterThanOrEqual(chapter.team!.length);
  chapter.team!.forEach((m, i) => {
    expect(items[i]).toHaveTextContent(fullName(m));
    expect(items[i]).toHaveTextContent(m.role);
  });
});

/**
 * jsdom has no WebGL, so the effect leaves the section in its fallback state. That is
 * the state a real visitor without WebGL gets too, and in it the article must be a
 * plain readable document rather than a clipped one.
 */
test('with no canvas the section falls back to the article', () => {
  const section = mount();
  expect(section.dataset.canvas).toBe('off');
});

test('the canvas and the chapter label are decorative', () => {
  const section = mount();
  expect(section.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
  expect(section.querySelector('[data-chapter]')?.closest('[aria-hidden]')).not.toBeNull();
});
