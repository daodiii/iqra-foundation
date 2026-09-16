import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import VartArbeid from './page';

describe('Vårt arbeid', () => {
  test('the title and the mission headline as the lede, then the four areas: each its own section of water, its key the id, its name the heading', () => {
    const { container } = render(<VartArbeid />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(site.pages.work.title);
    expect(screen.getByText(brief.mission.headline)).toBeInTheDocument();
    for (const a of brief.areas) {
      const section = container.querySelector(`section#${a.key}`)!;
      expect(section, a.key).not.toBeNull();
      expect(section).toHaveAttribute('aria-labelledby', `${a.key}-tittel`);
      expect(section.querySelector('[data-material="water"]')).not.toBeNull();
      expect(screen.getByRole('heading', { level: 2, name: a.name })).toBeInTheDocument();
      expect(section).toHaveTextContent(a.text);
    }
    expect(container.querySelector('[data-plates]')).not.toBeNull();
  });
});
