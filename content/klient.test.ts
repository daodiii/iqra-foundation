import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { klient } from './klient.no';

/**
 * The client's text, word for word, both ways.
 *
 * One way: every string in `klient.no.ts` is in the client's sources
 * (`docs/prompts/2026-11-18-klient-oppdatering.md`), so a reworded sentence fails here.
 * The other way: every paragraph of the client's document (D) is in `klient.no.ts`, so a
 * sentence the client wrote cannot be left out by accident. What a paragraph may hold beyond
 * the strings is listed in LEFTOVERS, each with its reason.
 */
const FILE = path.resolve(process.cwd(), 'docs/prompts/2026-11-18-klient-oppdatering.md');
const file = readFileSync(FILE, 'utf8');

/** Markdown emphasis off, whitespace collapsed: what a reader of the sources sees. */
const plain = (s: string) => s.replace(/\*/g, '').replace(/\s+/g, ' ').trim();

const [, rest] = file.split('\n## M\n');
const [m, d] = rest.split('\n## D\n');

function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings);
  return [];
}

/** The keys in `resources.categories` are slugs, not the client's words. */
const keys = new Set<string>(klient.resources.categories.map((c) => c.key));
const ours = strings(klient).filter((s) => !keys.has(s));

describe('every string in klient.no.ts is the client’s, unchanged', () => {
  const sources = plain(m) + ' ' + plain(d);
  test.each(ours)('%s', (s) => {
    expect(sources).toContain(plain(s));
  });
});

/**
 * What may stay in a document paragraph once the client's strings are taken out of it.
 * Everything else left over is a sentence the site does not carry.
 */
const LEFTOVERS = [
  // Section numbers and the document's own title: the document's structure, not site text.
  /^\d\. .*$/,
  /^Iqra Foundation – nettsidetekst$/,
  // Values the client has not supplied yet (Q6, Q10).
  /\[Kontonummer \/ Vipps-nummer\]/,
  /Facebook og Instagram: \[brukernavn\]/,
  // Buttons are written in brackets and joined by «·»; a stray «[» after «styreleder» (Q4).
  /[[\]·]/g,
  // The contact line's labels: the site writes its own labels for these.
  /(Org\.nr\.|Telefon:|E-post:)/g,
  // Board lines join name and role with «–».
  / – /g,
];

describe('every paragraph of the client’s document is carried', () => {
  const paragraphs = d
    .split(/\n\s*\n/)
    .map((p) => plain(p.replace(/^- /, '')))
    .filter(Boolean);
  const pieces = [...ours].map(plain).sort((a, b) => b.length - a.length);

  test.each(paragraphs)('%s', (p) => {
    let left = p;
    for (const s of pieces) left = left.split(s).join(' ');
    for (const re of LEFTOVERS) left = left.replace(re, ' ');
    expect(left.replace(/[\s.,–]+/g, '')).toBe('');
  });
});

test('the message’s four Ressurser categories, in its order', () => {
  expect(klient.resources.categories.map((c) => c.title)).toEqual([
    'Publikasjoner og rapporter',
    'Artikler og fagstoff',
    'Videoer og presentasjoner',
    'Styringsdokumenter',
  ]);
});

test('Menneskene bak: the five board members, and no one else', () => {
  expect(klient.people.members).toHaveLength(5);
});
