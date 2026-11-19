import Markdoc, { type Node } from '@markdoc/markdoc';

/**
 * A post's outline: its level-2 headings with the anchors the page gives them, and its reading
 * time. `Body` sets the same anchors on the headings it renders (`anchorHeadings`), so a link
 * in the contents always lands on its heading.
 */

export type Part = { id: string; text: string };

/** «Møteplasser som bygger broer» → «moteplasser-som-bygger-broer». */
export function anchorOf(text: string): string {
  const a = text
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return a || 'del';
}

function textOf(node: Node): string {
  let out = '';
  for (const n of node.walk()) if (n.type === 'text' && typeof n.attributes.content === 'string') out += n.attributes.content;
  return out.trim();
}

/** Gives every heading in the tree an `anchor` attribute, unique in order; returns the level-2 ones. */
export function anchorHeadings(ast: Node): Part[] {
  const seen = new Map<string, number>();
  const parts: Part[] = [];
  for (const node of ast.walk()) {
    if (node.type !== 'heading') continue;
    const text = textOf(node);
    const base = `del-${anchorOf(text)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const id = n === 1 ? base : `${base}-${n}`;
    node.attributes.anchor = id;
    if (node.attributes.level === 2) parts.push({ id, text });
  }
  return parts;
}

export const outline = (source: string): Part[] => anchorHeadings(Markdoc.parse(source));

/** Minutes to read the ingress and the text, at 200 words a minute, at least one. */
export function readingMinutes(...texts: string[]): number {
  const words = texts.join(' ').replace(/[#>*_`[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
