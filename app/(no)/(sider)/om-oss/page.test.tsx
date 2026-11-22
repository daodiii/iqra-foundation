import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { klient } from '@/content/klient.no';
import OmOss from './page';

const t = klient.about;

describe('Om Iqra Foundation', () => {
  test('the client’s title and intro, then their sections in their order, «Navnet Iqra» left out', () => {
    render(<OmOss />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.title);
    expect(screen.getByText(t.intro)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      t.purpose.title,
      t.values.title,
      t.audience.title,
      t.independent.title,
    ]);
  });

  test('«Navnet Iqra» stays off the page (the owner, 2026-11-20): neither its title nor its text', () => {
    const { container } = render(<OmOss />);
    const text = container.textContent ?? '';
    expect(text).not.toContain(t.name.title);
    expect(text).not.toContain(t.name.text);
  });

  test('every sentence and every point of the client’s text is on the page', () => {
    const { container } = render(<OmOss />);
    const text = container.textContent ?? '';
    for (const s of [t.purpose.lead, ...t.purpose.points, t.values.lead, t.values.close, t.audience.text, ...t.independent.paragraphs]) {
      expect(text).toContain(s);
    }
    const values = screen.getByRole('heading', { level: 2, name: t.values.title }).closest('section')!;
    const items = within(values).getAllByRole('listitem');
    expect(items.map((li) => li.querySelector('b')?.textContent)).toEqual(t.values.points.map((v) => v.name));
    expect(items.map((li) => li.querySelector('span')?.textContent)).toEqual(t.values.points.map((v) => v.text));
    const purpose = screen.getByRole('heading', { level: 2, name: t.purpose.title }).closest('section')!;
    expect(within(purpose).getAllByRole('listitem').map((li) => li.textContent)).toEqual(t.purpose.points);
  });

  test('each part is a plate named by its title', () => {
    const { container } = render(<OmOss />);
    for (const title of [t.purpose.title, t.values.title, t.audience.title, t.independent.title]) {
      expect(screen.getByRole('region', { name: title })).toHaveAttribute('data-plate');
    }
    expect(container.querySelectorAll('[data-plate]')).toHaveLength(5);
  });
});
