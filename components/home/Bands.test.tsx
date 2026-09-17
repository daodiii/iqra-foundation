import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { Bands } from './Bands';

describe('the bands of Vårt arbeid', () => {
  test('four sections of water, each with its area’s id, ground and text, the name an h2, not a link', () => {
    const { container } = render(<Bands />);
    const expected = { kunnskap: 'navy', dialog: 'turquoise', moteplasser: 'light', samfunnsdeltakelse: 'crimson' };
    for (const a of brief.areas) {
      const section = container.querySelector(`section#${a.key}`)!;
      expect(section).not.toBeNull();
      const heading = screen.getByRole('heading', { level: 2, name: a.name });
      expect(section).toHaveAttribute('aria-labelledby', heading.id);
      expect(section.querySelector('[data-material="water"]')).toHaveAttribute('data-ground', expected[a.key]);
      expect(section).toHaveTextContent(a.text);
    }
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(container.querySelectorAll('[data-material]')).toHaveLength(4);
  });
});
