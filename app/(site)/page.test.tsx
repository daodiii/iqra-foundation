import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { getEvents, splitEvents, todayISO } from '@/lib/content';
import Home from './page';

describe('Hjem', () => {
  test('one h1, the brief’s; the four fields on one sea first, each a link to its section of Vårt arbeid; then Visjon and Misjon as a seal on navy', () => {
    const { container } = render(<Home />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    const areas = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(areas.querySelectorAll('[data-material="water"]')).toHaveLength(1);
    expect(areas.querySelectorAll('[data-field]')).toHaveLength(4);
    for (const a of brief.areas) {
      const link = screen.getByRole('link', { name: a.name });
      expect(link).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      expect(areas).toContainElement(link);
      expect(screen.getByText(a.text)).toBeInTheDocument();
    }

    for (const [id, label, text] of [['visjon', site.pages.home.visionLabel, brief.vision], ['misjon', site.pages.home.missionLabel, brief.mission]] as const) {
      const section = container.querySelector(`section#${id}`) as HTMLElement;
      const name = within(section).getByRole('heading', { level: 2, name: label });
      expect(section).toHaveAttribute('aria-labelledby', name.id);
      // The vision's headline is word by word (Words): match the section's text, not a text node.
      expect(section).toHaveTextContent(text.headline);
      expect(within(section).getByText(text.paragraph)).toBeInTheDocument();
      expect(section.closest('[data-material]')).toHaveAttribute('data-material', 'flat');
    }
    // The sea comes before the seal.
    const order = [...container.querySelectorAll('[data-fields], section#visjon')];
    expect(order[0]).toHaveAttribute('data-fields');

    // One water, three flat navy plates: the seal, Arrangementer, Støtt oss. No ink anywhere.
    expect(container.querySelectorAll('[data-material="water"]')).toHaveLength(1);
    const flats = container.querySelectorAll('[data-material="flat"]');
    expect(flats).toHaveLength(3);
    flats.forEach((f) => expect(f).toHaveAttribute('data-ground', 'navy'));
    expect(container.querySelector('[data-material="ink"]')).toBeNull();
  });

  test('then the rest of the site, in order: Om oss, Arrangementer, Menneskene bak, Støtt oss — no labels, no links under them, the lists honest while empty and the next event when there is one', () => {
    const { container } = render(<Home />);
    const t = site.pages;
    const ids = [...container.querySelectorAll('section[id]')].map((s) => s.id);
    expect(ids.slice(-4)).toEqual(['om-oss', 'arrangementer', 'menneskene-bak', 'stott-oss']);
    expect(ids).not.toContain('ressurser');

    const about = container.querySelector('section#om-oss') as HTMLElement;
    const aboutTitle = within(about).getByRole('heading', { level: 2, name: brief.about.title });
    expect(about).toHaveAttribute('aria-labelledby', aboutTitle.id);
    expect(aboutTitle).toHaveAttribute('data-title');
    expect(about).toHaveTextContent(brief.about.paragraphs[0]);
    expect(about).toHaveTextContent(brief.about.paragraphs[1]);
    expect(about.querySelectorAll('[data-area]')).toHaveLength(4);
    expect(within(about).queryAllByRole('link')).toHaveLength(0);

    const events = container.querySelector('section#arrangementer') as HTMLElement;
    expect(within(events).getByRole('heading', { level: 2, name: t.events.title })).toBeInTheDocument();
    // The page renders the real collection: the next event as the statement while one is coming, the honest line while not.
    const { upcoming } = splitEvents(getEvents(), todayISO());
    if (upcoming.length) expect(events).toHaveTextContent(upcoming[0].title);
    else expect(events).toHaveTextContent(t.events.emptyUpcoming);
    expect(events.closest('[data-material]')).toHaveAttribute('data-material', 'flat');

    const people = container.querySelector('section#menneskene-bak') as HTMLElement;
    const peopleTitle = within(people).getByRole('heading', { level: 2, name: brief.people.title });
    expect(people).toHaveAttribute('aria-labelledby', peopleTitle.id);
    expect(people).toHaveTextContent(brief.people.paragraph);
    expect(people).toHaveTextContent(t.people.empty);
    expect(within(people).queryAllByRole('link')).toHaveLength(0);

    const support = container.querySelector('section#stott-oss') as HTMLElement;
    expect(within(support).getByRole('heading', { level: 2, name: t.support.title })).toBeInTheDocument();
    expect(within(support).getByRole('link', { name: site.cta.support.label })).toHaveAttribute('href', site.cta.support.href);
    expect(support).toHaveTextContent(site.support.vipps.value);
    expect(support.closest('[data-material]')).toHaveAttribute('data-material', 'flat');

    // Nothing of the thread or its knots, no eyebrow labels.
    expect(container.querySelector('canvas[data-thread-canvas]')).toBeNull();
    expect(container.querySelectorAll('[data-knot], [data-knot-at]')).toHaveLength(0);
    // Every section after the sea arrives: the white ones are arrivals themselves, the plates hold one.
    expect(container.querySelectorAll('[data-arrive]').length).toBeGreaterThanOrEqual(5);
  });
});
