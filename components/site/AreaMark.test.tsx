import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { AreaMark, MarkedLine } from './AreaMark';

describe('the area mark', () => {
  test('a square of the area’s colour before its name; the square is decorative', () => {
    const { container } = render(<AreaMark area="dialog" />);
    expect(screen.getByText('Dialog')).toBeInTheDocument();
    const square = container.querySelector('[data-area="dialog"]')!;
    expect(square).toHaveAttribute('aria-hidden', 'true');
  });

  test('a sentence keeps its text word for word and marks each of the four names', () => {
    const text = brief.about.paragraphs[1]; // «Vi arbeider i skjæringspunktet mellom kunnskap, dialog, møteplasser og samfunnsdeltakelse.»
    const { container } = render(<p><MarkedLine text={text} /></p>);
    expect(container.querySelector('p')!.textContent).toBe(text);
    expect(container.querySelectorAll('[data-area]')).toHaveLength(4);
    expect(container.querySelector('[data-area="samfunnsdeltakelse"]')).not.toBeNull();
  });

  test('a sentence without an area name is returned unmarked', () => {
    const { container } = render(<p><MarkedLine text="Iqra Foundation er en stiftelse." /></p>);
    expect(container.querySelectorAll('[data-area]')).toHaveLength(0);
    expect(container.querySelector('p')!.textContent).toBe('Iqra Foundation er en stiftelse.');
  });
});
