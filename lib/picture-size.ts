import { readFileSync } from 'node:fs';
import path from 'node:path';
import { imageSize } from 'image-size';

/**
 * A picture's own width and height, read from its file under `public/` — for a picture in a
 * full text, which keeps its proportions. Read when a post's page is built: the post pages are
 * built once per deploy, where `public/` is on disk. Null for an outside address, a path that
 * leaves `public/`, or a file that is not there or not a picture.
 */
export function pictureSize(src: string, root = path.join(process.cwd(), 'public')): { width: number; height: number } | null {
  if (!src.startsWith('/') || src.startsWith('//')) return null;
  let at: string;
  try {
    at = path.resolve(root, `.${decodeURI(src)}`);
  } catch {
    return null; // a malformed %-escape
  }
  if (!at.startsWith(path.resolve(root) + path.sep)) return null;
  try {
    const { width, height } = imageSize(readFileSync(at));
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
}
