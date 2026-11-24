import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { klient } from '@/content/klient.no';
import { site } from '@/content/site.no';
import type { Event, NewsItem } from '@/lib/content';
import Home from './page';
import ForsideLayout from './layout';

/* The real collections ship empty; here there are four news items and four coming events, so the front page has to pick three of each. */
const data = vi.hoisted(() => ({ news: [] as NewsItem[], events: [] as Event[] }));
const four = {
  news: [1, 2, 3, 4].map((n) => ({ slug: `n${n}`, title: `Nyhet ${n}`, date: `2026-11-0${n}`, summary: `Ingress ${n}.`, image: null, body: n === 1 ? 'Tekst.' : null })),
  events: [1, 2, 3, 4].map((n) => ({
    slug: `e${n}`, title: `Arrangement ${n}`, start: `2099-01-0${n}`, time: n === 1 ? '18:00' : null, end: null, place: 'Oslo', text: 'Om det.', link: null, program: null, report: null, recording: null, image: null, area: null,
  })),
};
vi.mock('@/lib/content', async (orig) => ({ ...(await orig<typeof import('@/lib/content')>()), getNews: () => data.news, getEvents: () => data.events }));
vi.mock('next/font/local', () => ({ default: () => ({ variable: 'font-instrument', className: 'font-instrument' }) }));

const h = klient.home;
const page = () => render(<ForsideLayout><Home /></ForsideLayout>);

