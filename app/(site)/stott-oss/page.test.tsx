import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { isPlaceholder } from '@/lib/placeholder';
import StottOss from './page';

const t = klient.support;

describe('Støtt oss', () => {
  test('the client’s title and intro, then their two sections in their order, and their last line last', () => {
    const { container } = render(<StottOss />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t.title);
    expect(screen.getByText(t.intro)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([t.uses.title, t.ways.title]);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(t.ways.items.map((w) => w.title));
    expect(container.querySelector('article')!.lastElementChild).toHaveTextContent(t.close);
  });

  test('every sentence and every point of the client’s text is on the page, the points as a list', () => {
    const { container } = render(<StottOss />);
    const text = container.textContent ?? '';
    for (const s of [t.uses.lead, ...t.uses.points, t.uses.close, ...t.ways.items.map((w) => w.text), t.close]) {
      expect(text).toContain(s);
    }
    const uses = screen.getByRole('heading', { level: 2, name: t.uses.title }).closest('section')!;
    expect(within(uses).getAllByRole('listitem').map((li) => li.textContent)).toEqual([...t.uses.points]);
  });

  test('the ways to give hang under «Gave», not under the other two', () => {
    render(<StottOss />);
    const gave = screen.getByRole('heading', { level: 3, name: t.ways.items[0].title }).parentElement!;
    expect(within(gave).getByText(site.support.vipps.value, { selector: '.visually-hidden' })).toBeInTheDocument();
    expect(within(gave).getByRole('link', { name: site.support.avtale.button })).toHaveAttribute('href', site.support.avtale.href);
    for (const w of t.ways.items.slice(1)) {
      const way = screen.getByRole('heading', { level: 3, name: w.title }).parentElement!;
      expect(way.querySelector('[data-plates]')).toBeNull();
    }
  });

  test('no placeholder on the page: a bracketed account number waits for the client (Q6), a real one hangs', () => {
    const { container } = render(<StottOss />);
    expect(container.textContent).not.toMatch(/\[[^\]]*\]/);
    const account = site.support.account.value;
    if (isPlaceholder(account)) expect(container.textContent).not.toContain(account);
    else expect(container.textContent).toContain(account);
  });
});
