import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import VartArbeid from './page';

describe('Vårt arbeid', () => {
  test('the title and the mission headline as the lede, then the four areas: each its own section, its key the id, its name the heading, on ink and water by turns', () => {
    const { container } = render(<VartArbeid />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(site.pages.work.title);
    expect(screen.getByText(brief.mission.headline)).toBeInTheDocument();
    brief.areas.forEach((a, i) => {
      const section = container.querySelector(`section#${a.key}`)!;
      expect(section, a.key).not.toBeNull();
      expect(section).toHaveAttribute('aria-labelledby', `${a.key}-tittel`);
      const h2 = section.querySelector('h2')!;
      expect(h2.id).toBe(`${a.key}-tittel`);
      expect(h2.textContent).toBe(a.name);
      expect(section.querySelector('[data-material]')).toHaveAttribute('data-material', i % 2 ? 'water' : 'ink');
      expect(screen.getByText(a.text)).toBeInTheDocument();
    });
    expect(container.querySelector('[data-plates]')).not.toBeNull();
  });
});