describe('Hjem, the owner’s redesign', () => {
  test('one h1, the client’s headline; the hero’s paragraph and its two buttons', () => {
    data.news = four.news;
    data.events = four.events;
    page();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(h.headline);
    expect(screen.getByText(h.paragraphs[1])).toBeInTheDocument();
    expect(screen.getByRole('link', { name: h.buttons.about })).toHaveAttribute('href', '/om-oss');
    expect(screen.getByRole('link', { name: h.buttons.events })).toHaveAttribute('href', '/aktuelt/arrangementer');
  });

  test('the sections in the client’s order, every one named by its title', () => {
    page();
    const main = screen.getByRole('main');
    expect(within(main).getAllByRole('heading', { level: 2 }).map((e) => e.textContent)).toEqual([h.why.title, h.create.title, h.action.title, site.pages.news.upcoming, site.pages.news.newsTitle, h.together.title]);
    for (const id of ['hvorfor', 'skape', 'handling', 'aktuelt', 'sammen']) expect(main.querySelector(`section#${id}`)).not.toBeNull();
  });

  test('every text of the client’s front page is there, word for word', () => {
    const { container } = page();
    const text = container.textContent ?? '';
    for (const s of [
      ...h.paragraphs,
      ...h.why.paragraphs,
      h.create.title,
      h.create.intro,
      ...h.create.areas.flatMap((a) => [a.title, a.text]),
      ...h.action.items.flatMap((a) => [a.title, a.text]),
      // «Aktuelt» and its intro left the front page (the owner, 2026-11-20)
      h.together.title,
      h.together.text,
    ])
      expect(text).toContain(s);
  });

  test('«Dette ønsker vi å skape»: three panels, each its title, its text and its icon', () => {
    const { container } = page();
    const skape = container.querySelector('section#skape') as HTMLElement;
    const panels = skape.querySelectorAll('article');
    expect(panels).toHaveLength(3);
    h.create.areas.forEach((a, i) => {
      expect(panels[i]).toHaveTextContent(a.title);
      expect(panels[i]).toHaveTextContent(a.text);
      expect(panels[i].querySelector('svg[data-ikon]')).not.toBeNull();
    });
  });

  test('«Fra kunnskap til handling»: the three parts, and an index that names them', () => {
    const { container } = page();
    const handling = container.querySelector('section#handling') as HTMLElement;
    expect(within(handling).getAllByRole('heading', { level: 3 }).map((e) => e.textContent)).toEqual(h.action.items.map((a) => a.title));
    expect(within(handling).getAllByRole('button').map((b) => b.textContent)).toEqual(h.action.items.map((a) => a.title));
  });

  test('Aktuelt: the three next events as posters and the three latest news, each list with its way on', () => {
    data.news = four.news;
    data.events = four.events;
    const { container } = page();
    const aktuelt = container.querySelector('section#aktuelt') as HTMLElement;
    // the section opens at the coming events: no «Aktuelt» title or intro above them
    expect(within(aktuelt).getAllByRole('heading', { level: 2 }).map((e) => e.textContent)).toEqual([site.pages.news.upcoming, site.pages.news.newsTitle]);
    expect(within(aktuelt).queryByText(h.news.intro)).toBeNull();
    expect(within(aktuelt).getAllByRole('heading', { level: 4 }).map((e) => e.textContent)).toEqual(['Arrangement 1', 'Arrangement 2', 'Arrangement 3', 'Nyhet 1', 'Nyhet 2', 'Nyhet 3']);
    expect(aktuelt).toHaveTextContent('kl. 18:00 · Oslo');
    expect(aktuelt).toHaveTextContent('Januar 2099');
    expect(within(aktuelt).getByRole('link', { name: /Nyhet 1/ })).toHaveAttribute('href', '/aktuelt/nyheter/n1');
    expect(within(aktuelt).getByRole('link', { name: /Nyhet 2/ })).toHaveAttribute('href', '/aktuelt/nyheter');
    expect(within(aktuelt).getByRole('link', { name: h.news.all })).toHaveAttribute('href', '/aktuelt/nyheter');
    expect(within(aktuelt).getByRole('link', { name: site.pages.home.allEvents })).toHaveAttribute('href', '/aktuelt/arrangementer');
  });

  test('with nothing published, each list says so and no sample stands in (the site went live, 2026-11-22)', () => {
    data.news = [];
    data.events = [];
    const { container } = page();
    const aktuelt = container.querySelector('section#aktuelt') as HTMLElement;
    expect(within(aktuelt).getByText(site.pages.news.emptyUpcoming)).toBeInTheDocument();
    expect(within(aktuelt).getByText(site.pages.news.emptyNews)).toBeInTheDocument();
    expect(within(aktuelt).queryAllByRole('heading', { level: 4 })).toHaveLength(0);
    expect(within(aktuelt).queryByText('Eksempel')).toBeNull();
  });

  test('«Sammen kan vi gjøre en forskjell» and its two buttons', () => {
    const { container } = page();
    const sammen = container.querySelector('section#sammen') as HTMLElement;
    expect(within(sammen).getByRole('link', { name: h.together.buttons.partner })).toHaveAttribute('href', site.cta.partner.href);
    expect(within(sammen).getByRole('link', { name: h.together.buttons.support })).toHaveAttribute('href', '/stott-oss');
  });

  test('the header: the logo home, the five pages and Støtt oss, and «Meny» for the menu layer', () => {
    page();
    const header = screen.getByRole('banner');
    expect(within(header).getByRole('link', { name: site.header.homeLabel })).toHaveAttribute('href', '/');
    const nav = within(header).getByRole('navigation', { name: site.header.navLabel });
    const lang = within(nav).getByRole('group', { name: site.language.label });
    const pages = within(nav).getAllByRole('link').filter((a) => !lang.contains(a));
    expect(pages.map((a) => a.textContent?.replace(/→/g, ''))).toEqual(['Hjem', 'Om oss', 'Aktuelt', 'Ressurser', 'Kontakt', 'Støtt oss']);
    expect(within(nav).getByRole('button', { name: site.header.open })).toHaveAttribute('aria-expanded', 'false');
  });

  test('the language switch: Norwegian stands, English links to the same page in English (2026-11-22)', () => {
    page();
    const header = screen.getByRole('banner');
    const lang = within(header).getByRole('group', { name: site.language.label });
    expect(within(lang).getAllByRole('link')).toHaveLength(1);
    const en = within(lang).getByRole('link', { name: 'English' });
    expect(en).toHaveAttribute('href', '/en');
    expect(en).toHaveAttribute('hreflang', 'en');
    expect(within(lang).getByText('Norsk').closest('[aria-current]')).not.toBeNull();
  });

  test('the foot: the lockup, three groups of links, the foundation’s details with the new e-mail', () => {
    page();
    const foot = screen.getByRole('contentinfo');
    expect(within(foot).getByRole('img', { name: site.logoAlt })).toBeInTheDocument();
    for (const g of ['Om oss', 'Aktuelt', 'Sider']) expect(within(foot).getByRole('navigation', { name: g })).toBeInTheDocument();
    expect(within(foot).getByRole('link', { name: 'Støtt oss' })).toHaveAttribute('href', '/stott-oss');
    expect(within(foot).getByRole('link', { name: 'post@iqrasti.no' })).toHaveAttribute('href', 'mailto:post@iqrasti.no');
    expect(foot).toHaveTextContent(`Organisasjonsnummer ${klient.contact.orgnr}`);
    expect(foot).not.toHaveTextContent('gmail');
  });
});
