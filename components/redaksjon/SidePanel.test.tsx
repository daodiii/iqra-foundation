import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { problems } from '@/lib/redaksjon/schema';
import { longDate, SidePanel } from './SidePanel';

const base = {
  onPublish: vi.fn(), onDate: vi.fn(), onSlug: vi.fn(),
  date: '2026-11-19', slug: 'apen-dag', liveHref: null, hasText: true,
};

describe('the side panel', () => {
  test('the checklist names what is missing, and the switch says what Av means', () => {
    const f = { title: 'Åpen dag', date: '2026-11-19', summary: '', image: { src: '/x.webp', alt: '' }, publish: false, body: '' };
    render(<SidePanel {...base} publish={false} title={f.title} summary={f.summary} image={f.image} problems={problems('nyheter', f)} />);
    const items = screen.getAllByRole('listitem').filter((li) => !li.querySelector('h3')).map((li) => [li.textContent, li.className.includes('no')]);
    expect(items).toEqual([
      ['Overskrift', false], ['Ingress', true], ['Dato', false], ['Bilde med beskrivelse', true], ['Slå på «Vis på nettsiden»', true],
    ]);
    expect(screen.getByRole('switch')).not.toBeChecked();
    expect(screen.getByText(/Av: Nyheten lagres som utkast/)).toBeInTheDocument();
    expect(screen.getByText('/aktuelt/nyheter/apen-dag')).toBeInTheDocument();
  });

  test('the card shows the post as Aktuelt will', () => {
    render(<SidePanel {...base} publish title="Åpen dag" summary="Kom innom." image={null} problems={[]} />);
    expect(screen.getByText('19. november 2026')).toBeInTheDocument();
    expect(screen.getByText('Kom innom.')).toBeInTheDocument();
    expect(longDate('2026-01-05')).toBe('5. januar 2026');
  });
});
