import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import Home from './page';

describe('Hjem', () => {
  test('one h1, the brief’s; Visjon and Misjon as sections on ink; the four areas as four fields of water, each a link to its section of Vårt arbeid', () => {
    const { container } = render(<Home />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);

    for (const [label, text] of [[site.pages.home.visionLabel, brief.vision], [site.pages.home.missionLabel, brief.mission]] as const) {
      const legend = screen.getByRole('heading', { level: 2, name: label });
      const section = legend.closest('section')!;
      expect(section).toHaveAttribute('aria-labelledby', legend.id);
      expect(section.closest('[data-material]')).toHaveAttribute('data-material', 'ink');
      expect(screen.getByRole('heading', { level: 3, name: text.headline })).toBeInTheDocument();
      expect(screen.getByText(text.paragraph)).toBeInTheDocument();
    }

    const areas = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(areas.querySelectorAll('[data-material="water"]')).toHaveLength(4);
    for (const a of brief.areas) {
      const link = screen.getByRole('link', { name: a.name });
      expect(link).toHaveAttribute('href', `/vart-arbeid#${a.key}`);
      expect(areas).toContainElement(link);
      expect(screen.getByText(a.text)).toBeInTheDocument();
    }
    // The ink, four fields of water, the water under Arrangementer and Ressurser, the ink under Støtt oss.
    expect(container.querySelectorAll('[data-material]')).toHaveLength(7);
    expect(container.querySelector('[data-plates]')).not.toBeNull();
  });

  test('then the rest of the site, in order, each section the way on to its page, the lists honest while empty', () => {
    const { container } = render(<Home />);
    const t = site.pages;
    const expected: [string, string, string, string, string | null][] = [
      ['om-oss', brief.about.title, t.home.more.about, '/om-oss', null],
      ['arrangementer', t.events.title, t.home.more.events, '/arrangementer', t.events.emptyUpcoming],
      ['ressurser', t.resources.title, t.home.more.resources, '/ressurser', t.resources.empty],
      ['menneskene-bak', brief.people.title, t.home.more.people, '/menneskene-bak', t.people.empty],
      ['stott-oss', t.support.title, site.cta.support.label, site.cta.support.href, null],
    ];
    const ids = [...container.querySelectorAll('section[id]')].map((s) => s.id);
    expect(ids.slice(-5)).toEqual(expected.map(([id]) => id));
    for (const [id, title, more, href, empty] of expected) {
      const section = container.querySelector(`section#${id}`)!;
      const heading = within(section as HTMLElement).getByRole('heading', { level: 2, name: title });
      expect(section).toHaveAttribute('aria-labelledby', heading.id);
      expect(within(section as HTMLElement).getByRole('link', { name: more })).toHaveAttribute('href', href);
      if (empty) expect(section).toHaveTextContent(empty);
    }
    // Om oss carries the four marks in the «skjæringspunktet» line; Arrangementer and Ressurser share one plate of water; Støtt oss is on ink.
    expect(container.querySelector('section#om-oss')!.querySelectorAll('[data-area]')).toHaveLength(4);
    const events = container.querySelector('section#arrangementer')!.closest('[data-material]')!;
    expect(events).toHaveAttribute('data-material', 'water');
    expect(container.querySelector('section#ressurser')!.closest('[data-material]')).toBe(events);
    expect(container.querySelector('section#stott-oss')!.closest('[data-material]')).toHaveAttribute('data-material', 'ink');
    expect(container).toHaveTextContent(site.support.vipps.value);
    // The thread's canvas is there for the script to draw on; it is decoration and says nothing.
    expect(container.querySelector('canvas[data-thread-canvas]')).toHaveAttribute('aria-hidden', 'true');
    // Every section after the hero is a knot on the thread.
    expect(container.querySelectorAll('[data-knot]').length).toBeGreaterThanOrEqual(6);
  });
});
