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

  test('every area is a field reachable by the anchor the old page gave it, the first (4×2) carrying the note', () => {
    const { container } = render(<VartArbeid />);
    const ids = Array.from(container.querySelectorAll('[data-field]')).map((f) => f.id);
    expect(ids).toEqual([
      'kurs-opplaering-og-kompetanseutvikling',
      'seminarer-konferanser-og-panelsamtaler',
      'dialog-og-gjensidig-forstaelse',
      'prosjekter-frivillighet-og-lederskap',
      'kunnskapsformidling-og-publikasjoner',
      'moteplasser-og-laeringsarenaer',
      'samarbeid-og-partnerskap',
    ]);
    const first = container.querySelector('[data-field]')!;
    expect(first).toHaveTextContent(klient.work.areas[0].note!);
    expect(container.querySelectorAll('[data-field] p').length).toBe(klient.work.areas.length + 1);
  });

  test('no copy of our own: no eyebrows, numbers or links beyond the client’s text', () => {
    const { container } = render(<VartArbeid />);
    const text = [klient.work.title, klient.work.intro, ...klient.work.areas.flatMap((a) => [a.title, a.text, 'note' in a ? a.note : ''])].join('');
    expect(container.textContent!.replace(/\s+/g, '')).toBe(text.replace(/\s+/g, ''));
    expect(container.querySelector('a')).toBeNull();
  });

  test('none of the old four areas', () => {
    const { container } = render(<VartArbeid />);
    expect(container.querySelector('[data-material="water"]')).toBeNull();
    expect(container.textContent).not.toContain('Samfunnsdeltakelse');
  });
});
