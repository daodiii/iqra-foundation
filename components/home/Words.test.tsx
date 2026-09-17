import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { Words } from './Words';

describe('Words', () => {
  test('the text is unchanged, one word per span in order, the full stop the last word\'s own', () => {
    render(<p data-testid="p"><Words text={brief.vision.headline} /></p>);
    const p = screen.getByTestId('p');
    expect(p).toHaveTextContent(brief.vision.headline);
    expect(p.textContent).toBe(brief.vision.headline);
    const words = [...p.querySelectorAll('[data-word]')];
    expect(words).toHaveLength(brief.vision.headline.split(' ').length);
    words.forEach((w, i) => expect((w as HTMLElement).style.getPropertyValue('--w')).toBe(String(i)));
    const stop = p.querySelector('[data-stop]') as HTMLElement;
    expect(stop.textContent).toBe('.');
    expect(words[words.length - 1]).toContainElement(stop);
  });

  test('a line without a full stop has no stop', () => {
    render(<p data-testid="p"><Words text="Kunnskap og dialog" /></p>);
    expect(screen.getByTestId('p').querySelector('[data-stop]')).toBeNull();
    expect(screen.getByTestId('p').textContent).toBe('Kunnskap og dialog');
  });
});
