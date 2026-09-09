import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { film } from './film';

/**
 * The grounds are written twice on purpose and must never disagree.
 *
 * `lib/film.ts` mixes the ink against a ground; `components/wash.module.css` paints that
 * same ground as the box's background, so the section has its colour before any script has
 * run and keeps it on a device where the simulation declines. If the two drift, the box
 * changes colour the instant the canvas appears — a flash nobody would attribute to a hex
 * in a stylesheet.
 *
 * Read off disk rather than imported: vitest resolves a CSS module to a proxy of class
 * names, so the custom properties inside it are invisible to an ordinary import.
 */
const css = readFileSync(join(import.meta.dirname, '..', 'components', 'wash.module.css'), 'utf8');

/** The `--ground` declared inside one class block, e.g. `.cave { --ground: #e6eaea; }`. */
function groundOf(className: string): string | null {
  const block = css.match(new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`));
  return block?.[1].match(/--ground:\s*(#[0-9a-f]{6})/)?.[1] ?? null;
}

const SCENES = [
  ['cave', film.vision],
  ['mosque', film.mission],
  ['quran', film.support],
  ['night', film.supportCard],
] as const;

test.each(SCENES)('the %s ground in the stylesheet matches the palette', (name, palette) => {
  expect(groundOf(name)).toBe(palette.ground);
});

/** If a class is ever renamed, the lookup above would quietly return null for every scene
 *  and each test would compare null with null in some future refactor. Prove it can find. */
test('the lookup finds a ground at all', () => {
  expect(groundOf('cave')).toMatch(/^#[0-9a-f]{6}$/);
  expect(groundOf('no-such-class')).toBeNull();
});

/** Every box also needs a resting picture, or a device that declines the simulation gets a
 *  flat rectangle where the page promises weather. */
test.each(SCENES.map(([n]) => n))('the %s box has a still gradient behind the canvas', (name) => {
  const block = css.match(new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  expect(block).toContain('--ink-still:');
  expect(block).toContain('radial-gradient');
});
