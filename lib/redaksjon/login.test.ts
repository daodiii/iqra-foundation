import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CODE_TTL_MS, SESSION_TTL_MS, verifySession } from './kode';
import { confirmCode, requestCode, resetSendLimit, type Mail } from './login';

const env = { EDITOR_EMAILS: 'kari@iqrasti.no, Ola@iqrasti.no', REDAKSJON_SECRET: 's'.repeat(40) };
const NOW = 1_800_000_000_000;
const codeIn = (m: Mail) => m.text.match(/Koden din er ([A-Z0-9]{4}-[A-Z0-9]{4})\./)![1];

let mails: Mail[] = [];
const send = vi.fn(async (m: Mail) => {
  mails.push(m);
});

beforeEach(() => {
  mails = [];
  send.mockClear();
  resetSendLimit();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('logging in to Redaksjon with an e-mail code', () => {
  test('an address on the list gets a code by e-mail, and that code, typed back, gives a fourteen-day session', async () => {
    const { challenge } = await requestCode(' Kari@Iqrasti.no ', { env, now: NOW, send });
    expect(mails).toHaveLength(1);
    expect(mails[0].to).toBe('kari@iqrasti.no');
    expect(mails[0].subject).toContain(codeIn(mails[0]));
    const ok = confirmCode(challenge, codeIn(mails[0]).toLowerCase(), { env, now: NOW + 60_000 });
    expect(ok?.email).toBe('kari@iqrasti.no');
    expect(verifySession(ok!.session, NOW + SESSION_TTL_MS - 1, env.REDAKSJON_SECRET)).toBe('kari@iqrasti.no');
  });

  test('an address not on the list gets no mail, and the same kind of answer', async () => {
    const r = await requestCode('fremmed@example.com', { env, now: NOW, send });
    expect(send).not.toHaveBeenCalled();
    expect(r.challenge).toMatch(/^[\w-]+\.[\w-]+$/);
    const listed = await requestCode('kari@iqrasti.no', { env, now: NOW, send });
    expect(Object.keys(r)).toEqual(Object.keys(listed));
  });

  test('a wrong code or a late one gives no session', async () => {
    const { challenge } = await requestCode('kari@iqrasti.no', { env, now: NOW, send });
    const code = codeIn(mails[0]);
    const wrong = code.slice(0, -1) + (code.endsWith('2') ? '3' : '2');
    expect(confirmCode(challenge, wrong, { env, now: NOW })).toBeNull();
    expect(confirmCode(challenge, code, { env, now: NOW + CODE_TTL_MS })).toBeNull();
  });

  test('taken off the list after the code was sent, the code no longer opens the door', async () => {
    const { challenge } = await requestCode('ola@iqrasti.no', { env, now: NOW, send });
    expect(confirmCode(challenge, codeIn(mails[0]), { env: { ...env, EDITOR_EMAILS: 'kari@iqrasti.no' }, now: NOW })).toBeNull();
  });

  test('at most three codes per address in ten minutes; the fourth asks for nothing more', async () => {
    for (let i = 0; i < 4; i++) await requestCode('kari@iqrasti.no', { env, now: NOW + i, send });
    expect(send).toHaveBeenCalledTimes(3);
    await requestCode('kari@iqrasti.no', { env, now: NOW + CODE_TTL_MS + 10, send });
    expect(send).toHaveBeenCalledTimes(4);
  });

  test('when the mail cannot go, the answer is the same and the code is not logged', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = vi.fn(async () => {
      throw new Error('535 authentication failed');
    });
    const r = await requestCode('kari@iqrasti.no', { env, now: NOW, send: failing });
    expect(r.challenge).toBeTruthy();
    expect(errors).toHaveBeenCalled();
    expect(JSON.stringify(errors.mock.calls)).not.toMatch(/[A-Z0-9]{4}-[A-Z0-9]{4}/);
  });
});
