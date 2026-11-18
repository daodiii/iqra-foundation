import { afterEach, describe, expect, test, vi } from 'vitest';
import { editorEmails, editorEnabled, mayEdit, testEditor } from './access';

vi.mock('server-only', () => ({}));
const user = vi.hoisted(() => ({ current: null as null | { primaryEmailAddress: { emailAddress: string } | null } }));
vi.mock('@clerk/nextjs/server', () => ({ currentUser: async () => user.current }));
const { currentEditor, guard } = await import('./session');

const CONFIGURED = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk',
  CLERK_SECRET_KEY: 'sk',
  EDITOR_EMAILS: 'Ola@Example.org, kari@example.org',
  REDAKSJON_GITHUB_TOKEN: 't',
};

describe('whether the editor is on', () => {
  test('production needs Clerk, the address list and a token; any one missing is off', () => {
    expect(editorEnabled(CONFIGURED)).toBe(true);
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
  afterEach(() => { vi.unstubAllEnvs(); user.current = null; });

  test('off is a 404', async () => {
    set({ NODE_ENV: 'production', NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '', CLERK_SECRET_KEY: '', EDITOR_EMAILS: '', REDAKSJON_GITHUB_TOKEN: '', REDAKSJON_TEST_EDITOR: '' });
    const r = await guard();
    expect(r).toBeInstanceOf(Response);
    expect((r as Response).status).toBe(404);
  });
  test('no session is 401, an address off the list 403, a listed one passes', async () => {
    set({ ...CONFIGURED, REDAKSJON_TEST_EDITOR: '' });
    expect(((await guard()) as Response).status).toBe(401);
    user.current = { primaryEmailAddress: { emailAddress: 'per@example.org' } };
    expect(((await guard()) as Response).status).toBe(403);
    expect(await currentEditor()).toEqual({ kind: 'denied', email: 'per@example.org' });
    user.current = { primaryEmailAddress: { emailAddress: 'Ola@Example.org' } };
    expect(await guard()).toEqual({ email: 'ola@example.org' });
  });
  test('the test editor needs no Clerk', async () => {
    set({ NODE_ENV: 'development', REDAKSJON_TEST_EDITOR: 'test@example.org', NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '', CLERK_SECRET_KEY: '' });
    expect(await guard()).toEqual({ email: 'test@example.org' });
  });
});
