import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Kart, Kortene } from './Kortene';

const t = site.pages.contact;
const c = site.contact;
const secondLine = `${c.address.postcode} ${site.place}`;

describe('Kontakt: the cards', () => {
  test('«Kontakt» is the page’s name, unseen; seven cards in reading order — the map, the address, the e-mail, the form under «Kontakt oss», the number, the hours, the way there — each named', () => {
    const { container } = render(<Kortene />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(t.title);
    expect(h1).toHaveClass('visually-hidden');
    const cards = Array.from(container.querySelectorAll('[data-card]')).map((el) => el.getAttribute('data-card'));
    expect(cards).toEqual(['kart', 'adresse', 'epost', 'skjema', 'telefon', 'tider', 'vei']);
    const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(names).toEqual([t.addressLabel, t.emailLabel, t.form.title, t.phoneLabel, t.hoursLabel, t.transitLabel]);
  });

  test('every fact is on its card: the address in two lines with the place real and the org.nr under it, the e-mail a mailto, the number a tel, the hours, the way there', () => {
    const { container } = render(<Kortene />);
    const card = (name: string) => within(container.querySelector(`[data-card="${name}"]`) as HTMLElement);
    expect(card('adresse').getByText(c.address.street)).toBeInTheDocument();
    expect(card('adresse').getByText(secondLine)).toBeInTheDocument();
    expect(card('adresse').getByText(`${t.orgnrLabel} ${c.orgnr}`)).toBeInTheDocument();
    expect(card('epost').getByRole('link', { name: c.email })).toHaveAttribute('href', `mailto:${c.email}`);
    expect(card('telefon').getByRole('link', { name: c.phone })).toHaveAttribute('href', `tel:${c.phone.replace(/\s/g, '')}`);
    expect(card('tider').getByText(c.hours)).toBeInTheDocument();
    expect(card('vei').getByText(c.transit)).toBeInTheDocument();
  });

  test('where to follow is named on the e-mail card, as plain text while the addresses are bracketed — no link goes nowhere', () => {
    const { container } = render(<Kortene />);
    const epost = container.querySelector('[data-card="epost"]') as HTMLElement;
    expect(epost).toHaveTextContent(t.followLabel);
    for (const l of c.follow) expect(within(epost).getByText(l.name)).toBeInTheDocument();
    expect(epost.querySelectorAll('a')).toHaveLength(1);
  });

  test('the map card: the map at both widths with its alt, the licence’s credit as a link, the address written on it — and NO pin while the address is bracketed', () => {
    const { container } = render(<Kortene />);
    const kart = container.querySelector('[data-card="kart"]') as HTMLElement;
    const img = within(kart).getByRole('img', { name: t.map.alt });
    expect(img).toHaveAttribute('src', '/kart-1024.webp');
    expect(img).toHaveAttribute('srcset', '/kart-1024.webp 1024w, /kart-1536.webp 1536w');
    expect(img).toHaveAttribute('sizes');
    expect(within(kart).getByRole('link', { name: t.map.credit })).toHaveAttribute('href', t.map.creditHref);
    expect(kart).toHaveTextContent(`${c.address.street}, ${secondLine}`);
    expect(kart.querySelector('[data-pin]')).toBeNull();
  });

  test('the pin lands on the map once the address is real', () => {
    const { container } = render(<Kart located />);
    expect(container.querySelector('[data-pin]')).not.toBeNull();
    expect(container.querySelector('[data-pin]')).toHaveAttribute('aria-hidden', 'true');
  });

  test('the form is drawn, not wired: its five fields and Send as text, no control on the page, the drawing hidden from a reader, the heading and the honest line outside it', () => {
    const { container } = render(<Kortene />);
    expect(container.querySelectorAll('form, input, textarea, button, select')).toHaveLength(0);
    const drawn = container.querySelector('[data-form]') as HTMLElement;
    expect(drawn).toHaveAttribute('aria-hidden', 'true');
    for (const word of [t.form.name, t.form.email, t.form.mobile, t.form.orgnr, t.form.message, t.form.send]) expect(drawn).toHaveTextContent(word);
    const skjema = container.querySelector('[data-card="skjema"]') as HTMLElement;
    const heading = within(skjema).getByRole('heading', { level: 2, name: t.form.title });
    expect(drawn.contains(heading)).toBe(false);
    const notice = screen.getByText(t.form.notice);
    expect(drawn.contains(notice)).toBe(false);
  });
});
