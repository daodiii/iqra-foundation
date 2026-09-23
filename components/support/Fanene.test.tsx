import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Fanene, lines } from './Fanene';

describe('Støtt oss: the banners', () => {
  test('the question is the heading; the three ways are three sections in the owner\'s order, each named, each with its number', () => {
    const { container } = render(<Fanene />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(site.pages.support.question);
    const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(names).toEqual([site.support.ways.account, site.support.ways.vipps, site.support.ways.avtale]);
    const sections = container.querySelectorAll('section');
    expect(sections).toHaveLength(3);
    expect(sections[0]).toHaveTextContent(site.support.account.label);
    expect(sections[0]).toHaveTextContent(site.support.account.value);
    expect(sections[1]).toHaveTextContent(site.support.vipps.label);
    expect(sections[1]).toHaveTextContent(site.support.vipps.value);
    expect(sections[2]).toHaveTextContent(site.support.avtale.button);
    expect(container.querySelector('[data-plates]')).not.toBeNull();
  });

  test('the cloths are navy, white and burgundy, left to right, each with the guide\'s logo for its ground', () => {
    const { container } = render(<Fanene />);
    const cloths = Array.from(container.querySelectorAll('[data-fane]')).map((b) => b.getAttribute('data-fane'));
    expect(cloths).toEqual(['navy', 'white', 'crimson']);
    expect(container.querySelectorAll('img')).toHaveLength(3);
  });

  test('AvtaleGiro is the one way out: a link to the foundation’s agreement, and nothing on the page that pretends to take a payment', () => {
    const { container } = render(<Fanene />);
    expect(container.querySelectorAll('input, button, select, textarea, form')).toHaveLength(0);
    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent(site.support.avtale.button);
    expect(links[0]).toHaveAttribute('href', site.support.avtale.href);
    // it stands on the third banner, where the other two carry their number
    expect(container.querySelectorAll('section')[2]).toContainElement(links[0]);
  });

  test('a number is read whole and shown in its lines: an account number breaks after its second group, a placeholder does not', () => {
    expect(lines('1234 56 78903')).toEqual(['1234 56', '78903']);
    expect(lines('[KONTO]')).toEqual(['[KONTO]']);
    expect(lines('12345')).toEqual(['12345']);
    render(<Fanene />);
    expect(screen.getByText(site.support.vipps.value, { selector: '.visually-hidden' })).toBeInTheDocument();
  });
});
