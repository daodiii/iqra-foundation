import 'server-only';
import { cache } from 'react';
import { listEntries, openEntry, type Row } from './entries';
import { SECTIONS, type Section } from './schema';
import { getStore } from './store';

/**
 * What the editor's server pages read, once per request: the rail's counts and the start page's
 * rows come from the same lists, so a page asks the store for each section only once.
 */

const store = cache(() => getStore());

export const rowsOf = cache(async (section: Section): Promise<Row[]> => {
  const s = store();
  return s ? listEntries(s, section) : [];
});

export const counts = cache(async (): Promise<Record<Section, number>> => {
  const lists = await Promise.all(SECTIONS.map((s) => rowsOf(s)));
  return Object.fromEntries(SECTIONS.map((s, i) => [s, lists[i].length])) as Record<Section, number>;
});

/** The newest posts across news, events and resources, for «Sist endret». */
export const latest = cache(async (n = 6): Promise<Row[]> => {
  const lists = await Promise.all((['nyheter', 'arrangementer', 'ressurser'] as const).map((s) => rowsOf(s)));
  return lists.flat().sort((a, b) => b.date.localeCompare(a.date)).slice(0, n);
});

export const opened = cache(async (section: Section, slug: string) => {
  const s = store();
  return s ? openEntry(s, section, slug) : null;
});
