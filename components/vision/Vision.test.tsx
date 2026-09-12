import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Vision } from './Vision';

test('three cards carry the values, the name stands under the roots, the headline is gone', () => {
  render(<Vision />);
  const cards = [...document.querySelectorAll('[data-value]')];
  expect(cards.map((c) => c.getAttribute('data-value'))).toEqual(['dialog', 'trygghet', 'inkludering']);
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Dialog', 'Trygghet', 'Inkludering']);
  for (const v of site.vision.values) expect(screen.getByText(v.text)).toBeInTheDocument();
  expect(document.querySelector('[data-root]')?.textContent).toBe('IQRAFOUNDATION');
  expect(screen.getByRole('figure', { name: /Dialog, Trygghet og Inkludering/ })).toBeInTheDocument();
  expect(document.getElementById('visjon')).toHaveAttribute('aria-labelledby', 'visjon-label');
  expect(document.getElementById('visjon-label')).toHaveTextContent('Visjon');
  expect(document.querySelector('[data-line]')).toBeNull();
  expect(screen.queryByText('Vi vil ha et Norge')).not.toBeInTheDocument();
});

/**
 * Just the arch and the tree. The pre-dawn scene that used to open inside the stroke — sky,
 * stars, grass, earth — is gone by the user's call (2026-09-12: «just have the tree and the
 * arch, delete everything inside»), so the ink shows through the opening and the only
 * canvases in the area are the stroke's and the tree's.
 */
test('the arch area holds the stroke and the tree, nothing painted inside, under the cards', () => {
  render(<Vision />);
  const arch = document.querySelector('#visjon [data-arch]')!;
  expect(arch.querySelector('[data-scene]')).toBeNull();
  expect(arch.querySelector('[data-stroke]')).not.toBeNull();
  expect(arch.querySelector('[data-tree] canvas')).not.toBeNull();
  expect(arch.querySelectorAll('canvas')).toHaveLength(2);
  const order = [...document.querySelectorAll('#visjon [data-arch], #visjon [data-value]')];
  expect(order[0]).toBe(arch);
});

/**
 * The box is a line drawn with the tree's pen (2026-09-12, «make all the boxes on the site
 * like this»): each card carries the canvas the pen draws on, the name is the legend that
 * sits on the line, and the paragraph is the copy the arrival brings in after it.
 */
test('each card carries a frame canvas, its name as the legend, and its paragraph as the copy', () => {
  render(<Vision />);
  const cards = [...document.querySelectorAll<HTMLElement>('[data-value]')];
  expect(cards).toHaveLength(3);
  for (const card of cards) {
    expect(card.querySelector('canvas[data-frame-canvas]')).toHaveAttribute('aria-hidden', 'true');
    expect(card.querySelector('h2[data-legend]')).not.toBeNull();
    expect(card.querySelector('p[data-copy]')).not.toBeNull();
  }
});
