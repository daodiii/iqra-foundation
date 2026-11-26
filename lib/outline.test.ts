import { expect, test } from 'vitest';
import { anchorOf, outline, readingMinutes } from './outline';

test('the outline is the level-2 headings, with unique anchors in order', () => {
  const src = '## Læring som utvikler\n\nTekst.\n\n### Under\n\n## Møteplasser som **bygger** broer\n\n## Læring som utvikler\n';
  expect(outline(src)).toEqual([
    { id: 'del-laering-som-utvikler', text: 'Læring som utvikler' },
    { id: 'del-moteplasser-som-bygger-broer', text: 'Møteplasser som bygger broer' },
    { id: 'del-laering-som-utvikler-2', text: 'Læring som utvikler' },
  ]);
  expect(outline('Bare tekst.\n')).toEqual([]);
  expect(anchorOf('!!!')).toBe('del');
});

test('reading time: 200 words a minute, at least one', () => {
  expect(readingMinutes('kort')).toBe(1);
  expect(readingMinutes(Array(1000).fill('ord').join(' '))).toBe(5);
});
