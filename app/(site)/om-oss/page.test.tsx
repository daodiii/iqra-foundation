import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { klient } from '@/content/klient.no';
import OmOss from './page';

const t = klient.about;

describe('Om Iqra Foundation', () => {
  test('the client’s title and intro, then their five sections in their order', () => {
    render(<OmOss />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.title);
    expect(screen.getByText(t.intro)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      t.name.title,
      t.purpose.title,
      t.values.title,
      t.audience.title,
      t.independent.title,
    ]);
  });

  test('every sentence and every point of the client’s text is on the page', () => {
    const { container } = render(<OmOss />);
    const text = container.textContent ?? '';
    for (const s of [t.name.text, t.purpose.lead, ...t.purpose.points, t.values.lead, t.values.close, t.audience.text, ...t.independent.paragraphs]) {
      expect(text).toContain(s);
    }
    const values = screen.getByRole('heading', { level: 2, name: t.values.title }).closest('section')!;
    const items = within(values).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(t.values.points.map((v) => `${v.name} – ${v.text}`));
  });
});
