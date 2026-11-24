import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import Kontakt from '@/app/(no)/(sider)/kontakt/page';

const t = site.pages.contact;

describe('Kontakt: Platene', () => {
  test('the title and the page’s text on the first plate, white; «Kontakt oss» the heading over the form', () => {
    const { container } = render(<Kontakt />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(t.title);
    const first = container.querySelector('[data-plate]') as HTMLElement;
    expect(first).toHaveAttribute('data-plate', 'white');
    expect(first.contains(h1)).toBe(true);
    expect(within(first).getByText(t.description)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([t.form.title]);
    const h2 = screen.getByRole('heading', { level: 2 });
    expect(h2.closest('section')?.querySelector('[data-form]')).not.toBeNull();
  });

  test('each part is a plate named by its title, no two neighbours in one ground', () => {
    const { container } = render(<Kontakt />);
    expect(screen.getByRole('region', { name: t.title })).toHaveAttribute('data-plate', 'white');
    expect(screen.getByRole('region', { name: `${t.emailLabel} ${t.phoneLabel} ${t.addressLabel}` })).toHaveAttribute('data-plate', 'navy');
    expect(screen.getByRole('region', { name: t.form.title })).toHaveAttribute('data-plate', 'white');
    const tones = Array.from(container.querySelectorAll('[data-plate]')).map((s) => s.getAttribute('data-plate'));
    expect(tones).toHaveLength(3);
    tones.forEach((tone, i) => i && expect(tone).not.toBe(tones[i - 1]));
  });

  test('three ways in order — the e-mail a mailto, the number a tel, the post box with the org.nr', () => {
    const { container } = render(<Kontakt />);
    const ways = Array.from(container.querySelectorAll('[data-way]'));
    expect(ways.map((w) => w.getAttribute('data-way'))).toEqual(['epost', 'telefon', 'adresse']);
    const way = (name: string) => within(container.querySelector(`[data-way="${name}"]`) as HTMLElement);
    expect(way('epost').getByText(t.emailLabel)).toBeInTheDocument();
    expect(container.querySelector('[data-way="epost"]')).toHaveAttribute('href', `mailto:${klient.contact.email}`);
    expect(way('epost').getByText(klient.contact.email)).toBeInTheDocument();
    expect(way('telefon').getByText(t.phoneLabel)).toBeInTheDocument();
    expect(container.querySelector('[data-way="telefon"]')).toHaveAttribute('href', 'tel:+4794143585');
    expect(way('telefon').getByText(klient.contact.phone)).toBeInTheDocument();
    const adresse = container.querySelector('[data-way="adresse"]') as HTMLElement;
    expect(adresse.tagName).toBe('DIV');
    expect(adresse).toHaveTextContent(t.addressLabel);
    expect(adresse).toHaveTextContent(`${klient.contact.postbox}, ${klient.contact.postcode}`);
    expect(adresse).toHaveTextContent(`${t.orgnrLabel} ${klient.contact.orgnr}`);
  });

  test('no placeholder and no map', () => {
    const { container } = render(<Kontakt />);
    expect(container.textContent).not.toMatch(/\[[^\]]+\]/);
    expect(container.querySelector('img, [data-pin]')).toBeNull();
    expect(container).not.toHaveTextContent(t.map.credit);
    for (const l of site.contact.follow) expect(screen.queryByText(l.name, { exact: true })).toBeNull();
  });

  test('the form is drawn, not wired: no control on the page, nothing focusable in it, its five fields and Send as text hidden from a reader, the notice outside and read', () => {
    const { container } = render(<Kontakt />);
    const f = t.form;
    expect(container.querySelectorAll('form, input, textarea, button, select')).toHaveLength(0);
    const drawn = container.querySelector('[data-form]') as HTMLElement;
    expect(drawn).toHaveAttribute('aria-hidden', 'true');
    for (const word of [f.name, f.email, f.mobile, f.orgnr, f.message]) expect(drawn).toHaveTextContent(word);
    const send = container.querySelector('[data-send]') as HTMLElement;
    expect(send).toHaveAttribute('aria-hidden', 'true');
    expect(send).toHaveAttribute('data-knapp', 'fill');
    expect(send).toHaveTextContent(f.send);
    for (const el of [drawn, send]) expect(el.querySelectorAll('a, [tabindex], [contenteditable]')).toHaveLength(0);
    const notice = screen.getByText(f.notice);
    expect(drawn.contains(notice)).toBe(false);
    expect(send.contains(notice)).toBe(false);
    expect(notice.closest('[aria-hidden]')).toBeNull();
  });
});
