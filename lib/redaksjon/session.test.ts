import { afterEach, describe, expect, test, vi } from 'vitest';
import { editorEmails, editorEnabled, mayEdit, testEditor } from './access';
import { SESSION_COOKIE, signSession } from './kode';

vi.mock('server-only', () => ({}));
const jar = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (name: string) => (name === 'redaksjon_okt' && jar.token ? { value: jar.token } : undefined) }) }));
const { currentEditor, guard } = await import('./session');

const SECRET = 'k'.repeat(40);
const CONFIGURED = {
  NODE_ENV: 'production',
  REDAKSJON_SECRET: SECRET,
  SMTP_USER: 'nettside@iqrasti.no',
  SMTP_PASS: 'x',
  EDITOR_EMAILS: 'Ola@Example.org, kari@example.org',
  REDAKSJON_GITHUB_TOKEN: 't',
};
const login = (email: string, expires = Date.now() + 60_000, secret = SECRET) => (jar.token = signSession(email, expires, secret));

describe('whether the editor is on', () => {
  test('production needs the login (a secret and the mailbox), the address list and a token; any one missing is off', () => {
    expect(SESSION_COOKIE).toBe('redaksjon_okt');
    expect(editorEnabled(CONFIGURED)).toBe(true);
    expect(editorEnabled({ ...CONFIGURED, REDAKSJON_SECRET: 'for-kort' }), 'a short secret').toBe(false);
    for (const k of Object.keys(CONFIGURED).filter((k) => k !== 'NODE_ENV')) {
      expect(editorEnabled({ ...CONFIGURED, [k]: undefined }), k).toBe(false);
    }
    expect(editorEnabled({ NODE_ENV: 'production' })).toBe(false);
  });
  test('the test editor works under dev and e2e, and never on Vercel or in a plain production build', () => {
    expect(testEditor({ NODE_ENV: 'development', REDAKSJON_TEST_EDITOR: 'Test@Example.org' })).toBe('test@example.org');
    expect(testEditor({ NODE_ENV: 'production', REDAKSJON_TEST_EDITOR: 'a@b.no', REDAKSJON_E2E: '1' })).toBe('a@b.no');
    expect(testEditor({ NODE_ENV: 'production', REDAKSJON_TEST_EDITOR: 'a@b.no' })).toBeNull();
    expect(testEditor({ NODE_ENV: 'development', REDAKSJON_TEST_EDITOR: 'a@b.no', VERCEL: '1' })).toBeNull();
    expect(testEditor({ NODE_ENV: 'production', REDAKSJON_TEST_EDITOR: 'a@b.no', REDAKSJON_E2E: '1', VERCEL: '1' })).toBeNull();
    // e2e in a production build saves to a folder it names; without one it has nowhere to save
    expect(editorEnabled({ NODE_ENV: 'production', REDAKSJON_TEST_EDITOR: 'a@b.no', REDAKSJON_E2E: '1' })).toBe(false);
    expect(editorEnabled({ NODE_ENV: 'production', REDAKSJON_TEST_EDITOR: 'a@b.no', REDAKSJON_E2E: '1', REDAKSJON_LOCAL_ROOT: '/tmp/x' })).toBe(true);
  });
  test('the address list is read loosely and compared in lower case', () => {
    expect([...editorEmails({ EDITOR_EMAILS: ' A@x.no,b@y.no\nikke-en-adresse ' })]).toEqual(['a@x.no', 'b@y.no']);
    expect(mayEdit('KARI@example.org', CONFIGURED)).toBe(true);
    expect(mayEdit('per@example.org', CONFIGURED)).toBe(false);
    expect(mayEdit('', CONFIGURED)).toBe(false);
  });
});

describe('the gate on every route', () => {
  const set = (env: Record<string, string | undefined>) => { for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v as string); };
  afterEach(() => { vi.unstubAllEnvs(); jar.token = undefined; });

  test('off is a 404', async () => {
    set({ NODE_ENV: 'production', REDAKSJON_SECRET: '', SMTP_USER: '', SMTP_PASS: '', EDITOR_EMAILS: '', REDAKSJON_GITHUB_TOKEN: '', REDAKSJON_TEST_EDITOR: '' });
    const r = await guard();
    expect(r).toBeInstanceOf(Response);
    expect((r as Response).status).toBe(404);
  });
  test('no session is 401, an address off the list 403, a listed one passes', async () => {
    set({ ...CONFIGURED, REDAKSJON_TEST_EDITOR: '' });
    expect(((await guard()) as Response).status).toBe(401);
    login('per@example.org');
    expect(((await guard()) as Response).status).toBe(403);
    expect(await currentEditor()).toEqual({ kind: 'denied', email: 'per@example.org' });
    login('Ola@Example.org');
    expect(await guard()).toEqual({ email: 'ola@example.org' });
  });
  test('an expired session, one signed with another secret, or a tampered one is no session', async () => {
    set({ ...CONFIGURED, REDAKSJON_TEST_EDITOR: '' });
    login('ola@example.org', Date.now() - 1);
    expect(((await guard()) as Response).status).toBe(401);
    login('ola@example.org', Date.now() + 60_000, 'z'.repeat(40));
    expect(((await guard()) as Response).status).toBe(401);
    jar.token = 'eyJlIjoib2xhQGV4YW1wbGUub3JnIiwieCI6OTk5OTk5OTk5OTk5OX0.forfalsket';
    expect(((await guard()) as Response).status).toBe(401);
  });
  test('taken off the list, a valid session no longer opens anything', async () => {
    set({ ...CONFIGURED, REDAKSJON_TEST_EDITOR: '', EDITOR_EMAILS: 'kari@example.org' });
    login('ola@example.org');
    expect(((await guard()) as Response).status).toBe(403);
  });
  test('the test editor needs no code', async () => {
    set({ NODE_ENV: 'development', REDAKSJON_TEST_EDITOR: 'test@example.org', REDAKSJON_SECRET: '', SMTP_USER: '', SMTP_PASS: '' });
    expect(await guard()).toEqual({ email: 'test@example.org' });
  });
});
