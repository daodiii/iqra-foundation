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

const list = await import('./[section]/route');
const one = await import('./[section]/[slug]/route');
const { getNews } = await import('@/lib/content');

const ctx = <P extends Record<string, string>>(params: P) => ({ params: Promise.resolve(params) }) as never;
const json = (body: unknown, method = 'POST') =>
  new Request('http://x/api', { method, body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

const POST = (section: string, body: unknown) => list.POST(json(body), ctx({ section }));
const GET1 = (section: string, slug: string) => one.GET(new Request('http://x'), ctx({ section, slug }));
const PUT = (section: string, slug: string, body: unknown) => one.PUT(json(body, 'PUT'), ctx({ section, slug }));
const DEL = (section: string, slug: string, version: string) =>
  one.DELETE(new Request(`http://x/?version=${encodeURIComponent(version)}`, { method: 'DELETE' }), ctx({ section, slug }));

const nyhet = (over: Record<string, unknown> = {}) => ({
  fields: { title: 'Åpen dag på Furuset', date: '2026-11-19', summary: 'Kom innom.', image: null, publish: true, body: '## Hei\n\nVelkommen.', ...over },
});
// The smallest WebP the check accepts: RIFF....WEBP
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(8)]).toString('base64');

let root: string;
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'redaksjon-api-'));
  vi.stubEnv('REDAKSJON_TEST_EDITOR', 'test@example.org');
  vi.stubEnv('REDAKSJON_LOCAL_ROOT', root);
});
afterEach(() => {
  vi.unstubAllEnvs();
  jar.token = undefined;
  rmSync(root, { recursive: true, force: true });
});

describe('the gate', () => {
  test('off is 404; no session 401; an address off the list 403', async () => {
    vi.stubEnv('REDAKSJON_TEST_EDITOR', '');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('REDAKSJON_LOCAL_ROOT', '');
    expect((await list.GET(new Request('http://x'), ctx({ section: 'nyheter' }))).status).toBe(404);

    vi.stubEnv('REDAKSJON_SECRET', SECRET);
    vi.stubEnv('SMTP_USER', 'nettside@iqrasti.no');
    vi.stubEnv('SMTP_PASS', 'x');
    vi.stubEnv('EDITOR_EMAILS', 'ola@example.org');
    vi.stubEnv('REDAKSJON_LOCAL_ROOT', root);
    expect((await POST('nyheter', nyhet())).status).toBe(401);
    expect((await GET1('nyheter', 'x')).status).toBe(401);
    loginAs('per@example.org');
    expect((await PUT('nyheter', 'x', nyhet())).status).toBe(403);
    expect((await DEL('nyheter', 'x', '')).status).toBe(403);
    expect(existsSync(path.join(root, 'content'))).toBe(false);
  });
  test('an unknown section or a bad address is 404', async () => {
    expect((await list.GET(new Request('http://x'), ctx({ section: 'hemmelig' }))).status).toBe(404);
    expect((await GET1('nyheter', '..%2Fpackage')).status).toBe(404);
    expect((await PUT('nyheter', '../../x', nyhet())).status).toBe(404);
  });
});

