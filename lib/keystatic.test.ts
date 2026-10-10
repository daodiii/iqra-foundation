import { afterEach, expect, test, vi } from 'vitest';
import { keystaticEnabled } from './keystatic';

afterEach(() => {
  vi.unstubAllEnvs();
});

test('under next dev the admin answers, whatever the mode', () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('NEXT_PUBLIC_KEYSTATIC_STORAGE', '');
  vi.stubEnv('KEYSTATIC_GITHUB_CLIENT_ID', '');
  expect(keystaticEnabled()).toBe(true);
});

test('in production only when GitHub mode is switched on and the GitHub App is there', () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_KEYSTATIC_STORAGE', '');
  vi.stubEnv('KEYSTATIC_GITHUB_CLIENT_ID', '');
  expect(keystaticEnabled()).toBe(false);
  vi.stubEnv('KEYSTATIC_GITHUB_CLIENT_ID', 'Iv1.abc');
  expect(keystaticEnabled(), 'the app alone, mode not switched on').toBe(false);
  vi.stubEnv('NEXT_PUBLIC_KEYSTATIC_STORAGE', 'github');
  expect(keystaticEnabled()).toBe(true);
  vi.stubEnv('KEYSTATIC_GITHUB_CLIENT_ID', '');
  expect(keystaticEnabled(), 'the mode without the app').toBe(false);
});
