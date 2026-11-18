import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { isPlaceholder as bracketed } from '@/lib/placeholder';
import { Fanene, lines } from './Fanene';

describe('Støtt oss: the banners under «Gave»', () => {
  test('the ways hang in the owner\'s order, each named, each with its number; a bracketed account number does not hang', () => {
    const { container } = render(<Fanene />);
    const names = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    const shown = bracketed(site.support.account.value)
      ? [site.support.ways.vipps, site.support.ways.avtale]
      : [site.support.ways.account, site.support.ways.vipps, site.support.ways.avtale];
    expect(names).toEqual(shown);
    const vipps = container.querySelector('[aria-labelledby="fane-vipps"]')!;
    expect(vipps).toHaveTextContent(site.support.vipps.label);
    expect(vipps).toHaveTextContent(site.support.vipps.value);
    expect(container.querySelector('[aria-labelledby="fane-avtale"]')).toHaveTextContent(site.support.avtale.button);
    expect(container).not.toHaveTextContent('[');
    expect(container.querySelector('[data-plates]')).not.toBeNull();
  });

  test('each way keeps its own cloth (account navy, Vipps white, AvtaleGiro burgundy) and the guide\'s logo for that ground', () => {
    const { container } = render(<Fanene />);
    const cloths = Array.from(container.querySelectorAll('[data-fane]')).map((b) => b.getAttribute('data-fane'));
    expect(cloths).toEqual(bracketed(site.support.account.value) ? ['white', 'crimson'] : ['navy', 'white', 'crimson']);
    expect(container.querySelectorAll('img')).toHaveLength(cloths.length);
  });

  test('AvtaleGiro is the one way out: a link to the foundation’s agreement, and nothing that pretends to take a payment', () => {
    const { container } = render(<Fanene />);
    expect(container.querySelectorAll('input, button, select, textarea, form')).toHaveLength(0);
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent(site.support.avtale.button);
    expect(links[0]).toHaveAttribute('href', site.support.avtale.href);
    expect(container.querySelector('[aria-labelledby="fane-avtale"]')).toContainElement(links[0]);
  });

  test('a number is read whole and shown in its lines: an account number breaks after its second group, a placeholder does not', () => {
    expect(lines('1234 56 78903')).toEqual(['1234 56', '78903']);
    expect(lines('[KONTO]')).toEqual(['[KONTO]']);
    expect(lines('12345')).toEqual(['12345']);
    render(<Fanene />);
    expect(screen.getByText(site.support.vipps.value, { selector: '.visually-hidden' })).toBeInTheDocument();
  });
});
