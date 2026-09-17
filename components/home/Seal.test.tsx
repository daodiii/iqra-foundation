import { render, within } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { site } from '@/content/site.no';
import { INSCRIPTION, Seal } from './Seal';

describe('Seal', () => {
  test('Visjon and Misjon as two sections on one flat navy plate, every word the brief’s', () => {
    const { container } = render(<Seal />);
    const plate = container.querySelector('[data-material]') as HTMLElement;
    expect(plate).toHaveAttribute('data-material', 'flat');
    expect(plate).toHaveAttribute('data-tone', 'dark');
    expect(container.querySelectorAll('[data-material]')).toHaveLength(1);

    const vision = container.querySelector('section#visjon') as HTMLElement;
    const visionName = within(vision).getByRole('heading', { level: 2, name: site.pages.home.visionLabel });
    expect(vision).toHaveAttribute('aria-labelledby', visionName.id);
    // The statement is word by word (Words): getByText sees only a node's own text, so match the section's.
    expect(vision).toHaveTextContent(brief.vision.headline);
    expect(within(vision).getByText(brief.vision.paragraph)).toBeInTheDocument();

    const mission = container.querySelector('section#misjon') as HTMLElement;
    const missionName = within(mission).getByRole('heading', { level: 2, name: site.pages.home.missionLabel });
    expect(mission).toHaveAttribute('aria-labelledby', missionName.id);
    expect(within(mission).getByText(brief.mission.headline)).toBeInTheDocument();
    expect(within(mission).getByText(brief.mission.paragraph)).toBeInTheDocument();
    expect(mission).toHaveAttribute('data-card');
  });

  test('the ring carries the four areas’ names twice round, decorative; the dot stands at twelve', () => {
    const { container } = render(<Seal />);
    const svg = container.querySelector('section#visjon svg') as SVGElement;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    for (const a of brief.areas) expect(INSCRIPTION.split(a.name)).toHaveLength(3);
    expect(svg.querySelector('textPath')?.textContent).toBe(INSCRIPTION);
    // the inscription's spaces kept: collapsed, the last dot sat on the first name where the text meets itself
    expect(svg.querySelector('text')).toHaveAttribute('xml:space', 'preserve');
    const circles = svg.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
    expect(circles[0]).toHaveAttribute('pathLength', '100');
    expect(circles[1]).toHaveAttribute('cy', '3');
  });
});
