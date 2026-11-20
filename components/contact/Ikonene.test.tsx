import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import { Ikonene } from './Ikonene';

const t = site.pages.contact;

describe('Kontakt: Ikonene', () => {
  test('«Kontakt oss» is the page’s one heading, on the form', () => {
    const { container } = render(<Ikonene />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(t.form.title);
    expect(container.querySelectorAll('h1, h2, h3')).toHaveLength(1);
    expect(h1.parentElement?.querySelector('[data-form]')).not.toBeNull();
  });

  test('three bands in order — the e-mail a mailto, the number a tel, the post box with the org.nr — each with its drawing hidden from a reader', () => {
    const { container } = render(<Ikonene />);
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
    for (const w of ways) expect(w.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  test('no placeholder and no map: the mock has neither', () => {
    const { container } = render(<Ikonene />);
    expect(container.textContent).not.toMatch(/\[[^\]]+\]/);
    expect(container.querySelector('img, [data-pin]')).toBeNull();
    expect(container).not.toHaveTextContent(t.map.credit);
  });

  test('the form is drawn, not wired: no control on the page, nothing focusable in it, its five fields and Send as text hidden from a reader, the notice outside and read', () => {
    const { container } = render(<Ikonene />);
    const f = t.form;
    expect(container.querySelectorAll('form, input, textarea, button, select')).toHaveLength(0);
    const drawn = container.querySelector('[data-form]') as HTMLElement;
    expect(drawn).toHaveAttribute('aria-hidden', 'true');
    for (const word of [f.name, f.email, f.mobile, f.orgnr, f.message]) expect(drawn).toHaveTextContent(word);
    const send = container.querySelector('[data-send]') as HTMLElement;
    expect(send).toHaveAttribute('aria-hidden', 'true');
    expect(send).toHaveTextContent(f.send);
    for (const el of [drawn, send]) expect(el.querySelectorAll('a, [tabindex], [contenteditable]')).toHaveLength(0);
    const notice = screen.getByText(f.notice);
    expect(drawn.contains(notice)).toBe(false);
    expect(send.contains(notice)).toBe(false);
    expect(notice.closest('[aria-hidden]')).toBeNull();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(drawn.contains(h1)).toBe(false);
  });
});
