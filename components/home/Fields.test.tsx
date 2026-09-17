import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Fields } from './Fields';

describe('the four fields', () => {
  test('four boxes of water, each its area’s ground and tone, each one link to its section, no numbers', () => {
    const { container } = render(<Fields />);
    const section = screen.getByRole('region', { name: site.pages.home.areasLabel });
    const boxes = section.querySelectorAll('[data-material="water"]');
    expect(boxes).toHaveLength(4);
    const expected = { kunnskap: ['navy', 'dark'], dialog: ['turquoise', 'light'], moteplasser: ['light', 'light'], samfunnsdeltakelse: ['crimson', 'dark'] };
    brief.areas.forEach((a, i) => {
      const [ground, tone] = expected[a.key];
      expect(boxes[i]).toHaveAttribute('data-ground', ground);
      expect(boxes[i]).toHaveAttribute('data-tone', tone);
      const link = screen.getByRole('link', { name: a.name });
      expect(link).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      expect(boxes[i]).toContainElement(link);
      // a section of the page, first under the hero: an h2, not an h3 straight after the h1
      expect(screen.getByRole('heading', { level: 2, name: a.name })).toBeInTheDocument();
      expect(screen.getByText(a.text)).toBeInTheDocument();
    });
    expect(container.textContent).not.toMatch(/\b0[1-4]\b/);
    // the guide's logo for each ground, decorative
    expect(section.querySelectorAll('img[alt=""]')).toHaveLength(4);
  });
});
