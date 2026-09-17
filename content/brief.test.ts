import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { brief } from './brief.no';
import { site } from './site.no';

/**
 * The brief's prose is the site's text, word for word — that is the first rule of the
 * prompt this site was built from, and this file is what enforces it. It reads the brief
 * back out of the prompt document (the text between its two horizontal rules, markdown
 * emphasis stripped), picks out the passages the site uses, and asserts each of them
 * appears unchanged in the content modules. A later session that «improves» a sentence in
 * `brief.no.ts` fails here instead of shipping; so does one that edits the prompt file.
 *
 * Two directions, because either alone can pass vacuously: every passage the brief holds
 * must be in the content, and every string the content calls the brief's must be in the
 * brief.
 */
// From the repo root, where vitest runs: under jsdom `import.meta.url` is not a file URL.
const PROMPT = path.resolve(process.cwd(), 'docs/prompts/2026-09-15-fable-identitet-og-struktur.md');

/** Markdown emphasis off, whitespace collapsed: what a reader of the brief sees. */
const plain = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const file = readFileSync(PROMPT, 'utf8');
const parts = file.split('\n---\n');
const between = parts[1];
const text = plain(between);

/** The brief's numbered section, as the raw markdown between its heading and the next. */
function section(n: number): string {
  const m = between.match(new RegExp(`^### ${n}\\. [^\\n]+\\n([\\s\\S]*?)(?=^### \\d+\\.|$(?![\\s\\S]))`, 'm'));
  if (!m) throw new Error(`section ${n} is not in the brief`);
  return m[1].trim();
}
const paragraphs = (s: string) => s.split(/\n\s*\n/).map(plain).filter(Boolean);

/** Everything the content modules say is the brief's, flattened to strings. */
const content = JSON.stringify({ brief, site });

test('the brief sits between two rules in the prompt file', () => {
  expect(parts.length).toBeGreaterThanOrEqual(3);
  expect(text).toContain('Det viktigste nå er å tydeliggjøre');
  expect(text).toContain('Kunnskap. Dialog. Møteplasser. Samfunnsdeltakelse.');
});

describe('every passage the site uses is in the content, unchanged', () => {
  const two = paragraphs(section(2));
  const three = paragraphs(section(3));
  const four = paragraphs(section(4));
  const five = paragraphs(section(5));
  const seven = paragraphs(section(7));
  const areas = [...section(6).matchAll(/^\*\*([^*]+)\*\*\n([^\n]+)/gm)].map((m) => [m[1].trim(), plain(m[2])]);

  const passages: [string, string][] = [
    ['2: the headline', two[0]],
    ['2: the paragraph', two[1]],
    ['3: Visjon, the headline', three[0]],
    ['3: Visjon, the paragraph', three[1]],
    ['4: Misjon, the headline', four[0]],
    ['4: Misjon, the paragraph', four[1]],
    ['5: Om oss, the title', five[0]],
    ...five.slice(1).map((p, i): [string, string] => [`5: Om oss, paragraph ${i + 1}`, p]),
    ...areas.map(([name, body]): [string, string][] => [[`6: ${name}, the name`, name], [`6: ${name}, the text`, body]]).flat(),
    ['7: the board paragraph', seven[2]],
  ];

  test('the brief still has every section this reads', () => {
    expect(two.length).toBeGreaterThanOrEqual(3);
    expect(three).toHaveLength(2);
    expect(four).toHaveLength(2);
    expect(five).toHaveLength(5);
    expect(areas.map(([n]) => n)).toEqual(['Kunnskap', 'Dialog', 'Møteplasser', 'Samfunnsdeltakelse']);
    expect(seven[2]).toMatch(/^Iqra Foundation forvaltes/);
  });

  test.each(passages)('%s', (_name, passage) => {
    expect(passage.length).toBeGreaterThan(4);
    expect(content).toContain(JSON.stringify(passage).slice(1, -1));
  });
});

describe('every string the content calls the brief’s is in the brief, unchanged', () => {
  const strings: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(brief);
  test('there is something to check', () => {
    expect(strings.length).toBeGreaterThan(20);
  });
  test.each(strings.map((s) => [s.length > 60 ? s.slice(0, 57) + '…' : s, s]))('«%s»', (_short, s) => {
    // The area keys are the site's routes, not the brief's words.
    if (brief.areas.some((a) => a.key === s)) return;
    expect(text).toContain(s);
  });
});
