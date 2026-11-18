import { describe, expect, test } from 'vitest';
import { getPeople } from '@/lib/content';
import { klient } from './klient.no';

/**
 * The board in the collection is the client's board (D4 and M4, 2026-11-18): the five
 * members, by name and role, in the document's order, and nobody else. Photos and short
 * bios are added in the admin when the foundation supplies them.
 */
describe('menneskene: the five board members', () => {
  test('the collection is exactly the client’s five, in their order, with their roles', () => {
    expect(getPeople().map((p) => ({ name: p.name, role: p.role }))).toEqual(klient.people.members.map((m) => ({ name: m.name, role: m.role })));
  });

  test('no placeholder is left in the collection', () => {
    for (const p of getPeople()) expect(JSON.stringify(p)).not.toMatch(/\[[^\]]+\]/);
  });
});
