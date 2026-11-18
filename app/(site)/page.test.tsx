import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import type { Event, NewsItem } from '@/lib/content';
import Home from './page';

/* The real collections ship empty; here there are four news items and four coming events, so the front page has to pick three of each. */
const news: NewsItem[] = [1, 2, 3, 4].map((n) => ({ slug: `n${n}`, title: `Nyhet ${n}`, date: `2026-11-0${n}`, summary: 'Ingress.', image: null, body: null }));
const events: Event[] = [1, 2, 3, 4].map((n) => ({
  slug: `e${n}`, title: `Arrangement ${n}`, start: `2099-01-0${n}`, time: null, end: null, place: 'Oslo', text: 'Om det.', link: null, program: null, report: null, recording: null, image: null, area: null,
}));
vi.mock('@/lib/content', async (orig) => ({ ...(await orig<typeof import('@/lib/content')>()), getNews: () => news, getEvents: () => events }));

const h = klient.home;

describe('Hjem', () => {
  test('one h1, the name; the client’s headline, two paragraphs and two buttons; then their sections in their order', () => {
    render(<Home />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText(h.headline)).toBeInTheDocument();
    for (const p of h.paragraphs) expect(screen.getByText(p)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: h.buttons.about })).toHaveAttribute('href', '/om-oss');
    expect(screen.getByRole('link', { name: h.buttons.events })).toHaveAttribute('href', '/aktuelt/arrangementer');
    expect(screen.getAllByRole('heading', { level: 2 }).map((e) => e.textContent)).toEqual([h.why.title, h.create.title, h.action.title, h.news.title, h.together.title]);
  });

  test('«Dette ønsker vi å skape» replaces the four boxes: the client’s intro and three areas, each with an icon; none of the four areas is left', () => {
    const { container } = render(<Home />);
    const skape = container.querySelector('section#skape') as HTMLElement;
    expect(skape).toHaveTextContent(h.create.intro);
    const items = within(skape).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    h.create.areas.forEach((a, i) => {
      expect(items[i]).toHaveTextContent(a.title);
      expect(items[i]).toHaveTextContent(a.text);
      expect(items[i].querySelector('svg[data-ikon]')).not.toBeNull();
    });
    for (const old of ['Samfunnsdeltakelse', 'Visjon', 'Misjon']) expect(container.textContent).not.toContain(old);
    expect(container.querySelector('[data-material="water"]')).toBeNull();
  });

  test('every other text of the client’s front page is there, word for word', () => {
    const { container } = render(<Home />);
    const text = container.textContent ?? '';
    for (const s of [...h.why.paragraphs, ...h.action.items.flatMap((a) => [a.title, a.text]), h.news.intro, h.together.text]) expect(text).toContain(s);
  });

  test('Aktuelt: the three latest news and the three next events, and the way on to all of them', () => {
    const { container } = render(<Home />);
    const aktuelt = container.querySelector('section#aktuelt') as HTMLElement;
    const titles = within(aktuelt).getAllByRole('heading', { level: 3 }).map((e) => e.textContent);
    expect(titles).toEqual([site.pages.news.newsTitle, 'Nyhet 1', 'Nyhet 2', 'Nyhet 3', site.pages.news.upcoming, 'Arrangement 1', 'Arrangement 2', 'Arrangement 3']);
    expect(within(aktuelt).getByRole('link', { name: h.news.all })).toHaveAttribute('href', '/aktuelt/nyheter');
    expect(within(aktuelt).getByRole('link', { name: site.pages.home.allEvents })).toHaveAttribute('href', '/aktuelt/arrangementer');
  });

  test('«Sammen kan vi gjøre en forskjell» and its two buttons', () => {
    const { container } = render(<Home />);
    const sammen = container.querySelector('section#sammen') as HTMLElement;
    expect(within(sammen).getByRole('link', { name: h.together.buttons.partner })).toHaveAttribute('href', site.cta.partner.href);
    expect(within(sammen).getByRole('link', { name: h.together.buttons.support })).toHaveAttribute('href', '/stott-oss');
  });
});
