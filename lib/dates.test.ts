import { expect, test } from 'vitest';
import { writeDate, writeDateTime } from './dates';

test('an ISO date is written out in Norwegian, without a leading zero on the day', () => {
  expect(writeDate('2026-09-24')).toBe('24. september 2026');
  expect(writeDate('2027-01-05')).toBe('5. januar 2027');
});

test('a time is appended with «kl.», and left off when there is none', () => {
  expect(writeDateTime('2026-09-24', '18:00')).toBe('24. september 2026 kl. 18:00');
  expect(writeDateTime('2026-09-24', null)).toBe('24. september 2026');
});

test('anything that is not an ISO date is refused', () => {
  expect(() => writeDate('24.09.2026')).toThrow(/not an ISO date/);
});
