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
    expect(container.querySelector('article')!.lastElementChild).toHaveTextContent(t.close);
  });

  test('every sentence and every point of the client’s text is on the page, in their order, the points as a list', () => {
    const { container } = render(<StottOss />);
    const text = container.textContent ?? '';
    const order = [t.intro, t.uses.lead, ...t.uses.points, t.uses.close, ...t.ways.items.map((w) => w.text), t.close].map((s) => text.indexOf(s));
    expect(order.every((i) => i > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    const uses = screen.getByRole('heading', { level: 2, name: t.uses.title }).closest('section')!;
    expect(within(uses).getAllByRole('listitem').map((li) => li.textContent)).toEqual([...t.uses.points]);
  });

  test('five stones, one per use, drawn for the eye only', () => {
    const { container } = render(<StottOss />);
    const svg = container.querySelector('[data-scene]')!;
    expect(svg.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(svg.querySelectorAll('[data-stone]')).toHaveLength(t.uses.points.length);
    expect(svg.querySelectorAll('[data-shadow]')).toHaveLength(t.uses.points.length);
    // as served, nothing is offset or hidden: the script (with motion allowed) does that
    for (const s of svg.querySelectorAll<SVGElement>('[data-stone]')) expect(s.getAttribute('style')).toBeNull();
  });

  test('the ways to give stand under «Gave», not under the other two, and AvtaleGiro is the one link', () => {
    const { container } = render(<StottOss />);
    const gave = screen.getByRole('heading', { level: 3, name: t.ways.items[0].title }).parentElement!;
    expect(within(gave).getByText(site.support.vipps.value)).toBeInTheDocument();
    expect(within(gave).getByText(site.support.vipps.label)).toBeInTheDocument();
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

  test('without JavaScript or with reduced motion nothing waits: every hiding rule is under html[data-js] with motion allowed', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'components/support/grunnmuren.module.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const at = css.indexOf('@media (prefers-reduced-motion: no-preference)');
    expect(at).toBeGreaterThan(-1);
    const before = css.slice(0, at);
    expect(before).not.toMatch(/opacity:\s*0[;\s]/);
    expect(before).not.toMatch(/--o:\s*0/);
    expect(before).not.toMatch(/position:\s*sticky/);
    expect(before).not.toMatch(/rgba\(255,\s*255,\s*255,\s*0\.28\)/);
    const block = css.slice(at);
    for (const rule of block.match(/[^{}]+\{[^{}]*(opacity:\s*0[;\s]|--o:\s*0|sticky|0\.28\))[^{}]*\}/g) ?? []) {
      expect(rule).toContain('html[data-js]');
    }
  });
});
