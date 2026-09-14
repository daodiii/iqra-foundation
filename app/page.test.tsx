import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { site } from '@/content/site.no';
import Page from './page';

/**
 * The buttons on to the next section stand between the sections, on the page's white —
 * «take the buttons under their sections» (2026-09-14) — not inside them: every section
 * after the hero clips its overflow, and a button on a box's line was on the box. The
 * hero's own stands in its copy. So the page reads, top to bottom: the hero (with its
 * button on to Visjon), then each section followed by the button on to the next, and
 * Støtt oss last with none.
 */
test('the page is the sections with a button on to the next between each pair, in order', () => {
  const { container } = render(<Page />);
  const main = container.querySelector('main') as HTMLElement;
  const walk = [...main.querySelectorAll('section, [data-onward]')]
    .filter((el) => el.tagName === 'SECTION' || !el.closest('section') || el.closest('section')!.id === 'hero')
    .map((el) => (el.tagName === 'SECTION' ? `#${el.id}` : `→${(el as HTMLElement).dataset.onward}`));
  expect(walk).toEqual([
    '#hero', '→visjon',
    '#visjon', '→misjon',
    '#misjon', '→arrangementer',
    '#arrangementer', '→om-oss-teamet',
    '#om-oss-teamet', '→stott-oss',
    '#stott-oss',
  ]);
  // Between, not inside: none of the four stands in a section.
  for (const id of ['misjon', 'arrangementer', 'om-oss-teamet', 'stott-oss']) {
    const a = main.querySelector(`[data-onward="${id}"]`) as HTMLElement;
    expect(a.closest('section')).toBeNull();
    expect(a).toHaveTextContent(site.next[id as keyof typeof site.next]);
  }
});
