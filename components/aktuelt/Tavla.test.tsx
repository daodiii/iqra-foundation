import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { EVENT_SAMPLES, NEWS_SAMPLES, SAMPLE } from './samples';
import { Tavla } from './Tavla';

const t = site.pages.news;

describe('Tavla, while nothing is published', () => {
  test('the front page’s samples stand in, each marked «Eksempel», and none of them leads anywhere', () => {
    render(<Tavla view="alle" news={NEWS_SAMPLES} upcoming={EVENT_SAMPLES} past={[]} sampleNews sampleEvents />);
    for (const s of [...NEWS_SAMPLES, ...EVENT_SAMPLES]) {
      const row = screen.getByRole('heading', { name: s.title }).closest('li')!;
      expect(within(row).getByText(SAMPLE)).toBeInTheDocument();
      expect(within(row).queryByRole('link')).toBeNull();
    }
  });

  test('a date is the day on two flap cards, the month written out and the year, and reads as the date', () => {
    render(<Tavla view="arrangementer" news={[]} upcoming={EVENT_SAMPLES} past={[]} sampleNews={false} sampleEvents />);
    const row = screen.getByRole('heading', { name: 'Samtalekveld for unge voksne' }).closest('li')!;
    expect(row.querySelector('time[datetime="2027-01-15"]')).toHaveTextContent('15. januar 2027');
    expect(row.querySelector('time[datetime="2027-01-15T19:00"]')).toHaveTextContent('kl. 19:00');
    expect(Array.from(row.querySelectorAll('[data-spin]')).map((c) => c.textContent)).toEqual(['1', '5', '1', '9', '0', '0']);
    expect(row).toHaveTextContent('januar');
    expect(screen.getByText(t.emptyPast)).toBeInTheDocument();
  });

  test('an empty collection with no samples says so in the site’s words', () => {
    render(<Tavla view="alle" news={[]} upcoming={[]} past={[]} sampleNews={false} sampleEvents={false} />);
    expect(screen.getByText(t.emptyNews)).toBeInTheDocument();
    expect(screen.getByText(t.emptyUpcoming)).toBeInTheDocument();
  });
});
