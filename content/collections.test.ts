import { describe, expect, test } from 'vitest';
import config from '@/keystatic.config';
import { COLLECTIONS, type CollectionName } from './collections';

/**
 * The two doors read the same files. Keystatic's config declares where a collection lives
 * and where its uploads go; `lib/content.ts` reads the same places through `COLLECTIONS`.
 * This holds the config to that one declaration, so a path changed on one side fails here
 * rather than as an admin that writes where the site does not look.
 */
type Field = {
  kind?: string;
  formKind?: string;
  directory?: string;
  directories?: string[];
  serialize?: (value: unknown, args: { slug: string }) => { value: unknown };
  fields?: Record<string, Field>;
  values?: Record<string, Field>;
};

/** The field that stores the file: a plain upload, a picture object's `src`, or the `src` of a ticked conditional picture. */
const assetOf = (field: Field): Field => field.values?.true?.fields?.src ?? field.fields?.src ?? field;

describe.each(Object.keys(COLLECTIONS) as CollectionName[])('%s', (name) => {
  const c = config.collections![name] as unknown as { path: string; format: unknown; schema: Record<string, Field> };
  const want = COLLECTIONS[name];

  test('lives where the site reads it, as JSON, in the declared layout', () => {
    expect(c.path).toBe(want.layout === 'folder' ? `${want.dir}/*/` : `${want.dir}/*`);
    expect(c.format).toEqual({ data: 'json' });
  });

  test('every upload stores under the site’s directory and records the site’s public path', () => {
    for (const [key, where] of Object.entries(want.files)) {
      const field = c.schema[key];
      expect(field, `${name}.${key}`).toBeDefined();
      if (field.formKind === 'content') {
        // A full text: the pictures put into it are stored in the declared directory.
        expect(field.directories, `${name}.${key}.directories`).toContain(where.directory);
        continue;
      }
      const asset = assetOf(field);
      expect(asset.directory, `${name}.${key}.directory`).toBe(where.directory);
      // The field does not expose publicPath; what it writes into the record does.
      const written = asset.serialize!('bilde.jpg', { slug: 'et-innlegg' }).value as string;
      expect(written, `${name}.${key} as written`).toMatch(new RegExp(`^${where.publicPath.replace(/\//g, '\\/')}`));
    }
  });
});

test('the config has no collection the site does not read', () => {
  expect(Object.keys(config.collections!).sort()).toEqual(Object.keys(COLLECTIONS).sort());
});

test('the three kinds of post share the Publiser box, a full text, and a picture that cannot lack its words', () => {
  for (const name of ['arrangementer', 'nyheter', 'ressurser'] as const) {
    const s = (config.collections![name] as unknown as { schema: Record<string, Field> }).schema;
    expect(s.publish, `${name}.publish`).toBeDefined();
    expect(s.summary, `${name}.summary`).toBeDefined();
    expect(s.body.formKind, `${name}.body`).toBe('content');
    expect(s.image.kind, `${name}.image`).toBe('conditional');
  }
});

test('«Klokkeslett» takes a time as Norwegians write it, or nothing, and refuses the rest with its message', () => {
  const time = (config.collections!.arrangementer as unknown as { schema: { time: { validate: (v: string) => unknown } } }).schema.time;
  for (const ok of ['18.00', '9:30', '18:00', '9.30', '']) expect(() => time.validate(ok), ok).not.toThrow();
  for (const bad of ['18:00–21:00', 'kl 18', '24:00', '18']) expect(() => time.validate(bad), bad).toThrow('Skriv klokkeslettet som for eksempel 18:00.');
});

test('the sidebar groups the posts under Innlegg and the rest under Stiftelsen', () => {
  expect(config.ui?.navigation).toEqual({
    Innlegg: ['arrangementer', 'nyheter', 'ressurser'],
    Stiftelsen: ['menneskene', 'styringsdokumenter'],
  });
});
