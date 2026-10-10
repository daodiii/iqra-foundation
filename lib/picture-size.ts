import { readFileSync } from 'node:fs';
import path from 'node:path';
import { imageSize } from 'image-size';

/**
 * A picture's own width and height, upright as Next draws it, read from its file under `public/` — for a picture in a
 * full text, which keeps its proportions. Read when a post's page is built: the post pages are
 * built once per deploy, where `public/` is on disk. Null for an outside address, a path that
 * leaves `public/`, or a file that is not there or not a picture.
 *
 * Both `turbopackIgnore` marks keep `public/` out of the post pages' server bundles. Unmarked,
 * the read made Turbopack trace the whole project into each (455 files, 12.2 MB), and the
 * folder alone still brought in all of `public/` (5.1 MB, growing with every upload). Nothing
 * reads these files after the build: the pages are static, and a missing file is a plain <img>.
 */
export function pictureSize(src: string, root = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public')): { width: number; height: number } | null {
  if (!src.startsWith('/') || src.startsWith('//')) return null;
  let at: string;
  try {
    at = path.resolve(root, `.${decodeURI(src)}`);
  } catch {
    return null; // a malformed %-escape
  }
  if (!at.startsWith(path.resolve(root) + path.sep)) return null;
  try {
    const { width, height, orientation } = imageSize(readFileSync(/*turbopackIgnore: true*/ at));
    if (!width || !height) return null;
    // EXIF orientations 5–8 are a quarter turn: a phone photo stored on its side. Next's
    // optimiser turns it upright, so the box it is drawn in is the other way round.
    return orientation && orientation >= 5 && orientation <= 8 ? { width: height, height: width } : { width, height };
  } catch {
    return null;
  }
}
