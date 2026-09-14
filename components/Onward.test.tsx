import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Onward } from './Onward';

/**
 * The button on to the next section («after each section make a button like Vår visjon»,
 * 2026-09-14): a real link to the section's id, with the next section's name from the
 * content file, so with no script it still goes there.
 */
test('the button is a link to the next section, named from the content file', () => {
  render(<Onward to="visjon" />);
  const link = screen.getByRole('link', { name: site.next.visjon });
  expect(link).toHaveAttribute('href', '#visjon');
  expect(link.className).toMatch(/onward/);
});

test('every section the buttons lead to has a name', () => {
  for (const id of ['visjon', 'misjon', 'arrangementer', 'om-oss-teamet', 'stott-oss'] as const) {
    expect(site.next[id].length).toBeGreaterThan(0);
  }
});

/**
 * With the target on the page the click is taken over — the page is scrolled there rather
 * than jumped — and the browser's own jump is refused. Without a target (a section that
 * is not rendered) the link is left to the browser, which is a plain anchor.
 */
test('a click is taken over when the section is on the page, and left alone when it is not', () => {
  render(<Onward to="visjon" />);
  const link = screen.getByRole('link', { name: site.next.visjon });
  expect(fireEvent.click(link), 'the click should be left to the browser without a target').toBe(true);
  const target = document.createElement('section');
  target.id = 'visjon';
  document.body.appendChild(target);
  expect(fireEvent.click(link), 'the click should be taken over with a target').toBe(false);
  target.remove();
});

/** A seated button sits on its box's bottom line; the hero's stands in the copy instead. */
test('seated by default, in the flow when asked, and the caller can add a class', () => {
  const { container, rerender } = render(<Onward to="misjon" />);
  expect((container.firstChild as HTMLElement).className).toMatch(/seated/);
  rerender(<Onward to="misjon" seated={false} className="hero-pill" />);
  const a = container.firstChild as HTMLElement;
  expect(a.className).not.toMatch(/seated/);
  expect(a.className).toMatch(/hero-pill/);
});
