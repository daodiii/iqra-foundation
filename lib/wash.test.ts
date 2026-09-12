import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

/**
 * Read off disk rather than imported: vitest resolves a CSS module to a proxy of class
 * names, so the declarations inside it are invisible to an ordinary import.
 */
const css = readFileSync(join(import.meta.dirname, '..', 'components', 'wash.module.css'), 'utf8');

/**
 * The frame is the one material every box wears, and this is its contract with the pen and
 * the sections: the classes exist, the knob exists, and the trap is not in the source.
 */
test('the frame replaces the glass', () => {
  expect(css).toMatch(/\.frame\s*\{/);
  expect(css).toMatch(/\.frameOnWater\s*\{/);
  expect(css).toMatch(/\.frameCanvas\s*\{/);
  expect(css).toMatch(/\.legend\s*\{/);
  expect(css).toMatch(/\.seat\s*\{/);
  expect(css).not.toMatch(/\.card\s*\{/);
  expect(css).not.toMatch(/\.cardOnWater\s*\{/);
});

test('the inside is one knob, and the arrival fades it through a custom property', () => {
  expect(css).toMatch(/--frame-fill:\s*0\.3\b/);
  expect(css).toMatch(/opacity:\s*var\(--frame-in,\s*1\)/);
});

/**
 * Write the unprefixed property only. Declaring both made Lightning CSS keep the prefixed
 * one alone, which Blink ignores, and every card was a flat white rectangle. The build adds
 * the prefix; the e2e reads the served CSS for both forms.
 */
test('backdrop-filter is never hand-prefixed in the source', () => {
  expect(css).not.toMatch(/-webkit-backdrop-filter/);
  expect(css).toMatch(/backdrop-filter:\s*blur\(12px\)\s*saturate\(1\.4\)/);
});
