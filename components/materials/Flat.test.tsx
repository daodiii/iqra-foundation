import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Flat } from './Flat';

describe('Flat', () => {
  test("a navy plate is flat, dark and named for its ground, with the copy in the box's inner column", () => {
    render(<Flat tint="navy"><p>copy</p></Flat>);
    const plate = screen.getByText('copy').closest('[data-material]') as HTMLElement;
    expect(plate).toHaveAttribute('data-material', 'flat');
    expect(plate).toHaveAttribute('data-tone', 'dark');
    expect(plate).toHaveAttribute('data-ground', 'navy');
    expect(plate.getAttribute('style')).toContain('--ground: var(--color-navy)');
    expect(plate.getAttribute('style')).toContain('--still: none');
    expect(screen.getByText('copy').parentElement).toBe(plate.lastElementChild);
  });

  test('a pale plate takes the light tone, and a node laid under the copy comes first', () => {
    render(<Flat tint="light" art={<i data-testid="art" />}><p>copy</p></Flat>);
    const plate = screen.getByText('copy').closest('[data-material]') as HTMLElement;
    expect(plate).toHaveAttribute('data-tone', 'light');
    expect(plate.firstElementChild).toBe(screen.getByTestId('art'));
  });
});
