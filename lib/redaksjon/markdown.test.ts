import { describe, expect, test } from 'vitest';
import { fromMarkdown, picturesIn, toMarkdown } from './markdown';

const round = (s: string) => toMarkdown(fromMarkdown(s));

describe('Markdown in and out', () => {
  test.each([
    ['a paragraph', 'Kom innom.\n'],
    ['two paragraphs', 'Første.\n\nAndre.\n'],
    ['heading 2', '## Læring som utvikler\n\nTekst.\n'],
    ['heading 3', '### Mindre\n\nTekst.\n'],
    ['bold', 'Dette er **viktig**.\n'],
    ['italic', 'Dette er *viktig*.\n'],
    ['link', 'Les [vedtektene](https://example.org/v.pdf) først.\n'],
    ['bullet list', '- en\n- to\n- tre\n'],
    ['numbered list', '1. en\n2. to\n'],
    ['quote', '> Kunnskap er lys.\n'],
    ['picture', '![Folk i et lyst rom](/opplastet/nyheter/a/b.webp)\n'],
  ])('%s survives', (_name, src) => {
    expect(round(src)).toBe(src);
  });

  test('a longer text survives as a whole', () => {
    const src = [
      '## Læring som utvikler',
      '',
      'Kurs, foredrag og **opplæring** som styrker *både* faglig kompetanse.',
      '',
      '- Kurs',
      '- Foredrag',
      '',
      '> Et sitat.',
      '',
      '![Et rom](/opplastet/nyheter/x/y.webp)',
      '',
      'Les mer [her](https://iqra.no).',
      '',
    ].join('\n');
    expect(round(src)).toBe(src);
  });

  test('what the toolbar does not offer is not kept as such', () => {
    expect(round('# Stor\n')).not.toMatch(/^# /m);
    expect(round('`kode` her\n')).not.toContain('`');
    expect(round('~~borte~~\n')).not.toContain('~~');
  });

  test('an empty text is an empty string; pictures are found', () => {
    expect(toMarkdown(fromMarkdown(''))).toBe('');
    expect(picturesIn(fromMarkdown('Tekst\n\n![a](/x.webp)\n'))).toEqual([{ src: '/x.webp', alt: 'a' }]);
  });
});

describe('pasting', () => {
  test('pasted HTML keeps only the formats the toolbar offers', async () => {
    const { Editor } = await import('@tiptap/core');
    const { EXTENSIONS } = await import('./markdown');
    const editor = new Editor({ extensions: EXTENSIONS });
    editor.commands.setContent(
      '<h1 style="color:red">Stor</h1><p><span style="font-size:30px">Tekst</span> med <u>strek</u>, <code>kode</code> og <b>fet</b>.</p>' +
        '<table><tr><td>celle</td></tr></table><script>alert(1)</script><p><a href="javascript:alert(1)">farlig</a> <a href="https://iqra.no">trygg</a></p>',
    );
    const md = toMarkdown(editor.getJSON());
    editor.destroy();
    expect(md).not.toMatch(/^# /m);
    expect(md).not.toMatch(/<|style|javascript|alert|`/);
    expect(md).toContain('**fet**');
    expect(md).toContain('[trygg](https://iqra.no)');
    expect(md).toContain('celle');
  });
});
