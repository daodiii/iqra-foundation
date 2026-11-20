import { describe, expect, test } from 'vitest';
import { fit, stepAt } from './Kortene';

describe('Kortene: the held screen', () => {
  test('the track rests on each whole card and eases between them', () => {
    expect(stepAt(0, 4)).toBe(0);
    expect(stepAt(0.05, 4)).toBe(0); // still resting on the first
    expect(stepAt(1 / 3, 4)).toBeCloseTo(1);
    expect(stepAt(0.5, 4)).toBeGreaterThan(1);
    expect(stepAt(0.5, 4)).toBeLessThan(2);
    expect(stepAt(1, 4)).toBe(3);
  });

  /** A box whose content grows with --z: `need` is its height at --z 1, the box holds `room`; the heading's word is `word` wide at --z 1 in a `col` column. */
  function box(need: number, room: number, word = 0, col = 1000) {
    const el = document.createElement('div');
    const h = document.createElement('h2');
    el.appendChild(h);
    const z = () => parseFloat(el.style.getPropertyValue('--z') || '1');
    Object.defineProperty(el, 'scrollHeight', { get: () => need * z() });
    Object.defineProperty(el, 'clientHeight', { get: () => room });
    Object.defineProperty(el, 'scrollWidth', { get: () => 500 });
    Object.defineProperty(el, 'clientWidth', { get: () => 500 });
    Object.defineProperty(h, 'scrollWidth', { get: () => Math.max(col, word * z()) });
    Object.defineProperty(h, 'clientWidth', { get: () => col });
    return el;
  }

  test('fit lowers --z until the content fits its box in height', () => {
    const el = box(800, 600);
    fit(el);
    expect(800 * parseFloat(el.dataset.z!)).toBeLessThanOrEqual(601);
    expect(parseFloat(el.dataset.z!)).toBeGreaterThan(0.72);
  });

  test('fit lowers --z until a heading’s longest word fits its own box', () => {
    const el = box(100, 600, 500, 420);
    fit(el);
    expect(500 * parseFloat(el.dataset.z!)).toBeLessThanOrEqual(421);
  });

  test('fit leaves a box that already fits at full size, and never goes below half', () => {
    const ok = box(400, 600);
    fit(ok);
    expect(ok.dataset.z).toBe('1.00');
    const tight = box(5000, 600);
    fit(tight);
    expect(tight.dataset.z).toBe('0.50');
  });
});
