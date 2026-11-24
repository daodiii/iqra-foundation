import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { HONEYPOT, LIMITS, TIMER } from '@/lib/kontakt/skjema';

const { sendMessage } = vi.hoisted(() => ({ sendMessage: vi.fn() }));
vi.mock('@/components/contact/send-action', () => ({ sendMessage }));
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
    expect(h2.closest('section')?.querySelector('form[data-form]')).not.toBeNull();
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

  test('the form is real: five labelled controls and Send, the three required ones marked, the limits set', () => {
    render(<Kontakt />);
    const f = t.form;
    const form = screen.getByRole('region', { name: f.title }).querySelector('form') as HTMLFormElement;
    expect(form).not.toBeNull();
    expect(form.closest('[aria-hidden]')).toBeNull();
    const name = screen.getByRole('textbox', { name: f.name });
    const email = screen.getByRole('textbox', { name: f.email });
    const mobile = screen.getByRole('textbox', { name: f.mobile });
    const orgnr = screen.getByRole('textbox', { name: f.orgnr });
    const message = screen.getByRole('textbox', { name: f.message });
    expect(message.tagName).toBe('TEXTAREA');
    expect(email).toHaveAttribute('type', 'email');
    expect(mobile).toHaveAttribute('type', 'tel');
    for (const el of [name, email, message]) expect(el).toBeRequired();
    for (const el of [mobile, orgnr]) expect(el).not.toBeRequired();
    expect(name).toHaveAttribute('maxlength', String(LIMITS.navn));
    expect(message).toHaveAttribute('maxlength', String(LIMITS.melding));
    const send = screen.getByRole('button', { name: f.send });
    expect(send).toHaveAttribute('type', 'submit');
    expect(send).toHaveAttribute('data-knapp', 'fill');
    expect(screen.getAllByRole('textbox')).toHaveLength(5);
  });

  test('the honeypot is out of reach: hidden from a reader, not in the tab order', () => {
    const { container } = render(<Kontakt />);
    const hp = container.querySelector(`input[name="${HONEYPOT}"]`) as HTMLInputElement;
    expect(hp.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(hp).toHaveAttribute('tabindex', '-1');
    expect(hp).toHaveAttribute('autocomplete', 'off');
  });

  test('before a send the status line is empty, and nothing claims the form is unconnected', () => {
    render(<Kontakt />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(document.body).not.toHaveTextContent('ikke koblet til');
  });
});

describe('Kontakt: after a send', () => {
  const wait = { timeout: 5000 };
  const fill = () => {
    const f = t.form;
    fireEvent.change(screen.getByRole('textbox', { name: f.name }), { target: { value: 'Kari' } });
    fireEvent.change(screen.getByRole('textbox', { name: f.email }), { target: { value: 'kari@example.no' } });
    fireEvent.change(screen.getByRole('textbox', { name: f.message }), { target: { value: 'Hei' } });
    fireEvent.click(screen.getByRole('button', { name: f.send }));
  };
  const values = { navn: 'Kari', epost: 'kari@example.no', mobil: '', orgnr: '', melding: 'Hei' };

  test('a failure says so, links the e-mail address, and keeps what was typed', async () => {
    sendMessage.mockResolvedValueOnce({ status: 'failed', values });
    render(<Kontakt />);
    fill();
    const status = await screen.findByText(t.form.failed, { exact: false }, wait);
    expect(status).toHaveAttribute('role', 'status');
    expect(within(status).getByRole('link', { name: klient.contact.email })).toHaveAttribute('href', `mailto:${klient.contact.email}`);
    expect(status).not.toHaveTextContent(t.form.sent);
    await waitFor(() => expect(screen.getByRole('textbox', { name: t.form.message })).toHaveValue('Hei'), wait);
    expect(screen.getByRole('textbox', { name: t.form.name })).toHaveValue('Kari');
  });

  test('when the action itself breaks (a dropped connection, a new deploy) the form still says it failed, keeping what was typed', async () => {
    sendMessage.mockRejectedValueOnce(new Error('Failed to fetch'));
    render(<Kontakt />);
    fill();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(t.form.failed), wait);
    expect(within(screen.getByRole('status')).getByRole('link', { name: klient.contact.email })).toHaveAttribute('href', `mailto:${klient.contact.email}`);
    await waitFor(() => expect(screen.getByRole('textbox', { name: t.form.message })).toHaveValue('Hei'), wait);
  });

  test('a refused field is marked and the line says so', async () => {
    sendMessage.mockResolvedValueOnce({ status: 'invalid', invalid: ['epost'], values });
    render(<Kontakt />);
    fill();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(t.form.invalid), wait);
    expect(screen.getByRole('textbox', { name: t.form.email })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: t.form.name })).not.toHaveAttribute('aria-invalid');
  });

  test('a send tells the server how long the page has been open (the too-fast check)', async () => {
    sendMessage.mockResolvedValueOnce({ status: 'sent' });
    render(<Kontakt />);
    fill();
    await waitFor(() => expect(sendMessage).toHaveBeenCalled(), wait);
    const fd = sendMessage.mock.calls.at(-1)?.[1] as FormData;
    expect(Number(fd.get(TIMER))).toBeGreaterThan(0);
  });

  test('only a send the server confirms reads as sent', async () => {
    sendMessage.mockResolvedValueOnce({ status: 'sent' });
    render(<Kontakt />);
    fill();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(t.form.sent), wait);
    expect(screen.getByRole('status')).not.toHaveTextContent(t.form.failed);
  });

  test('once sent, the fields step aside for the confirmation: out of reach, the sent line shown large', async () => {
    sendMessage.mockResolvedValueOnce({ status: 'sent' });
    const { container } = render(<Kontakt />);
    expect(container.querySelector('[data-done]')).toBeNull();
    fill();
    await waitFor(() => expect(container.querySelector('[data-done]')).not.toBeNull(), wait);
    const form = container.querySelector('form[data-form]') as HTMLElement;
    expect(form).toHaveAttribute('data-sent');
    expect(screen.getByRole('textbox', { name: t.form.name, hidden: true }).closest('[inert]')).not.toBeNull();
    expect(container.querySelector('[data-done]')).toHaveTextContent(t.form.sent);
    expect(screen.getByRole('status').closest('[inert]')).toBeNull();
  });
});
