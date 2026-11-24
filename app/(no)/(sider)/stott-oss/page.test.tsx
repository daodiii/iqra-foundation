import { readFileSync } from 'node:fs';
import path from 'node:path';
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
    const plates = container.querySelectorAll('[data-plate]');
    expect(plates[plates.length - 1]).toHaveTextContent(t.close);
  });

  test('each part is a plate named by its title, white first, no two neighbours in one ground, the last line on crimson', () => {
    const { container } = render(<StottOss />);
    const plates = Array.from(container.querySelectorAll<HTMLElement>('[data-plate]'));
    expect(plates.map((p) => p.dataset.plate)).toEqual(['white', 'navy', 'white', 'rod']);
    expect(screen.getByRole('region', { name: t.title })).toBe(plates[0]);
    expect(screen.getByRole('region', { name: t.uses.title })).toBe(plates[1]);
    expect(screen.getByRole('region', { name: t.ways.title })).toBe(plates[2]);
    expect(screen.getByRole('region', { name: t.close })).toBe(plates[3]);
    // the old anchors still lead to their parts
    expect(container.querySelector('#bidraget')).toHaveTextContent(t.uses.title);
    expect(container.querySelector('#bidra')).toHaveTextContent(t.ways.title);
  });

  test('every sentence and every point of the client’s text is on the page, in their order, the points as a list', () => {
    const { container } = render(<StottOss />);
    container.querySelector('nav[aria-label="På denne siden"]')?.remove(); // the page's parts (mock 54) repeat its own headings
    const text = container.textContent ?? '';
    const order = [t.intro, t.uses.lead, ...t.uses.points, t.uses.close, ...t.ways.items.map((w) => w.text), t.close].map((s) => text.indexOf(s));
    expect(order.every((i) => i > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    const uses = screen.getByRole('region', { name: t.uses.title });
    expect(within(uses).getAllByRole('listitem').map((li) => li.textContent)).toEqual([...t.uses.points]);
  });

  test('the ways to give stand under «Gave», not under the other two, the Vipps number set big, and AvtaleGiro is the one link', () => {
    const { container } = render(<StottOss />);
    container.querySelector('nav[aria-label="På denne siden"]')?.remove(); // the page's parts (mock 54) repeat its own headings
    const gave = screen.getByRole('heading', { level: 3, name: t.ways.items[0].title }).parentElement!;
    expect(within(gave).getByText(site.support.vipps.value)).toBeInTheDocument();
    expect(within(gave).getByText(site.support.vipps.label)).toBeInTheDocument();
    expect(gave.querySelector('[data-num="vipps"]')).toHaveTextContent(site.support.vipps.value);
    expect(within(gave).getByRole('link', { name: site.support.avtale.button })).toHaveAttribute('href', site.support.avtale.href);
    for (const w of t.ways.items.slice(1)) {
      const way = screen.getByRole('heading', { level: 3, name: w.title }).parentElement!;
      expect(way.querySelector('[data-give]')).toBeNull();
    }
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(container.querySelectorAll('form, input, button, select, textarea')).toHaveLength(0);
  });

  test('no placeholder on the page: a bracketed account number waits for the client (Q6), a real one stands', () => {
    const { container } = render(<StottOss />);
    expect(container.textContent).not.toMatch(/\[[^\]]*\]/);
    const account = site.support.account.value;
    if (isPlaceholder(account)) expect(container.textContent).not.toContain(account);
    else expect(container.textContent).toContain(account);
  });

  test('nothing on the page is hidden on a phone: the intro shows at every width', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'components/support/stott-plater.module.css'), 'utf8');
    expect(css).not.toMatch(/display:\s*none/);
    expect(css).not.toMatch(/visibility:\s*hidden/);
  });
});
