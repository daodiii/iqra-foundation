import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import type { Event, NewsItem } from '@/lib/content';
import { Aktuelt, Arkiv } from './Aktuelt';

/* The real collections ship empty; here they hold a news item with an article, one without, a coming event and a past one. */
const news: NewsItem[] = [
  { slug: 'med-tekst', title: 'Med artikkel', date: '2026-11-01', summary: 'Ingressen.', image: null, body: 'Teksten.' },
  { slug: 'kort', title: 'Bare ingress', date: '2026-10-01', summary: 'Kort.', image: null, body: null },
];
const event = (over: Partial<Event>): Event => ({
  slug: 'e', title: 'E', start: '2026-12-03', time: '18:00', end: null, place: 'Oslo', text: 'Om arrangementet.', link: null, program: null, report: null, recording: null, image: null, area: null, ...over,
});
const events: Event[] = [
  event({ slug: 'kommer', title: 'Seminar', start: '2099-12-03', link: 'https://example.no/pamelding', program: '18.00 Velkommen' }),
  event({ slug: 'var', title: 'Panelsamtale', start: '2020-01-16', report: 'Det ble sagt mye.', recording: 'https://example.no/opptak' }),
];
vi.mock('@/lib/content', async (orig) => ({ ...(await orig<typeof import('@/lib/content')>()), getNews: () => news, getEvents: () => events }));

const t = site.pages.news;

describe('Aktuelt', () => {
  test('Alle: the client’s intro, the filter with Alle marked, news and coming events with the client’s texts', () => {
    render(<Aktuelt view="alle" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(klient.news.title);
    expect(screen.getByText(klient.news.intro)).toBeInTheDocument();
    const filter = screen.getByRole('navigation', { name: t.filterLabel });
    expect(within(filter).getAllByRole('link').map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Alle', '/aktuelt'],
      ['Nyheter', '/aktuelt/nyheter'],
      ['Arrangementer', '/aktuelt/arrangementer'],
    ]);
    expect(within(filter).getByRole('link', { current: 'page' })).toHaveTextContent('Alle');
    expect(screen.getByText(klient.news.newsText)).toBeInTheDocument();
    expect(screen.getByText(klient.news.eventsText)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Panelsamtale' })).toBeNull();
  });

  test('a news item with an article links to its page; one with only an ingress does not', () => {
    render(<Aktuelt view="nyheter" />);
    expect(screen.getByRole('link', { name: 'Med artikkel' })).toHaveAttribute('href', '/aktuelt/nyheter/med-tekst');
    expect(screen.getByRole('heading', { name: 'Bare ingress' }).querySelector('a')).toBeNull();
    expect(screen.queryByText(klient.news.eventsText)).toBeNull();
  });

  test('Arrangementer: a coming event with its programme and sign-up; the past one below as the archive, with its write-up and recording', () => {
    render(<Aktuelt view="arrangementer" />);
    const coming = screen.getByRole('heading', { name: 'Seminar' }).closest('li')!;
    expect(coming).toHaveTextContent('18.00 Velkommen');
    expect(within(coming).getByRole('link', { name: t.signup })).toHaveAttribute('href', 'https://example.no/pamelding');
    const past = screen.getByRole('heading', { name: 'Panelsamtale' }).closest('li')!;
    expect(past).toHaveTextContent('Det ble sagt mye.');
    expect(within(past).getByRole('link', { name: t.recording })).toHaveAttribute('href', 'https://example.no/opptak');
    expect(screen.queryByText(klient.news.newsText)).toBeNull();
  });

  test('the archive page: the past events only, under the client’s sentence', () => {
    render(<Arkiv />);
    expect(screen.getByText(klient.news.archiveText)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Panelsamtale' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Seminar' })).toBeNull();
  });
});
