import { describe, expect, test } from 'vitest';
import config from '@/keystatic.config';
import { COLLECTIONS, type CollectionName } from './collections';

/**
 * The two doors read the same files. Keystatic's config declares where a collection lives
 * and where its uploads go; `lib/content.ts` reads the same places through `COLLECTIONS`.
 * This holds the config to that one declaration, so a path changed on one side fails here
 * rather than as an admin that writes where the site does not look.
 */
type AssetField = {
  kind?: string;
  directory?: string;
  serialize: (value: unknown, args: { slug: string }) => { value: unknown };
  fields?: Record<string, AssetField>;
};

describe.each(Object.keys(COLLECTIONS) as CollectionName[])('%s', (name) => {
  const c = config.collections![name] as unknown as { path: string; format: unknown; schema: Record<string, AssetField> };

  test('is a collection of JSON files in the directory the site reads', () => {
    // Nyheter is a folder per item, its article text beside the fields; the rest are one file each.
    if (name === 'nyheter') {
      expect(c.path).toBe(`${COLLECTIONS[name].dir}/*/`);
      expect(c.format).toEqual({ data: 'json', contentField: 'body' });
    } else {
      expect(c.path).toBe(`${COLLECTIONS[name].dir}/*`);
      expect(c.format).toEqual({ data: 'json' });
    }
  });

  test('every upload field stores under the site’s directory and records the site’s public path', () => {
    // `body` is the article text's pictures, which Keystatic's rich-text field places itself.
    for (const [key, where] of Object.entries(COLLECTIONS[name].files).filter(([k]) => k !== 'body')) {
      // A picture is an object of `src` (the file) and `alt`; a plain file is the field itself.
      const field = c.schema[key] as AssetField & { values?: { true?: AssetField } };
      // A ticked-box picture (Keystatic's conditional) keeps its object under `values.true`.
      const object = field.values?.true ?? field;
      const asset = object.fields ? object.fields.src : object;
      expect(asset, `${name}.${key}`).toBeDefined();
      expect(asset.directory, `${name}.${key}.directory`).toBe(where.directory);
      // The field does not expose publicPath; what it writes into the record does.
      const written = asset.serialize('bilde.jpg', { slug: 'et-innlegg' }).value as string;
      expect(written, `${name}.${key} as written`).toMatch(new RegExp(`^${where.publicPath.replace(/\//g, '\\/')}`));
    }
  });
});

test('the config has no collection the site does not read', () => {
  expect(Object.keys(config.collections!).sort()).toEqual(Object.keys(COLLECTIONS).sort());
});
