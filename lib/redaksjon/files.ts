/**
 * What both stores share: a change, the store's shape, the stale-save error and the path check.
 * Kept apart from `store.ts` so the two backends do not import the file that imports them.
 */

/** One file to write (text or bytes) or remove, by repo path. */
export type Change = { path: string; text: string } | { path: string; bytes: Uint8Array } | { path: string; remove: true };

export interface Store {
  /** Every file path under a folder, at any depth. */
  list(prefix: string): Promise<string[]>;
  /** A text file's contents and version, or null when it does not exist. */
  read(path: string): Promise<{ text: string; version: string } | null>;
  /** Writes all changes as one change set (one commit on GitHub). */
  commit(changes: Change[], message: string): Promise<void>;
}

/** A save over a file that changed after it was opened. */
export class StaleError extends Error {
  constructor(public path: string) {
    super(`${path} er endret av noen andre siden du åpnet den.`);
  }
}

/** Only ordinary repo paths under `content/` or `public/`: no `..`, no absolute paths, no backslashes. */
export function assertPath(p: string): void {
  if (!/^(content|public)\/[A-Za-z0-9._\-/]+$/.test(p) || p.split('/').some((seg) => seg === '' || seg === '.' || seg === '..')) {
    throw new Error(`Ugyldig filsti: ${p}`);
  }
}
