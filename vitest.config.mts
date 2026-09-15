import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    /*
     * This list replaces vitest's defaults, so `node_modules` has to be matched at any
     * depth here, not only at the root: `.claude/worktrees/` can hold another checkout of
     * this repo with its own `node_modules`, and on 2026-09-15 the bare pattern let 371 of
     * that checkout's files into the run — 400 files and 54 failures that were not this
     * suite's, in three minutes instead of fourteen seconds.
     */
    exclude: ['**/node_modules/**', '.claude/**', 'e2e/**', '.next/**'],
  },
});
