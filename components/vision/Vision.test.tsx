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

test('the arch area holds the scene, the stroke and the tree, under the cards', () => {
  render(<Vision />);
  const arch = document.querySelector('#visjon [data-arch]')!;
  expect(arch.querySelector('[data-scene]')).not.toBeNull();
  expect(arch.querySelector('[data-stroke]')).not.toBeNull();
  expect(arch.querySelector('[data-tree] canvas')).not.toBeNull();
  const order = [...document.querySelectorAll('#visjon [data-arch], #visjon [data-value]')];
  expect(order[0]).toBe(arch);
});
