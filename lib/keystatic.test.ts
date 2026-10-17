import { afterEach, expect, test, vi } from 'vitest';
import { keystaticEnabled } from './keystatic';

afterEach(() => {
  vi.unstubAllEnvs();
});

const SECRETS = ['KEYSTATIC_GITHUB_CLIENT_ID', 'KEYSTATIC_GITHUB_CLIENT_SECRET', 'KEYSTATIC_SECRET'] as const;

/** Production, GitHub mode switched on, and the GitHub App's three values all set. */
function githubReady() {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_KEYSTATIC_STORAGE', 'github');
  vi.stubEnv('KEYSTATIC_GITHUB_CLIENT_ID', 'Iv1.abc');
  vi.stubEnv('KEYSTATIC_GITHUB_CLIENT_SECRET', 'shh');
  vi.stubEnv('KEYSTATIC_SECRET', 'a-long-random-string');
}

test('under next dev the admin answers, whatever the mode', () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('NEXT_PUBLIC_KEYSTATIC_STORAGE', '');
  for (const key of SECRETS) vi.stubEnv(key, '');
  expect(keystaticEnabled()).toBe(true);
  vi.stubEnv('NEXT_PUBLIC_KEYSTATIC_STORAGE', 'github');
  expect(keystaticEnabled(), 'GitHub mode with none of its values yet').toBe(true);
});

test('in production when GitHub mode is switched on and all three of the GitHub App’s values are set', () => {
  githubReady();
  expect(keystaticEnabled()).toBe(true);
});

test('in production not without GitHub mode, even with every value there', () => {
  githubReady();
  vi.stubEnv('NEXT_PUBLIC_KEYSTATIC_STORAGE', '');
  expect(keystaticEnabled()).toBe(false);
});

test.each(SECRETS)('in production not with %s missing: Keystatic would throw in every build', (key) => {
  githubReady();
  vi.stubEnv(key, '');
  expect(keystaticEnabled()).toBe(false);
});
