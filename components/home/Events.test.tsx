import { act, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { site } from '@/content/site.no';
import type { Event } from '@/lib/content';
import { Events } from './Events';

const event = (n: number, start: string, time: string | null, area: Event['area'] = null): Event => ({
  slug: `e${n}`, title: `Arrangement ${n}`, start, time, end: null, place: `Sted ${n}`, text: '', link: null, image: null, area,
});
const three = [event(1, '2026-09-24', '18:00', 'dialog'), event(2, '2026-09-30', '19:00'), event(3, '2026-10-08', null)];
const t = site.pages.events;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  vi.setSystemTime(new Date('2026-09-17T10:00:00Z'));
});
afterEach(() => { vi.useRealTimers(); });

describe('Events', () => {
  test('the next event is the statement — its date, its title word by word, its place, its area — and counts down; the two after it are rows', () => {
    const { container } = render(<Events upcoming={three} />);
    const section = container.querySelector('section#arrangementer') as HTMLElement;
    const name = within(section).getByRole('heading', { level: 2, name: t.title });
    expect(section).toHaveAttribute('aria-labelledby', name.id);
    expect(section.closest('[data-material]')).toHaveAttribute('data-ground', 'navy');
    expect(within(section).getByText('24. september 2026 kl. 18:00')).toBeInTheDocument();
    const title = within(section).getByRole('heading', { level: 3, name: 'Arrangement 1' });
    expect(title.querySelectorAll('[data-word]')).toHaveLength(2);
    expect(within(section).getByText('Sted 1')).toBeInTheDocument();
    expect(within(section).getByText('Dialog')).toBeInTheDocument();
    expect(within(section).getByText(t.description)).toBeInTheDocument();
    // 2026-09-24 18:00 in Oslo is 16:00Z: seven days and six hours from 10:00Z on the 17th
    const count = section.querySelector('dl') as HTMLElement;
    expect(within(count).getByText('7').previousElementSibling).toHaveTextContent(t.count.days);
    expect(within(count).getByText('06').previousElementSibling).toHaveTextContent(t.count.hours);
    expect(count.querySelector('div')?.firstElementChild?.tagName).toBe('DT');
    expect(within(count).getAllByText('00')).toHaveLength(2);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(within(count).getByText('05')).toBeInTheDocument();
    expect(within(count).getAllByText('59')).toHaveLength(2);
    // the rest, as rows, each a card
    const rows = section.querySelectorAll('li[data-card]');
    expect(rows).toHaveLength(2);
    expect(within(rows[0] as HTMLElement).getByRole('heading', { level: 3, name: 'Arrangement 2' })).toBeInTheDocument();
    expect(rows[0]).toHaveTextContent('30.09 · 19:00');
    expect(rows[1]).toHaveTextContent('08.10');
    expect(rows[1]).not.toHaveTextContent('·');
    expect(within(section).queryByText(t.emptyUpcoming)).toBeNull();
  });

  test('with nothing coming: the name, the honest line and the paragraph, no count', () => {
    const { container } = render(<Events upcoming={[]} />);
    const section = container.querySelector('section#arrangementer') as HTMLElement;
    expect(within(section).getByText(t.emptyUpcoming)).toBeInTheDocument();
    expect(within(section).getByText(t.description)).toBeInTheDocument();
    expect(section.querySelector('dl')).toBeNull();
    expect(section.querySelectorAll('li')).toHaveLength(0);
  });

  test('one event alone: the statement, no rows', () => {
    const { container } = render(<Events upcoming={[three[0]]} />);
    const section = container.querySelector('section#arrangementer') as HTMLElement;
    expect(within(section).getByRole('heading', { level: 3, name: 'Arrangement 1' })).toBeInTheDocument();
    expect(section.querySelectorAll('li')).toHaveLength(0);
  });
});
