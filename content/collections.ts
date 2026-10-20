/**
 * Where each collection lives and where its files go — the one declaration both doors
 * read: `lib/content.ts` (the site) and `keystatic.config.ts` (the admin). A path written
 * twice would drift; here it is written once and a test holds the two to it.
 *
 * The three kinds of post — arrangementer, nyheter, ressurser — are a folder per entry
 * (`layout: 'folder'`): `<slug>/index.json` for the fields and `<slug>/body.mdoc` for the full
 * text when there is one. Menneskene and styringsdokumenter are one `<slug>.json` per entry
 * (`'flat'`).
 *
 * Files a record points at are uploaded under `public/` and served from the matching public
 * path. An editor's pictures go under `/opplastet`, not `/media`: `next.config.ts` serves
 * `/media` as immutable for a year, and Keystatic names a post's picture after its field, so a
 * replaced picture would keep its name and stay old in a returning visitor's browser.
 */
const upload = (name: string) => ({ directory: `public/opplastet/${name}`, publicPath: `/opplastet/${name}/` });

export const COLLECTIONS = {
  arrangementer: {
    dir: 'content/arrangementer',
    folder: 'arrangementer',
    layout: 'folder',
    files: { image: upload('arrangementer'), body: upload('arrangementer') },
  },
  nyheter: {
    dir: 'content/nyheter',
    folder: 'nyheter',
    layout: 'folder',
    files: { image: upload('nyheter'), body: upload('nyheter') },
  },
  ressurser: {
    dir: 'content/ressurser',
    folder: 'ressurser',
    layout: 'folder',
    files: {
      file: { directory: 'public/files/ressurser', publicPath: '/files/ressurser/' },
      image: upload('ressurser'),
      body: upload('ressurser'),
    },
  },
  styringsdokumenter: {
    dir: 'content/styringsdokumenter',
    folder: 'styringsdokumenter',
    layout: 'flat',
    files: {
      file: { directory: 'public/files/styringsdokumenter', publicPath: '/files/styringsdokumenter/' },
    },
  },
  menneskene: {
    dir: 'content/menneskene',
    folder: 'menneskene',
    layout: 'flat',
    files: {
      photo: { directory: 'public/media/menneskene', publicPath: '/media/menneskene/' },
    },
  },
} as const satisfies Record<
  string,
  { dir: string; folder: string; layout: 'folder' | 'flat'; files: Record<string, { directory: string; publicPath: string }> }
>;

export type CollectionName = keyof typeof COLLECTIONS;
