import type { AnyExtension, JSONContent } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { MarkdownManager } from '@tiptap/markdown';
import StarterKit from '@tiptap/starter-kit';

/**
 * What a news text may hold, and its conversion to and from Markdown (`body.mdoc`, which the
 * site renders with Markdoc). Only the formats the toolbar offers: headings at levels 2 and 3,
 * bold, italic, links, lists, quotes and pictures. Anything else pasted in (a table, a colour,
 * a level-1 heading) is dropped or turned into one of these by the schema.
 */
export const EXTENSIONS: AnyExtension[] = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    strike: false,
    underline: false,
    horizontalRule: false,
    link: { openOnClick: false, autolink: true, defaultProtocol: 'https', protocols: ['http', 'https', 'mailto'] },
  }),
  Image.configure({ inline: false, allowBase64: false }),
];

let manager: MarkdownManager | null = null;
const md = () => (manager ??= new MarkdownManager({ extensions: EXTENSIONS }));

export const fromMarkdown = (text: string): JSONContent => md().parse(text);

/** The text as Markdown, ending in one newline; an empty text is an empty string. */
export function toMarkdown(doc: JSONContent): string {
  const out = md().serialize(doc).replace(/ /g, ' ').replace(/[ \t]+$/gm, '').trim();
  return out ? out + '\n' : '';
}

/** The pictures a text shows, by address. */
export function picturesIn(doc: JSONContent): { src: string; alt: string }[] {
  const out: { src: string; alt: string }[] = [];
  const walk = (n: JSONContent) => {
    if (n.type === 'image') out.push({ src: String(n.attrs?.src ?? ''), alt: String(n.attrs?.alt ?? '') });
    n.content?.forEach(walk);
  };
  walk(doc);
  return out;
}
