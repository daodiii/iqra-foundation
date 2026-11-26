import 'server-only';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertPath, type Change, type Store } from './files';

/** The checkout's own files: `next dev` and the e2e suite save here, with no token. */
export class LocalStore implements Store {
  constructor(private root: string) {}

  private abs(p: string): string {
    assertPath(p);
    return path.join(/*turbopackIgnore: true*/ this.root, p);
  }

  async list(prefix: string): Promise<string[]> {
    const out: string[] = [];
    const walk = async (rel: string) => {
      let names;
      try {
        names = await readdir(path.join(/*turbopackIgnore: true*/ this.root, rel), { withFileTypes: true });
      } catch {
        return;
      }
      for (const d of names) {
        const p = `${rel}/${d.name}`;
        if (d.isDirectory()) await walk(p);
        else out.push(p);
      }
    };
    await walk(prefix.replace(/\/$/, ''));
    return out.sort();
  }

  async read(p: string) {
    try {
      const text = await readFile(this.abs(p), 'utf8');
      return { text, version: createHash('sha1').update(text).digest('hex') };
    } catch {
      return null;
    }
  }

  async commit(changes: Change[]): Promise<void> {
    for (const c of changes) assertPath(c.path);
    for (const c of changes) {
      const at = this.abs(c.path);
      if ('remove' in c) {
        await rm(at, { force: true });
        continue;
      }
      await mkdir(path.dirname(at), { recursive: true });
      await writeFile(at, 'text' in c ? c.text : c.bytes);
    }
  }
}
