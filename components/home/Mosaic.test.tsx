import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { site } from '@/content/site.no';
import { Mosaic } from './Mosaic';

describe('Mosaic', () => {
  test('the four fields, each a card in the arrival, inside one scene', () => {
    const { container } = render(<Mosaic />);
    const region = screen.getByRole('region', { name: site.pages.home.areasLabel });
    expect(region.querySelectorAll('[data-material="water"]')).toHaveLength(4);
    const cards = region.querySelectorAll('li[data-card]');
    expect(cards).toHaveLength(4);
    cards.forEach((c, i) => expect((c as HTMLElement).style.getPropertyValue('--i')).toBe(String(i)));
    // the arrival wraps the scene, and the scene's first child is the plate the clip works on
    const arrive = container.querySelector('[data-arrive]') as HTMLElement;
    expect(arrive).toContainElement(region);
    expect(region.parentElement?.firstElementChild).toBe(region);
  });
});
