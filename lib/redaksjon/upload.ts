/**
 * A resource's file or video: what may be uploaded and where it goes. Shared by the browser (to
 * refuse a wrong file before it leaves) and the upload route (which checks again).
 *
 * Pictures travel with a save, shrunk, inside the commit. PDFs and videos are too big for that:
 * a Vercel function takes at most 4.5 MB. So they go apart from the save:
 * - **blob**: in production with Blob switched on, the browser uploads straight to Vercel Blob
 *   with a short-lived token from `/api/redaksjon/fil`; the entry keeps the file's Blob address.
 * - **local**: under `next dev` and the e2e suite (no Blob), the route writes the file into the
 *   checkout's `public/opplastet/ressurser/filer/`.
 * - **off**: production without Blob. The editor says so and offers a link instead.
 */

export type FileMode = 'blob' | 'local' | 'off';
export type FileKind = 'file' | 'video';

type Env = Record<string, string | undefined>;

export function fileMode(env: Env = process.env): FileMode {
  if (env.BLOB_READ_WRITE_TOKEN) return 'blob';
  // The same rule as the store's: a GitHub token means production saving, where the checkout is not the site.
  if (env.REDAKSJON_GITHUB_TOKEN) return 'off';
  if (env.NODE_ENV === 'production' && !env.REDAKSJON_LOCAL_ROOT) return 'off';
  return 'local';
}

/** The kinds the site can offer: a document to download, a video to play on the page. */
export const KINDS: Record<FileKind, { types: string[]; ext: string[]; max: number; label: string }> = {
  file: {
    types: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    ext: ['pdf', 'docx', 'pptx'],
    max: 50 * 1024 * 1024,
    label: 'PDF, Word eller PowerPoint, inntil 50 MB',
  },
  video: {
    types: ['video/mp4', 'video/webm'],
    ext: ['mp4', 'webm'],
    max: 500 * 1024 * 1024,
    label: 'MP4 eller WebM, inntil 500 MB',
  },
};

/** The file's ending, lower case, or ''. */
export const extOf = (name: string) => (/\.([a-z0-9]+)$/i.exec(name)?.[1] ?? '').toLowerCase();

/** Why this file cannot be used as this kind, in the editor's words; null when it can. */
export function refusal(kind: FileKind, name: string, size: number): string | null {
  const k = KINDS[kind];
  if (!k.ext.includes(extOf(name))) return kind === 'video' ? 'Videoen må være MP4 eller WebM.' : 'Filen må være PDF, Word eller PowerPoint.';
  if (size > k.max) return `Filen er for stor. Grensen er ${Math.round(k.max / 1024 / 1024)} MB.`;
  if (size === 0) return 'Filen er tom.';
  return null;
}

/**
 * A safe stored name: the original's name in lower case ASCII with dashes, its ending kept, and a
 * short random tail so two files of the same name never meet. The tail comes from the caller, so
 * this stays testable.
 */
export function storedName(name: string, tail: string): string {
  const ext = extOf(name);
  const stem = name
    .replace(/\.[^.]*$/, '')
    .toLowerCase()
    .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'o').replace(/[å]/g, 'a')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'fil';
  return `${stem}-${tail}.${ext}`;
}

/** A stored name the route accepts: what `storedName` makes, nothing else. */
export const isStoredName = (v: string) => /^[a-z0-9][a-z0-9-]{0,80}\.(pdf|docx|pptx|mp4|webm)$/.test(v);

/** The Blob pathname for a stored name: everything the editor uploads sits under `ressurser/`. */
export const blobPath = (stored: string) => `ressurser/${stored}`;
