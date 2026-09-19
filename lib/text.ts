/**
 * A paragraph as its sentences. The brief writes each field's text in two, and Havet sets
 * the two apart — the first as the statement, the second as the reading. Split on the
 * full stop that ends a sentence; nothing is rewritten, and a text with one sentence is
 * one.
 */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
