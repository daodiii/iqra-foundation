import { describe, expect, test } from 'vitest';
import { shortDate } from './Rows';

describe('shortDate', () => {
  test('today, yesterday, this year, another year', () => {
    expect(shortDate('2026-11-19', '2026-11-19')).toBe('i dag');
    expect(shortDate('2026-11-18', '2026-11-19')).toBe('i går');
    expect(shortDate('2026-01-01', '2026-01-02')).toBe('i går');
    expect(shortDate('2026-11-12', '2026-11-19')).toBe('12. nov.');
    expect(shortDate('2025-03-03', '2026-11-19')).toBe('3. mars 2025');
    expect(shortDate('', '2026-11-19')).toBe('');
  });
});
