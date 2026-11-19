import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 40_000,
  fullyParallel: false,
  retries: 0,
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'npm run build && npm run start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    /*
     * The same build with the editor switched on for e2e/redaksjon.spec.ts: a test editor with no
     * login, saving into a throwaway folder instead of this checkout.
     */
    {
      command: 'npm run start -- -p 3100',
      url: 'http://localhost:3100',
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        REDAKSJON_E2E: '1',
        REDAKSJON_TEST_EDITOR: 'e2e@example.org',
        REDAKSJON_LOCAL_ROOT: mkdtempSync(path.join(tmpdir(), 'redaksjon-e2e-')),
      },
    },
  ],
});
