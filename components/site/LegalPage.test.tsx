import { render, screen, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { privacy, terms } from '@/content/legal.no';
import { site } from '@/content/site.no';
import { LegalPage } from './LegalPage';

describe('the legal pages', () => {
  for (const [name, page] of [['personvern', privacy], ['vilkår', terms]] as const) {
    test(`${name}: one h1, every section a labelled region with its heading, the date at the foot`, () => {
      render(<LegalPage {...page} />);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(page.title);
      for (const s of page.sections) {
        const region = screen.getByRole('region', { name: s.heading });
        expect(within(region).getByRole('heading', { level: 2 })).toHaveAttribute('id', s.id);
      }
      expect(screen.getByText(`Sist oppdatert ${page.updated}.`)).toBeInTheDocument();
    });

    test(`${name}: titles and descriptions are set, and the ids are unique`, () => {
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.description.length).toBeGreaterThan(40);
      expect(page.description.length).toBeLessThanOrEqual(160);
      const ids = page.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }

  test('the privacy page says what is true of the site: no cookies, no browser storage, one counting tool — the facts the code keeps', () => {
    const text = privacy.sections.map((s) => s.paragraphs.join(' ')).join(' ');
    expect(text).toMatch(/ingen informasjonskapsler/);
    expect(text).toMatch(/Vercel Web Analytics/);
    expect(text).toMatch(/Datatilsynet/);
  });

  test('the controller is named with the site’s own values, bracketed or real', () => {
    const text = privacy.sections[0].paragraphs[0];
    expect(text).toContain(site.contact.orgnr);
    expect(text).toContain(site.contact.email);
  });
});
