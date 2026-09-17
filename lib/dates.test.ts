import { expect, test } from 'vitest';
import { timeLeft, writeDate, writeDateTime, zonedTime } from './dates';

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

test("an event's wall-clock time in Oslo is an instant: summer is two hours ahead of UTC, winter one", () => {
  expect(zonedTime('2026-09-24', '18:00')).toBe(Date.UTC(2026, 8, 24, 16, 0));
  expect(zonedTime('2026-01-10', '18:00')).toBe(Date.UTC(2026, 0, 10, 17, 0));
});

test('without a time the event starts at midnight in Oslo', () => {
  expect(zonedTime('2026-09-24', null)).toBe(Date.UTC(2026, 8, 23, 22, 0));
});

test('the time left is days, hours, minutes and seconds, and never less than nothing', () => {
  expect(timeLeft(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  expect(timeLeft(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  expect(timeLeft(59_000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 59 });
  expect(timeLeft(((7 * 24 + 2) * 3600 + 30 * 60 + 35) * 1000)).toEqual({ days: 7, hours: 2, minutes: 30, seconds: 35 });
});
