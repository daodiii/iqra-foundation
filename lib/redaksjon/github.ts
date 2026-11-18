import 'server-only';
import { createHash } from 'node:crypto';
import { assertPath, type Change, type Store } from './files';

type Opts = { token: string; owner: string; repo: string; branch: string; fetch?: typeof fetch };
type TreeEntry = { path: string; type: string; sha: string };

/**
 * `main` on GitHub through the Git Data API. A save is one commit: new blobs, a tree on top of
 * the branch head, a commit, and a fast-forward of the branch. If the branch moved in between
 * (someone else saved), it builds again on the new head, up to three times; it never forces.
 */
export class GitHubStore implements Store {
  private f: typeof fetch;
  constructor(private o: Opts) {
    this.f = o.fetch ?? fetch;
  }

  private async api<T>(method: string, route: string, body?: unknown): Promise<T> {
    const res = await this.f(`https://api.github.com/repos/${this.o.owner}/${this.o.repo}${route}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.o.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (!res.ok) throw new GitHubError(res.status, `${method} ${route}: ${res.status}`);
    return (await res.json()) as T;
  }

  private async head(): Promise<{ commit: string; tree: string }> {
    const ref = await this.api<{ object: { sha: string } }>('GET', `/git/ref/heads/${this.o.branch}`);
    const c = await this.api<{ tree: { sha: string } }>('GET', `/git/commits/${ref.object.sha}`);
    return { commit: ref.object.sha, tree: c.tree.sha };
  }

  private async tree(): Promise<TreeEntry[]> {
    const { tree } = await this.head();
    const t = await this.api<{ tree: TreeEntry[]; truncated: boolean }>('GET', `/git/trees/${tree}?recursive=1`);
    return t.tree;
  }

  async list(prefix: string): Promise<string[]> {
    const dir = prefix.replace(/\/$/, '') + '/';
    return (await this.tree()).filter((e) => e.type === 'blob' && e.path.startsWith(dir)).map((e) => e.path).sort();
  }

  async read(p: string) {
    assertPath(p);
    const entry = (await this.tree()).find((e) => e.path === p && e.type === 'blob');
    if (!entry) return null;
    const blob = await this.api<{ content: string; encoding: string }>('GET', `/git/blobs/${entry.sha}`);
    const text = Buffer.from(blob.content, blob.encoding === 'base64' ? 'base64' : 'utf8').toString('utf8');
    return { text, version: createHash('sha1').update(text).digest('hex') };
  }

  async commit(changes: Change[], message: string): Promise<void> {
    for (const c of changes) assertPath(c.path);
    // Bytes go up as blobs first; text rides in the tree.
    const entries = await Promise.all(
      changes.map(async (c) => {
        if ('remove' in c) return { path: c.path, mode: '100644', type: 'blob', sha: null };
        if ('text' in c) return { path: c.path, mode: '100644', type: 'blob', content: c.text };
        const b = await this.api<{ sha: string }>('POST', '/git/blobs', { content: Buffer.from(c.bytes).toString('base64'), encoding: 'base64' });
        return { path: c.path, mode: '100644', type: 'blob', sha: b.sha };
      }),
    );
    for (let attempt = 0; ; attempt++) {
      const head = await this.head();
      const tree = await this.api<{ sha: string }>('POST', '/git/trees', { base_tree: head.tree, tree: entries });
      const commit = await this.api<{ sha: string }>('POST', '/git/commits', { message, tree: tree.sha, parents: [head.commit] });
      try {
        await this.api('PATCH', `/git/refs/heads/${this.o.branch}`, { sha: commit.sha, force: false });
        return;
      } catch (e) {
        // 422: the branch moved since we read its head. Build again on the new one.
        if (!(e instanceof GitHubError) || e.status !== 422 || attempt >= 2) throw e;
      }
    }
  }
}

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
