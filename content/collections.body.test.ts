import { expect, test, vi } from 'vitest';
import { COLLECTIONS } from './collections';

/**
 * A picture in a full text asks for its words. Keystatic keeps the Markdoc field's image
 * options in a closure, out of reach on the field it returns, so this holds the config to it
 * through the public argument instead: `fields.markdoc` is wrapped to record what each full
 * text is built with, and the real field is still returned. The mock covers this whole file,
 * which is why it is not in `collections.test.ts`, where the config is tested unmocked.
 */
type MarkdocArgs = Parameters<typeof import('@keystatic/core').fields.markdoc>[0];
const calls = vi.hoisted(() => [] as MarkdocArgs[]);

vi.mock('@keystatic/core', async (importOriginal) => {
  const real = await importOriginal<typeof import('@keystatic/core')>();
  const markdoc = Object.assign((args: MarkdocArgs) => {
    calls.push(args);
    return real.fields.markdoc(args);
  }, real.fields.markdoc);
  return { ...real, fields: { ...real.fields, markdoc } };
});

const { default: config } = await import('@/keystatic.config');

test('the config is built with one full text for each kind of post', () => {
  expect(config.collections).toBeDefined();
  expect(calls).toHaveLength(3);
  const dirs = calls.map((c) => (typeof c.options?.image === 'object' ? c.options.image.directory : undefined)).sort();
  expect(dirs).toEqual(
    [COLLECTIONS.arrangementer.files.body.directory, COLLECTIONS.nyheter.files.body.directory, COLLECTIONS.ressurser.files.body.directory].sort(),
  );
});

test('a picture in a full text cannot be described with nothing', () => {
  expect(calls).toHaveLength(3);
  for (const call of calls) {
    const image = call.options?.image;
    expect(typeof image, `${call.label}: options.image`).toBe('object');
    const alt = (image as Exclude<typeof image, boolean | undefined>).schema?.alt;
    expect(alt, `${call.label}: options.image.schema.alt`).toBeDefined();
    expect(alt!.label).toBe('Bildebeskrivelse');
    expect(() => alt!.validate('', undefined)).toThrow('Bildebeskrivelse must not be empty');
    expect(alt!.validate('Et blått felt', undefined)).toBe('Et blått felt');
  }
});
