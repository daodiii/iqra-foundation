import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { Footer } from './Footer';

describe('Footer', () => {
  test('the nine links again, the logo reversed, and the facts', () => {
    render(<Footer />);
    const nav = screen.getByRole('navigation', { name: site.footer.navLabel });
    expect(within(nav).getAllByRole('link')).toHaveLength(9);
    expect(within(nav).getByRole('link', { name: 'Støtt oss' })).toHaveAttribute('href', '/stott-oss');
    expect(screen.getByRole('link', { name: site.header.homeLabel }).querySelector('img')).toHaveAttribute('data-logo', 'navy');
    expect(screen.getByText(site.contact.orgnr)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: site.contact.email })).toHaveAttribute('href', `mailto:${site.contact.email}`);
    expect(screen.getByText(site.place)).toBeInTheDocument();
  });

  test('the red thread: the name, and the line with a crimson dot for each full stop and the period kept for a screen reader', () => {
    const { container } = render(<Footer />);
    expect(screen.getByText(brief.thread.name)).toBeInTheDocument();
    const line = container.querySelector('[data-thread-line]')!;
    // Character for character the brief's line: the dots add nothing to the text, the hidden periods keep it whole.
    expect(line.textContent).toBe(brief.thread.line);
    const stops = line.querySelectorAll('[data-stop]');
    expect(stops).toHaveLength(4);
    for (const stop of stops) expect(stop).toHaveAttribute('aria-hidden', 'true');
    for (const hidden of line.querySelectorAll('.visually-hidden')) expect(hidden.textContent).toMatch(/^\. ?$/);
  });
});
