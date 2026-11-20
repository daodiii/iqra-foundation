import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { klient } from '@/content/klient.no';
import VartArbeid from './page';

describe('Vårt arbeid', () => {
  test('the client’s title and intro, then every area of work in their order: each its own section, its title the heading, its text under it', () => {
    const { container } = render(<VartArbeid />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(klient.work.title);
    expect(screen.getByText(klient.work.intro)).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent!.replace(/\s+/g, ' ').trim());
    expect(headings).toEqual(klient.work.areas.map((a) => a.title));
    for (const a of klient.work.areas) {
      const section = screen.getByRole('heading', { level: 2, name: a.title }).closest('section')!;
      expect(section).toHaveAttribute('id');
      expect(section).toHaveTextContent(a.text);
      if ('note' in a) expect(section).toHaveTextContent(a.note);
    }
    expect(container.querySelector('section#kurs-opplaering-og-kompetanseutvikling')).not.toBeNull();
  });

  test('every area is a plate named by its title and reachable by the anchor the old page gave it, the first carrying the note', () => {
    const { container } = render(<VartArbeid />);
    const plates = Array.from(container.querySelectorAll('[data-plate]'));
    expect(plates).toHaveLength(klient.work.areas.length + 1);
    expect(screen.getByRole('region', { name: klient.work.title })).toBe(plates[0]);
    const ids = Array.from(container.querySelectorAll('[data-plate][data-area]')).map((f) => f.id);
    expect(ids).toEqual([
      'kurs-opplaering-og-kompetanseutvikling',
      'seminarer-konferanser-og-panelsamtaler',
      'dialog-og-gjensidig-forstaelse',
      'prosjekter-frivillighet-og-lederskap',
      'kunnskapsformidling-og-publikasjoner',
      'moteplasser-og-laeringsarenaer',
      'samarbeid-og-partnerskap',
    ]);
    klient.work.areas.forEach((a, i) => {
      const region = screen.getByRole('region', { name: a.title });
      expect(region).toBe(plates[i + 1]);
      expect(region).toHaveAttribute('id', ids[i]);
    });
    expect(screen.getByRole('region', { name: klient.work.areas[0].title })).toHaveTextContent(klient.work.areas[0].note!);
  });

  test('the first plate is white, and no two plates side by side share a ground', () => {
    const { container } = render(<VartArbeid />);
    const tones = Array.from(container.querySelectorAll('[data-plate]')).map((p) => p.getAttribute('data-plate'));
    expect(tones[0]).toBe('white');
    tones.slice(1).forEach((t, i) => expect(t).not.toBe(tones[i]));
  });

  test('no copy of our own: no eyebrows, numbers or links beyond the client’s text', () => {
    const { container } = render(<VartArbeid />);
    container.querySelector('nav[aria-label="På denne siden"]')?.remove(); // the page's parts (mock 54) repeat its own headings
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
