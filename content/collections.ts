/**
 * Where each collection lives and where its files go — the one declaration both doors
 * read: `lib/content.ts` (the site) and `keystatic.config.ts` (the admin). A path written
 * twice would drift; here it is written once and a test holds the two to it.
 *
 * Every collection is a directory of JSON files, one per entry, named by slug. Files a
 * record points at (a PDF, a photograph) are uploaded under `public/` and served from the
 * matching public path.
 */
export const COLLECTIONS = {
  arrangementer: {
    dir: 'content/arrangementer',
    folder: 'arrangementer',
    files: {
      image: { directory: 'public/media/arrangementer', publicPath: '/media/arrangementer/' },
    },
  },
  /**
   * Nyheter: one folder per item, `<slug>/index.json` for the fields and `<slug>/body.mdoc` for
   * the article text, as Keystatic writes a collection with a rich-text field. An editor's
   * pictures go under `/opplastet`, not `/media`, which `next.config.ts` serves as immutable.
   */
  nyheter: {
    dir: 'content/nyheter',
    folder: 'nyheter',
    files: {
      image: { directory: 'public/opplastet/nyheter', publicPath: '/opplastet/nyheter/' },
      body: { directory: 'public/opplastet/nyheter', publicPath: '/opplastet/nyheter/' },
    },
  },
  ressurser: {
    dir: 'content/ressurser',
    folder: 'ressurser',
    files: {
      file: { directory: 'public/files/ressurser', publicPath: '/files/ressurser/' },
      video: { directory: 'public/files/ressurser', publicPath: '/files/ressurser/' },
    },
  },
  menneskene: {
    dir: 'content/menneskene',
    folder: 'menneskene',
    files: {
      photo: { directory: 'public/media/menneskene', publicPath: '/media/menneskene/' },
    },
  },
} as const satisfies Record<string, { dir: string; folder: string; files: Record<string, { directory: string; publicPath: string }> }>;

export type CollectionName = keyof typeof COLLECTIONS;
