import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import Home from './page';

describe('Hjem', () => {
  test('one h1, the brief’s; Visjon and Misjon as sections on ink; the four areas on water, each a link to its section of Vårt arbeid', () => {
    const { container } = render(<Home />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    for (const [label, text] of [[site.pages.home.visionLabel, brief.vision], [site.pages.home.missionLabel, brief.mission]] as const) {
      const legend = screen.getByRole('heading', { level: 2, name: label });
      const section = legend.closest('section')!;
      expect(section).toHaveAttribute('aria-labelledby', legend.id);
      expect(section.closest('[data-material]')).toHaveAttribute('data-material', 'ink');
      expect(screen.getByRole('heading', { level: 3, name: text.headline })).toBeInTheDocument();
      expect(screen.getByText(text.paragraph)).toBeInTheDocument();
    }

    const areas = screen.getByRole('heading', { level: 2, name: site.pages.home.areasLabel }).closest('section')!;
    expect(areas.querySelector('[data-material]')).toHaveAttribute('data-material', 'water');
    for (const a of brief.areas) {
      const link = screen.getByRole('link', { name: a.name });
      expect(link).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      expect(areas).toContainElement(link);
      expect(screen.getByText(a.text)).toBeInTheDocument();
    }
    // Three plates and nothing else: the hero, the ink, the water.
    expect(container.querySelectorAll('[data-material]')).toHaveLength(2);
    expect(container.querySelector('[data-plates]')).not.toBeNull();
  });
});
