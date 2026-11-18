import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { klient } from '@/content/klient.no';
import VartArbeid from './page';

describe('Vårt arbeid', () => {
  test('the client’s title and intro, then every area of work in their order: each its own section, its title the heading, its text under it', () => {
    const { container } = render(<VartArbeid />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(klient.work.title);
    expect(screen.getByText(klient.work.intro)).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(klient.work.areas.map((a) => a.title));
    for (const a of klient.work.areas) {
      const section = screen.getByRole('heading', { level: 2, name: a.title }).closest('section')!;
      expect(section).toHaveAttribute('id');
      expect(section).toHaveTextContent(a.text);
      if ('note' in a) expect(section).toHaveTextContent(a.note);
    }
    expect(container.querySelector('section#kurs-opplaering-og-kompetanseutvikling')).not.toBeNull();
  });

  test('none of the old four areas', () => {
    const { container } = render(<VartArbeid />);
    expect(container.querySelector('[data-material="water"]')).toBeNull();
    expect(container.textContent).not.toContain('Samfunnsdeltakelse');
  });
});
