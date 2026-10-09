import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

/**
 * An `@property` rule in a CSS module is not scoped: modules hash class names, never custom
 * properties, so registering `--x` on one page re-types `--x` for the whole document. On
 * 2026-10-09 the Støtt oss banners registered `--edge` as a percentage the same afternoon the
 * site's shared left edge became `--edge: clamp(…)`; on that page the edge fell back to 100 %,
 * every side padding became a screen wide, and the sheet stayed loaded after navigating away.
 * So no registered name may also be one of the site's own tokens.
 */
const root = process.cwd();

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : cssFiles(p);
    return e.name.endsWith('.css') ? [p] : [];
  });
}

const registered = ['app', 'components'].flatMap((d) => cssFiles(path.join(root, d))).flatMap((file) =>
  [...readFileSync(file, 'utf8').matchAll(/@property\s+(--[\w-]+)/g)].map((m) => ({ name: m[1], file: path.relative(root, file) })),
);
const globals = readFileSync(path.join(root, 'app/globals.css'), 'utf8');
const tokens = new Set([...globals.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1]));

describe('registered custom properties', () => {
  test('there are some to check', () => {
    expect(registered.length).toBeGreaterThan(0);
  });

  test('none shares a name with a token in globals.css', () => {
    expect(registered.filter((r) => tokens.has(r.name))).toEqual([]);
  });

  test('none is registered twice', () => {
    const names = registered.map((r) => r.name);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });
});
