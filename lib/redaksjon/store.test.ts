import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { GitHubStore, GitHubError } = await import('./github');
const { LocalStore } = await import('./local');
const { getStore, assertPath } = await import('./store');

describe('paths', () => {
  test('only ordinary paths under content/ and public/ pass', () => {
    for (const ok of ['content/nyheter/a/index.json', 'public/opplastet/nyheter/a/x-1.webp']) expect(() => assertPath(ok)).not.toThrow();
    for (const bad of ['../x', 'content/../package.json', '/content/a.json', 'content\\a.json', 'app/page.tsx', 'content//a.json', 'content/./a.json', '.env']) {
      expect(() => assertPath(bad), bad).toThrow();
    }
  });
});

describe('LocalStore', () => {
  let root: string;
  beforeEach(() => { root = mkdtempSync(path.join(tmpdir(), 'redaksjon-store-')); });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  test('writes text and bytes, lists, reads with a version, removes', async () => {
    const s = new LocalStore(root);
    await s.commit([
      { path: 'content/nyheter/a/index.json', text: '{}\n' },
      { path: 'public/opplastet/nyheter/a/b.webp', bytes: new Uint8Array([1, 2, 3]) },
    ], 'm');
    expect(await s.list('content/nyheter')).toEqual(['content/nyheter/a/index.json']);
    const r = await s.read('content/nyheter/a/index.json');
    expect(r?.text).toBe('{}\n');
    expect(r?.version).toMatch(/^[0-9a-f]{40}$/);
    expect([...readFileSync(path.join(root, 'public/opplastet/nyheter/a/b.webp'))]).toEqual([1, 2, 3]);
    await s.commit([{ path: 'content/nyheter/a/index.json', remove: true }], 'm');
    expect(existsSync(path.join(root, 'content/nyheter/a/index.json'))).toBe(false);
    expect(await s.read('content/nyheter/a/index.json')).toBeNull();
    expect(await s.list('content/finnes-ikke')).toEqual([]);
  });
  test('refuses a path outside content/ and public/ before writing anything', async () => {
    const s = new LocalStore(root);
    await expect(s.commit([{ path: 'content/ok.json', text: 'x' }, { path: '../ut.json', text: 'x' }], 'm')).rejects.toThrow(/Ugyldig/);
    expect(existsSync(path.join(root, 'content/ok.json'))).toBe(false);
  });
});

/** A fake GitHub: a branch head, a tree, and a log of every write call. */
function fakeGitHub(opts: { moves?: number } = {}) {
  let moves = opts.moves ?? 0;
  const calls: { method: string; route: string; body: Record<string, unknown> | null }[] = [];
  const files: Record<string, string> = { 'content/nyheter/a/index.json': '{"title":"A"}\n' };
  const f = vi.fn(async (url: string, init: RequestInit) => {
    const route = url.replace('https://api.github.com/repos/o/r', '');
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : null;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t');
    calls.push({ method, route, body });
    const ok = (o: unknown) => new Response(JSON.stringify(o), { status: 200 });
    if (route === '/git/ref/heads/main') return ok({ object: { sha: 'head1' } });
    if (route.startsWith('/git/commits/')) return ok({ tree: { sha: 'tree1' } });
    if (route.startsWith('/git/trees/tree1')) return ok({ truncated: false, tree: Object.keys(files).map((p, i) => ({ path: p, type: 'blob', sha: `b${i}` })) });
    if (route === '/git/blobs/b0') return ok({ content: Buffer.from(files['content/nyheter/a/index.json']).toString('base64'), encoding: 'base64' });
    if (route === '/git/blobs' && method === 'POST') return ok({ sha: 'blob-new' });
    if (route === '/git/trees' && method === 'POST') return ok({ sha: 'tree2' });
    if (route === '/git/commits' && method === 'POST') return ok({ sha: 'commit2' });
    if (route === '/git/refs/heads/main' && method === 'PATCH') {
      if (moves-- > 0) return new Response('{}', { status: 422 });
      return ok({});
    }
    return new Response('{}', { status: 404 });
  });
  return { store: new GitHubStore({ token: 't', owner: 'o', repo: 'r', branch: 'main', fetch: f as unknown as typeof fetch }), calls };
}

describe('GitHubStore', () => {
  test('reads a file through the tree and its blob', async () => {
    const { store } = fakeGitHub();
    expect(await store.list('content/nyheter')).toEqual(['content/nyheter/a/index.json']);
    expect((await store.read('content/nyheter/a/index.json'))?.text).toBe('{"title":"A"}\n');
    expect(await store.read('content/nyheter/b/index.json')).toBeNull();
  });
  test('a save is one commit with exactly its paths, fast-forwarded and never forced', async () => {
    const { store, calls } = fakeGitHub();
    await store.commit([
      { path: 'content/nyheter/a/index.json', text: '{}\n' },
      { path: 'public/opplastet/nyheter/a/x.webp', bytes: new Uint8Array([9]) },
      { path: 'content/nyheter/a/body.mdoc', remove: true },
    ], 'Nyhet: A (ola@example.org)');
    const writes = calls.filter((c) => c.method !== 'GET');
    expect(writes.map((c) => `${c.method} ${c.route}`)).toEqual(['POST /git/blobs', 'POST /git/trees', 'POST /git/commits', 'PATCH /git/refs/heads/main']);
    expect(writes[1].body).toEqual({ base_tree: 'tree1', tree: [
      { path: 'content/nyheter/a/index.json', mode: '100644', type: 'blob', content: '{}\n' },
      { path: 'public/opplastet/nyheter/a/x.webp', mode: '100644', type: 'blob', sha: 'blob-new' },
      { path: 'content/nyheter/a/body.mdoc', mode: '100644', type: 'blob', sha: null },
    ] });
    expect(writes[2].body).toEqual({ message: 'Nyhet: A (ola@example.org)', tree: 'tree2', parents: ['head1'] });
    expect(writes[3].body).toEqual({ sha: 'commit2', force: false });
  });
  test('when the branch moved, it builds again on the new head; after three tries it gives up', async () => {
    const twice = fakeGitHub({ moves: 2 });
    await twice.store.commit([{ path: 'content/a.json', text: 'x' }], 'm');
    expect(twice.calls.filter((c) => c.method === 'PATCH')).toHaveLength(3);
    const always = fakeGitHub({ moves: 9 });
    await expect(always.store.commit([{ path: 'content/a.json', text: 'x' }], 'm')).rejects.toBeInstanceOf(GitHubError);
    expect(always.calls.filter((c) => c.method === 'PATCH')).toHaveLength(3);
  });
  test('refuses a bad path before calling GitHub', async () => {
    const { store, calls } = fakeGitHub();
    await expect(store.commit([{ path: '.github/workflows/x.yml', text: 'x' }], 'm')).rejects.toThrow(/Ugyldig/);
    expect(calls).toHaveLength(0);
  });
});

describe('getStore', () => {
  test('GitHub with a token, the checkout in development, nothing in production without one', () => {
    expect(getStore({ NODE_ENV: 'production', REDAKSJON_GITHUB_TOKEN: 't' } as NodeJS.ProcessEnv)).toBeInstanceOf(GitHubStore);
    expect(getStore({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBeInstanceOf(LocalStore);
    expect(getStore({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toBeNull();
    expect(getStore({ NODE_ENV: 'production', REDAKSJON_LOCAL_ROOT: '/tmp/x' } as NodeJS.ProcessEnv)).toBeInstanceOf(LocalStore);
  });
});
