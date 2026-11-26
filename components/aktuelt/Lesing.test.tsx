import { render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Lesing } from './Lesing';

afterEach(() => vi.restoreAllMocks());

test('the contents link to the parts, the first marked, nothing read yet', () => {
  // jsdom lays nothing out: put the text below the first screen, as on a page that has just opened.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ top: 2000, height: 1500, bottom: 3500, left: 0, right: 0, width: 0, x: 0, y: 2000, toJSON: () => ({}) });
  const parts = [{ id: 'del-a', text: 'Første del' }, { id: 'del-b', text: 'Andre del' }];
  render(<div><Lesing parts={parts} textId="tekst" meta={<p>19. november 2026</p>} /><div id="tekst"><h2 id="del-a">Første del</h2><h2 id="del-b">Andre del</h2></div></div>);
  const nav = screen.getByRole('navigation', { name: 'I denne saken' });
  const links = [...nav.querySelectorAll('a')];
  expect(links.map((a) => a.getAttribute('href'))).toEqual(['#del-a', '#del-b']);
  expect(links[0]).toHaveAttribute('aria-current', 'location');
  expect(screen.getByText('Du har lest 0 %')).toBeInTheDocument();
  expect(screen.getByText('19. november 2026')).toBeInTheDocument();
});

test('a text without subheadings has no contents', () => {
  render(<Lesing parts={[]} textId="tekst" meta={<p>dato</p>} />);
  expect(screen.queryByRole('navigation')).toBeNull();
});
