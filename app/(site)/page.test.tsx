import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { SEATS } from '@/components/home/People';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { getEvents, getPeople, splitEvents, todayISO } from '@/lib/content';
import { sentences } from '@/lib/text';
import Home from './page';

describe('Hjem', () => {
  test('one h1, the brief’s; the four fields on one sea first, each a link to its section of Vårt arbeid; then Visjon and Misjon as a seal on navy', () => {
    const { container } = render(<Home />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    const areas = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(areas.querySelectorAll('[data-material="water"]')).toHaveLength(1);
    expect(areas.querySelectorAll('[data-page]')).toHaveLength(4);
    for (const a of brief.areas) {
      const link = screen.getByRole('link', { name: a.name });
      expect(link).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      expect(areas).toContainElement(link);
      // the text as its two sentences: the statement and the reading (Sea.tsx)
      for (const part of sentences(a.text)) expect(screen.getByText(part)).toBeInTheDocument();
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

    // One water, four flat navy plates: the seal, Arrangementer, the two sides of Kontakt's table. No ink anywhere.
    expect(container.querySelectorAll('[data-material="water"]')).toHaveLength(1);
    const flats = container.querySelectorAll('[data-material="flat"]');
    expect(flats).toHaveLength(4);
    flats.forEach((f) => expect(f).toHaveAttribute('data-ground', 'navy'));
    expect(container.querySelector('[data-material="ink"]')).toBeNull();
  });

  test('then the rest of the site, in order: Om oss, Arrangementer, Menneskene bak, Kontakt — no labels, no links under them, the lists honest while empty and the next event when there is one', () => {
    const { container } = render(<Home />);
    const t = site.pages;
    const ids = [...container.querySelectorAll('section[id]')].map((s) => s.id);
    expect(ids.slice(-4)).toEqual(['om-oss', 'arrangementer', 'menneskene-bak', 'kontakt']);
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
    // The page renders the real collection: the people as prints on the table while there are any, the honest line while not.
    const seated = getPeople().slice(0, SEATS);
    expect([...people.querySelectorAll('article h3')].map((h) => h.textContent)).toEqual(seated.map((p) => p.name));
    if (!seated.length) expect(people).toHaveTextContent(t.people.empty);
    expect(within(people).queryAllByRole('link')).toHaveLength(0);

    // The foot: the question as the heading, word by word, on our plate; the line and Kontakt, the only way on, on the sheet on yours; no numbers.
    const contact = container.querySelector('section#kontakt') as HTMLElement;
    const contactTitle = within(contact).getByRole('heading', { level: 2 });
    expect(contact).toHaveAttribute('aria-labelledby', contactTitle.id);
    expect(contactTitle).toHaveTextContent(t.home.contact.question);
    expect(contact).toHaveTextContent(t.home.contact.line);
    expect(within(contact).getAllByRole('link')).toHaveLength(1);
    expect(within(contact).getByRole('link', { name: site.cta.contact.label })).toHaveAttribute('href', '/kontakt');
    expect(contact).not.toHaveTextContent(site.support.vipps.value);
    expect(contact.querySelectorAll('[data-material="flat"][data-ground="navy"]')).toHaveLength(2);
    expect(container.querySelector('section#stott-oss')).toBeNull();

    // Nothing of the thread or its knots, no eyebrow labels.
    expect(container.querySelector('canvas[data-thread-canvas]')).toBeNull();
    expect(container.querySelectorAll('[data-knot], [data-knot-at]')).toHaveLength(0);
    // Every section after the sea arrives: the white ones are arrivals themselves, the plates hold one.
    expect(container.querySelectorAll('[data-arrive]').length).toBeGreaterThanOrEqual(5);
  });
});
