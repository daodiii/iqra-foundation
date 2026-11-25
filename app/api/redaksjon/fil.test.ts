import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));
// the login is a signed session cookie (lib/redaksjon/kode.ts); the jar stands in for the request's cookies
const jar = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (name: string) => (name === 'redaksjon_okt' && jar.token ? { value: jar.token } : undefined) }) }));
const SECRET = 'k'.repeat(40);
const { signSession } = await import('@/lib/redaksjon/kode');
const loginAs = (email: string) => (jar.token = signSession(email, Date.now() + 60_000, SECRET));
const blob = vi.hoisted(() => ({ handleUpload: vi.fn() }));
vi.mock('@vercel/blob/client', () => blob);

const route = await import('./fil/route');

const put = (q: string, bytes: Uint8Array<ArrayBuffer>) => route.PUT(new Request(`http://x/api/redaksjon/fil?${q}`, { method: 'PUT', body: bytes }));
const post = (body: unknown) =>
  route.POST(new Request('http://x/api/redaksjon/fil', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }));
const pdf = new TextEncoder().encode('%PDF-1.4 hei');
const tokenAsk = (pathname: string, clientPayload: string) => ({ type: 'blob.generate-client-token', payload: { pathname, clientPayload, multipart: false } });

let root: string;
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'redaksjon-fil-'));
  vi.stubEnv('REDAKSJON_TEST_EDITOR', 'test@example.org');
  vi.stubEnv('REDAKSJON_LOCAL_ROOT', root);
  blob.handleUpload.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  jar.token = undefined;
  rmSync(root, { recursive: true, force: true });
});

describe('the gate', () => {
  test('off is 404; no session 401; an address off the list 403; nothing written', async () => {
    vi.stubEnv('REDAKSJON_TEST_EDITOR', '');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('REDAKSJON_LOCAL_ROOT', '');
    expect((await put('kind=file&name=a-ab12cd.pdf', pdf)).status).toBe(404);
    expect((await post(tokenAsk('ressurser/a-ab12cd.pdf', 'file'))).status).toBe(404);

    vi.stubEnv('REDAKSJON_SECRET', SECRET);
    vi.stubEnv('SMTP_USER', 'nettside@iqrasti.no');
    vi.stubEnv('SMTP_PASS', 'x');
    vi.stubEnv('EDITOR_EMAILS', 'ola@example.org');
    vi.stubEnv('REDAKSJON_LOCAL_ROOT', root);
    expect((await put('kind=file&name=a-ab12cd.pdf', pdf)).status).toBe(401);
    loginAs('per@example.org');
    expect((await post(tokenAsk('ressurser/a-ab12cd.pdf', 'file'))).status).toBe(403);
    expect(existsSync(path.join(root, 'public'))).toBe(false);
    expect(blob.handleUpload).not.toHaveBeenCalled();
  });
});

describe('under dev: into this checkout', () => {
  test('a PDF lands under public/opplastet/ressurser/filer and its address comes back', async () => {
    const r = await put('kind=file&name=rapport-ab12cd.pdf', pdf);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ url: '/opplastet/ressurser/filer/rapport-ab12cd.pdf' });
    expect(readFileSync(path.join(root, 'public/opplastet/ressurser/filer/rapport-ab12cd.pdf'), 'utf8')).toBe('%PDF-1.4 hei');
  });
  test('a bad name or kind is refused', async () => {
    for (const q of ['kind=file&name=../x.pdf', 'kind=file&name=film-ab12cd.mp4', 'kind=bilde&name=a-ab12cd.pdf', 'kind=file&name=a-ab12cd.exe']) {
      expect((await put(q, pdf)).status).toBe(400);
    }
    expect((await put('kind=file&name=a-ab12cd.pdf', new Uint8Array())).status).toBe(413);
  });
  test('the Blob handshake is not offered without Blob', async () => {
    expect((await post(tokenAsk('ressurser/a-ab12cd.pdf', 'file'))).status).toBe(503);
  });
});

describe('with Blob', () => {
  beforeEach(() => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_x');
  });

  test('a token is limited to its kind, its size and one path under ressurser/', async () => {
    let limits: unknown;
    blob.handleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => {
      limits = await onBeforeGenerateToken('ressurser/film-ab12cd.mp4', 'video', false);
      return { type: 'blob.generate-client-token', clientToken: 't' };
    });
    const r = await post(tokenAsk('ressurser/film-ab12cd.mp4', 'video'));
    expect(r.status).toBe(200);
    expect(limits).toMatchObject({ allowedContentTypes: ['video/mp4', 'video/webm'], maximumSizeInBytes: 500 * 1024 * 1024, allowOverwrite: false });
  });
  test('another path, a wrong kind or a completion call is refused', async () => {
    blob.handleUpload.mockImplementation(async ({ body, onBeforeGenerateToken }) => {
      await onBeforeGenerateToken(body.payload.pathname, body.payload.clientPayload, false);
      return { type: 'blob.generate-client-token', clientToken: 't' };
    });
    expect((await post(tokenAsk('annet/film-ab12cd.mp4', 'video'))).status).toBe(400);
    expect((await post(tokenAsk('ressurser/film-ab12cd.mp4', 'file'))).status).toBe(400);
    expect((await post(tokenAsk('ressurser/../x-ab12cd.pdf', 'file'))).status).toBe(400);
    expect((await post({ type: 'blob.upload-completed', payload: {} })).status).toBe(400);
    // The local write is not open while Blob is the way.
    expect((await put('kind=file&name=a-ab12cd.pdf', pdf)).status).toBe(404);
  });
});
