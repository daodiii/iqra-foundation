import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));
// no real mail from the tests: the sender is replaced, and what it would send is kept here
const outbox = vi.hoisted(() => ({ mails: [] as { to: string; subject: string; text: string }[] }));
vi.mock('@/lib/redaksjon/mail', () => ({ smtpSender: () => async (m: { to: string; subject: string; text: string }) => void outbox.mails.push(m) }));

const askRoute = await import('./logg-inn/kode/route');
const loginRoute = await import('./logg-inn/route');
const outRoute = await import('./logg-ut/route');
const { resetSendLimit } = await import('@/lib/redaksjon/login');
const { verifySession } = await import('@/lib/redaksjon/kode');

const SECRET = 'k'.repeat(40);
const json = (body: object, cookie?: string) =>
  new Request('http://x/api', { method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body) });
const cookieFrom = (r: Response, name: string) => r.headers.getSetCookie().find((c) => c.startsWith(`${name}=`))?.split(';')[0];

beforeEach(() => {
  outbox.mails = [];
  resetSendLimit();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('REDAKSJON_TEST_EDITOR', '');
  vi.stubEnv('REDAKSJON_SECRET', SECRET);
  vi.stubEnv('SMTP_USER', 'nettside@iqrasti.no');
  vi.stubEnv('SMTP_PASS', 'x');
  vi.stubEnv('EDITOR_EMAILS', 'kari@iqrasti.no');
  vi.stubEnv('REDAKSJON_GITHUB_TOKEN', 't');
});
afterEach(() => vi.unstubAllEnvs());

describe('the login endpoints', () => {
  test('ask for a code, type it back: a session cookie, httpOnly, for the whole site, and the code cookie cleared', async () => {
    const asked = await askRoute.POST(json({ epost: 'Kari@iqrasti.no' }));
    expect(asked.status).toBe(200);
    expect(outbox.mails.map((m) => m.to)).toEqual(['kari@iqrasti.no']);
    const challenge = cookieFrom(asked, 'redaksjon_kode')!;
    expect(asked.headers.getSetCookie()[0]).toMatch(/HttpOnly/i);
    expect(asked.headers.getSetCookie()[0]).toMatch(/Path=\/api\/redaksjon\/logg-inn/);

    const code = outbox.mails[0].text.match(/Koden din er ([A-Z0-9-]{9})\./)![1];
    const done = await loginRoute.POST(json({ kode: code }, challenge));
    expect(done.status).toBe(200);
    const session = cookieFrom(done, 'redaksjon_okt')!;
    expect(verifySession(session.split('=')[1], Date.now(), SECRET)).toBe('kari@iqrasti.no');
    const set = done.headers.getSetCookie();
    const okt = set.find((c) => c.startsWith('redaksjon_okt='))!;
    expect(okt).toMatch(/HttpOnly/i);
    expect(okt).toMatch(/SameSite=Lax/i);
    expect(okt).toMatch(/Path=\/(;|$)/);
    expect(set.find((c) => c.startsWith('redaksjon_kode='))).toMatch(/Max-Age=0/i);
  });

  test('an address not on the list: the same answer, a code cookie too, and no mail', async () => {
    const r = await askRoute.POST(json({ epost: 'fremmed@example.com' }));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(cookieFrom(r, 'redaksjon_kode')).toBeTruthy();
    expect(outbox.mails).toHaveLength(0);
  });

  test('a wrong code, or no code cookie, is a 400 with no session', async () => {
    const asked = await askRoute.POST(json({ epost: 'kari@iqrasti.no' }));
    const challenge = cookieFrom(asked, 'redaksjon_kode')!;
    const wrong = await loginRoute.POST(json({ kode: 'AAAA-AAAA' }, challenge));
    expect(wrong.status).toBe(400);
    expect(cookieFrom(wrong, 'redaksjon_okt')).toBeUndefined();
    expect((await loginRoute.POST(json({ kode: 'AAAA-AAAA' }))).status).toBe(400);
  });

  test('the editor switched off: both endpoints are a 404 and nothing is sent', async () => {
    vi.stubEnv('REDAKSJON_SECRET', '');
    expect((await askRoute.POST(json({ epost: 'kari@iqrasti.no' }))).status).toBe(404);
    expect((await loginRoute.POST(json({ kode: 'AAAA-AAAA' }))).status).toBe(404);
    expect(outbox.mails).toHaveLength(0);
  });

  test('logging out clears the session cookie', async () => {
    const r = await outRoute.POST();
    expect(r.headers.getSetCookie().find((c) => c.startsWith('redaksjon_okt='))).toMatch(/Max-Age=0/i);
  });
});