describe('a news post through the API', () => {
  test('create, read back through the site, save, move, delete', async () => {
    const made = await POST('nyheter', nyhet());
    expect(made.status).toBe(201);
    const a = (await made.json()) as { slug: string; version: string; note: string };
    expect(a.slug).toBe('apen-dag-pa-furuset');
    expect(a.note).toMatch(/synlig på nettsiden om 2–3 minutter/i);

    const news = getNews(path.join(root, 'content/nyheter'));
    expect(news.map((n) => n.title)).toEqual(['Åpen dag på Furuset']);

    const opened = (await (await GET1('nyheter', a.slug)).json()) as { fields: { body: string }; version: string };
    expect(opened.version).toBe(a.version);
    expect(opened.fields.body).toBe('## Hei\n\nVelkommen.\n');

    const saved = await PUT('nyheter', a.slug, { ...nyhet({ title: 'Åpen dag', publish: false }), version: a.version, slug: 'apen-dag' });
    expect(saved.status).toBe(200);
    const b = (await saved.json()) as { slug: string; version: string; note: string };
    expect(b.slug).toBe('apen-dag');
    expect(b.note).toMatch(/utkast/);
    expect(existsSync(path.join(root, 'content/nyheter/apen-dag-pa-furuset'))).toBe(true); // the folder; its files are gone
    expect(existsSync(path.join(root, 'content/nyheter/apen-dag-pa-furuset/index.json'))).toBe(false);
    expect(getNews(path.join(root, 'content/nyheter'))).toEqual([]); // a draft is not on the site

    expect((await DEL('nyheter', 'apen-dag', 'feil')).status).toBe(409);
    expect((await DEL('nyheter', 'apen-dag', b.version)).status).toBe(204);
    expect((await GET1('nyheter', 'apen-dag')).status).toBe(404);
  });

  test('an invalid post is 422 with the fields named, and nothing is written', async () => {
    const r = await POST('nyheter', nyhet({ title: ' ', summary: '', image: { src: '/opplastet/nyheter/x/a.webp', alt: '' } }));
    expect(r.status).toBe(422);
    const body = (await r.json()) as { fields: { key: string }[] };
    expect(body.fields.map((f) => f.key)).toEqual(['title', 'summary', 'image']);
    expect(existsSync(path.join(root, 'content'))).toBe(false);
  });

  test('pictures, files and videos must be the site\'s own or in the Blob store', async () => {
    const keys = async (section: string, fields: Record<string, unknown>) =>
      ((await (await POST(section, { fields })).json()) as { fields: { key: string }[] }).fields.map((f) => f.key);
    expect(await keys('nyheter', nyhet({ image: { src: 'https://evil.example/x.jpg', alt: 'x' } }).fields)).toEqual(['image']);
    expect(await keys('nyheter', nyhet({ body: 'Se ![x](https://evil.example/x.jpg)' }).fields)).toEqual(['body']);
    expect(await keys('nyheter', nyhet({ image: { src: '/opplastet/../../x.webp', alt: 'x' } }).fields)).toEqual(['image']);
    const ressurs = { title: 'Rapport', category: 'publikasjoner', date: '2026-11-24', summary: 'Kort.', url: '' };
    expect(await keys('ressurser', { ...ressurs, file: 'https://evil.example/malware.pdf' })).toEqual(['file']);
    expect(await keys('ressurser', { ...ressurs, video: 'https://abc123.public.blob.vercel-storage.com/annet/x.mp4' })).toEqual(['video']);
    const ok = await POST('ressurser', { fields: { ...ressurs, file: 'https://abc123.public.blob.vercel-storage.com/ressurser/rapport-ab12cd.pdf' } });
    expect(ok.status).toBe(201);
  });

  test('an event whose title gives no address still saves, under a stand-in', async () => {
    const r = await POST('arrangementer', { fields: { title: 'محاضرة', start: '2027-01-10', place: 'Oslo', text: 'Et foredrag.' }, slug: '' });
    expect(r.status).toBe(201);
    expect(((await r.json()) as { slug: string }).slug).toMatch(/^arrangement-[a-z0-9]{6}$/);
  });

  test('fields of the wrong type are read as empty, not trusted', async () => {
    const r = await POST('nyheter', { fields: { title: { $gt: '' }, date: 7, summary: ['x'] } });
    expect(r.status).toBe(422);
  });

  test('a taken address is 409; a save over a changed post is 409', async () => {
    const a = (await (await POST('nyheter', nyhet())).json()) as { slug: string; version: string };
    expect((await POST('nyheter', nyhet())).status).toBe(409);
    await PUT('nyheter', a.slug, { ...nyhet({ summary: 'Endret av Kari.' }), version: a.version });
    const stale = await PUT('nyheter', a.slug, { ...nyhet({ summary: 'Mitt.' }), version: a.version });
    expect(stale.status).toBe(409);
    expect(((await stale.json()) as { error: string }).error).toMatch(/Noen andre/);
  });

  test('pictures ride in the same save, under /opplastet/<section>/<slug>/, and must be pictures', async () => {
    const pic = { src: '/opplastet/nyheter/apen-dag-pa-furuset/forside.webp', alt: 'Folk i et lyst rom' };
    const r = await POST('nyheter', { ...nyhet({ image: pic }), uploads: [{ name: 'forside.webp', data: webp }] });
    expect(r.status).toBe(201);
    expect(readFileSync(path.join(root, 'public/opplastet/nyheter/apen-dag-pa-furuset/forside.webp')).subarray(0, 4).toString()).toBe('RIFF');
    expect(getNews(path.join(root, 'content/nyheter'))[0].image).toEqual(pic);

    const fake = await POST('nyheter', { ...nyhet({ title: 'To' }), uploads: [{ name: 'x.webp', data: Buffer.from('<script>').toString('base64') }] });
    expect(fake.status).toBe(400);
    const sneaky = await POST('nyheter', { ...nyhet({ title: 'Tre' }), uploads: [{ name: '../../app/page.webp', data: webp }] });
    expect(sneaky.status).toBe(400);
  });

  test('the list is newest first and marks drafts', async () => {
    await POST('nyheter', nyhet({ title: 'Eldre', date: '2026-01-01' }));
    await POST('nyheter', nyhet({ title: 'Nyere', date: '2026-10-01', publish: false }));
    const { entries } = (await (await list.GET(new Request('http://x'), ctx({ section: 'nyheter' }))).json()) as {
      entries: { title: string; draft: boolean }[];
    };
    expect(entries.map((e) => [e.title, e.draft])).toEqual([['Nyere', true], ['Eldre', false]]);
  });
});
