import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { PageTitle } from './PageTitle';

// The setup turns `soft` into a no-op for every component test; here the hyphen is the point.
vi.mock('@/lib/soft', async (importOriginal) => importOriginal());

describe('PageTitle', () => {
  test('a long compound may break at its joint (a soft hyphen), and the heading is still named by the word whole', () => {
    render(<PageTitle href="/arrangementer">Arrangementer</PageTitle>);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveAccessibleName('Arrangementer');
    expect(h1.textContent).toBe('Arrange­menter');
  });

  test('a title with no long compound is left as written', () => {
    render(<PageTitle href="/om-oss">Om Iqra Foundation</PageTitle>);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toBe('Om Iqra Foundation');
    expect(h1).toHaveAccessibleName('Om Iqra Foundation');
  });
});
