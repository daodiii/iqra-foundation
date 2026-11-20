import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { EVENT_SAMPLES, NEWS_SAMPLES, SAMPLE } from './samples';
import { AktueltPlater } from './AktueltPlater';

const t = site.pages.news;

describe('Aktuelt on the plates, while nothing is published', () => {
  test('the front page’s samples stand in, each marked «Eksempel», and none of them leads anywhere', () => {
    render(<AktueltPlater view="alle" news={NEWS_SAMPLES} upcoming={EVENT_SAMPLES} past={[]} sampleNews sampleEvents />);
    for (const s of [...NEWS_SAMPLES, ...EVENT_SAMPLES]) {
      const item = screen.getByRole('heading', { name: s.title }).closest('li')!;
      expect(within(item).getByText(SAMPLE)).toBeInTheDocument();
      expect(within(item).queryByRole('link')).toBeNull();
    }
  });

  test('an event is a calendar leaf: the day set large, the month and year written out, and it reads as the date and the time', () => {
    render(<AktueltPlater view="arrangementer" news={[]} upcoming={EVENT_SAMPLES} past={[]} sampleNews={false} sampleEvents />);
    const leaf = screen.getByRole('heading', { name: 'Samtalekveld for unge voksne' }).closest('li')!;
    expect(leaf.querySelector('time[datetime="2027-01-15"]')).toHaveTextContent('15. januar 2027');
    expect(leaf.querySelector('time[datetime="2027-01-15T19:00"]')).toHaveTextContent('kl. 19:00');
    expect(leaf).toHaveTextContent('15');
    expect(leaf).toHaveTextContent('januar 2027');
    expect(leaf).toHaveTextContent('Oslo');
    expect(screen.getByText(t.emptyPast)).toBeInTheDocument();
  });

  test('each part is a plate, the news and the events reachable by their anchors', () => {
    const { container } = render(<AktueltPlater view="alle" news={NEWS_SAMPLES} upcoming={EVENT_SAMPLES} past={[]} sampleNews sampleEvents />);
    expect(container.querySelectorAll('[data-plate]')).toHaveLength(3);
    expect(screen.getByRole('region', { name: t.newsTitle })).toHaveAttribute('id', 'nyheter');
    expect(screen.getByRole('region', { name: t.eventsTitle })).toHaveAttribute('id', 'arrangementer');
  });

  test('an empty collection with no samples says so in the site’s words', () => {
    render(<AktueltPlater view="alle" news={[]} upcoming={[]} past={[]} sampleNews={false} sampleEvents={false} />);
    expect(screen.getByText(t.emptyNews)).toBeInTheDocument();
    expect(screen.getByText(t.emptyUpcoming)).toBeInTheDocument();
  });
});
