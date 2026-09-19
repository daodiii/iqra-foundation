import { describe, expect, test } from 'vitest';
import { brief } from '@/content/brief.no';
import { sentences } from './text';

describe('sentences', () => {
  test('splits on the full stop that ends a sentence and keeps every character', () => {
    expect(sentences('Første. Andre setning.')).toEqual(['Første.', 'Andre setning.']);
    expect(sentences('Bare én.')).toEqual(['Bare én.']);
    expect(sentences('Uten punktum til slutt')).toEqual(['Uten punktum til slutt']);
    expect(sentences('  To.   Mellomrom.  ')).toEqual(['To.', 'Mellomrom.']);
  });

  test('each of the brief’s four field texts is two sentences, and joined again they are the text', () => {
    for (const a of brief.areas) {
      const parts = sentences(a.text);
      expect(parts).toHaveLength(2);
      expect(parts.join(' ')).toBe(a.text);
    }
  });
});
