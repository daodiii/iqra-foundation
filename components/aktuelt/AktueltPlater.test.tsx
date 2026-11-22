import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import type { Event, NewsItem } from '@/lib/content';
import { AktueltPlater } from './AktueltPlater';

const t = site.pages.news;

const NEWS: NewsItem[] = [
  { slug: 'med-tekst', date: '2026-11-18', title: 'En nyhet med tekst', summary: 'Ingress.', image: null, body: 'Tekst.' },
  { slug: 'uten-tekst', date: '2026-11-06', title: 'En nyhet uten tekst', summary: 'Ingress.', image: null, body: null },
];
const ev = { end: null, text: '', link: null, program: null, report: null, recording: null, image: null, area: null, place: 'Oslo' };
const EVENTS: Event[] = [
  { ...ev, slug: 'foredrag', start: '2099-12-04', time: '18:00', title: 'Et foredrag' },
  { ...ev, slug: 'kveld', start: '2100-01-15', time: '19:00', title: 'En samtalekveld' },
];

describe('Aktuelt on the plates', () => {
  test('nothing is marked «Eksempel»: a news item with a text leads to it, one without does not', () => {
    render(<AktueltPlater view="alle" news={NEWS} upcoming={EVENTS} past={[]} />);
    expect(screen.queryByText('Eksempel')).toBeNull();
    expect(screen.getByRole('link', { name: 'En nyhet med tekst' })).toHaveAttribute('href', '/aktuelt/nyheter/med-tekst');
    expect(within(screen.getByRole('heading', { name: 'En nyhet uten tekst' }).closest('li')!).queryByRole('link')).toBeNull();
  });

  test('an event is a calendar leaf: the day set large, the month and year written out, and it reads as the date and the time', () => {
    render(<AktueltPlater view="arrangementer" news={[]} upcoming={EVENTS} past={[]} />);
    const leaf = screen.getByRole('heading', { name: 'En samtalekveld' }).closest('li')!;
    expect(leaf.querySelector('time[datetime="2100-01-15"]')).toHaveTextContent('15. januar 2100');
    expect(leaf.querySelector('time[datetime="2100-01-15T19:00"]')).toHaveTextContent('kl. 19:00');
    expect(leaf).toHaveTextContent('15');
    expect(leaf).toHaveTextContent('januar 2100');
    expect(leaf).toHaveTextContent('Oslo');
    expect(screen.getByText(t.emptyPast)).toBeInTheDocument();
  });

  test('each part is a plate, the news and the events reachable by their anchors', () => {
    const { container } = render(<AktueltPlater view="alle" news={NEWS} upcoming={EVENTS} past={[]} />);
    expect(container.querySelectorAll('[data-plate]')).toHaveLength(3);
    expect(screen.getByRole('region', { name: t.newsTitle })).toHaveAttribute('id', 'nyheter');
    expect(screen.getByRole('region', { name: t.eventsTitle })).toHaveAttribute('id', 'arrangementer');
  });

  test('an empty collection says so in the site’s words', () => {
    render(<AktueltPlater view="alle" news={[]} upcoming={[]} past={[]} />);
    expect(screen.getByText(t.emptyNews)).toBeInTheDocument();
    expect(screen.getByText(t.emptyUpcoming)).toBeInTheDocument();
  });
});
