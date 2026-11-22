import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { LangProvider } from '@/components/site/Lang';
import { EN } from '@/content/copy';
import { klient } from '@/content/klient.en';
import { site } from '@/content/site.en';
import type { Event, NewsItem } from '@/lib/content';
import Home from './page';
import ForsideLayout from './layout';

/* One news item and one coming event, written in Norwegian by an editor, as the collections hold them. */
const data = vi.hoisted(() => ({ news: [] as NewsItem[], events: [] as Event[] }));
vi.mock('@/lib/content', async (orig) => ({ ...(await orig<typeof import('@/lib/content')>()), getNews: () => data.news, getEvents: () => data.events }));
vi.mock('next/font/local', () => ({ default: () => ({ variable: 'font-instrument', className: 'font-instrument' }) }));
vi.mock('next/navigation', async (orig) => ({ ...(await orig<typeof import('next/navigation')>()), usePathname: () => '/en' }));

const h = klient.home;
const page = () =>
  render(
    <LangProvider copy={EN}>
      <ForsideLayout>
        <Home />
      </ForsideLayout>
    </LangProvider>,
  );

describe('Home, in English (2026-11-22)', () => {
  test('the headline, the paragraph and the two buttons in English, leading to English pages', () => {
    page();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(h.headline);
    expect(screen.getByText(h.paragraphs[1])).toBeInTheDocument();
    expect(screen.getByRole('link', { name: h.buttons.about })).toHaveAttribute('href', '/en/about-us');
    expect(screen.getByRole('link', { name: h.buttons.events })).toHaveAttribute('href', '/en/news-and-events/events');
  });

  test('the sections under their English titles', () => {
    page();
    const main = screen.getByRole('main');
    expect(within(main).getAllByRole('heading', { level: 2 }).map((e) => e.textContent)).toEqual([h.why.title, h.create.title, h.action.title, site.pages.news.upcoming, site.pages.news.newsTitle, h.together.title]);
  });

  test('while nothing is published, the samples are English and marked «Example»', () => {
    data.news = [];
    data.events = [];
    page();
    expect(screen.getByText('Open lecture: knowledge and society')).toBeInTheDocument();
    expect(screen.getByText('A new series of open lectures this winter')).toBeInTheDocument();
    expect(screen.getAllByText(site.sample).length).toBeGreaterThanOrEqual(6);
  });

  test('what an editor wrote stays Norwegian, says so, and carries lang="nb"', () => {
    data.news = [{ slug: 'sak', title: 'En nyhet', date: '2026-11-02', summary: 'Ingress.', image: null, body: 'Tekst.' }];
    data.events = [{ slug: 'kveld', title: 'En kveld', start: '2099-01-02', time: '18:00', end: null, place: 'Oslo', text: '', link: null, program: null, report: null, recording: null, image: null, area: null }];
    page();
    expect(screen.getAllByText(site.language.inNorwegian)).toHaveLength(2);
    expect(screen.getByText('En nyhet').closest('[lang]')).toHaveAttribute('lang', 'nb');
    expect(screen.getByText('En kveld')).toHaveAttribute('lang', 'nb');
    expect(screen.getByRole('link', { name: /En nyhet/ })).toHaveAttribute('href', '/en/news-and-events/news/sak');
    expect(screen.getByText('18:00 · Oslo')).toBeInTheDocument();
    expect(screen.getByText('2 November 2026')).toBeInTheDocument();
  });

  test('the header and the foot: English menu, and the switch back to Norwegian', () => {
    page();
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: site.header.homeLabel })).toHaveAttribute('href', '/en');
    const nav = within(header).getByRole('navigation', { name: site.header.navLabel });
    const lang = within(nav).getByRole('group', { name: site.language.label });
    expect(within(lang).getByRole('link', { name: 'Norsk' })).toHaveAttribute('href', '/');
    const pages = within(nav).getAllByRole('link').filter((a) => !lang.contains(a));
    expect(pages.map((a) => a.textContent?.replace(/→/g, ''))).toEqual(['Home', 'About us', 'News and events', 'Resources', 'Contact', 'Support us']);
    const foot = screen.getByRole('contentinfo');
    expect(within(foot).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/en/privacy');
    expect(within(foot).getByRole('link', { name: 'Norsk' })).toHaveAttribute('href', '/');
  });
});
