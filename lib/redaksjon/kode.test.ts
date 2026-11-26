import { describe, expect, test, vi } from 'vitest';
import { ALPHABET, CODE_TTL_MS, formatCode, newCode, normalizeCode, SESSION_TTL_MS, signChallenge, signSession, verifyChallenge, verifySession } from './kode';

const SECRET = 'a'.repeat(64);
const NOW = 1_800_000_000_000;

describe('the e-mail code', () => {
  test('eight characters from an alphabet without look-alikes (no 0 O 1 I L), shown in two fours', () => {
    for (let i = 0; i < 200; i++) {
      const c = newCode();
      expect(c).toMatch(new RegExp(`^[${ALPHABET}]{8}$`));
    }
    expect(ALPHABET).not.toMatch(/[01OIL]/);
    expect(formatCode('ABCD2345')).toBe('ABCD-2345');
  });

  test('what the editor types is read leniently: case, spaces and the dash do not matter', () => {
    expect(normalizeCode(' abcd-2345 ')).toBe('ABCD2345');
    expect(normalizeCode('abcd 2345')).toBe('ABCD2345');
  });
});

describe('the challenge: the code, signed into a cookie, no server memory', () => {
  const token = signChallenge('kari@iqrasti.no', 'ABCD2345', NOW + CODE_TTL_MS, SECRET);

  test('the right code within ten minutes gives the address back', () => {
    expect(verifyChallenge(token, 'abcd-2345', NOW + CODE_TTL_MS - 1, SECRET)).toBe('kari@iqrasti.no');
  });

  test('a wrong code, a late one, another secret or a tampered cookie give nothing', () => {
    expect(verifyChallenge(token, 'ABCD2346', NOW, SECRET)).toBeNull();
    expect(verifyChallenge(token, 'ABCD2345', NOW + CODE_TTL_MS, SECRET)).toBeNull();
    expect(verifyChallenge(token, 'ABCD2345', NOW, 'b'.repeat(64))).toBeNull();
    const [body, mac] = token.split('.');
    const other = Buffer.from(JSON.stringify({ e: 'ola@iqrasti.no', x: NOW + CODE_TTL_MS })).toString('base64url');
    expect(verifyChallenge(`${other}.${mac}`, 'ABCD2345', NOW, SECRET)).toBeNull();
    expect(verifyChallenge(`${body}.`, 'ABCD2345', NOW, SECRET)).toBeNull();
    expect(verifyChallenge('rubbish', 'ABCD2345', NOW, SECRET)).toBeNull();
    expect(verifyChallenge(undefined, 'ABCD2345', NOW, SECRET)).toBeNull();
  });

  test('a challenge is not a session, and a session is not a challenge', () => {
    expect(verifySession(token, NOW, SECRET)).toBeNull();
    const session = signSession('kari@iqrasti.no', NOW + SESSION_TTL_MS, SECRET);
    expect(verifyChallenge(session, 'ABCD2345', NOW, SECRET)).toBeNull();
  });

  test('it works in a fresh module: nothing is kept in memory between requests', async () => {
    vi.resetModules();
    const fresh = await import('./kode');
    expect(fresh.verifyChallenge(token, 'ABCD2345', NOW, SECRET)).toBe('kari@iqrasti.no');
  });
});

describe('the session cookie', () => {
  test('valid for fourteen days, then not', () => {
    const s = signSession('Kari@Iqrasti.no', NOW + SESSION_TTL_MS, SECRET);
    expect(verifySession(s, NOW + SESSION_TTL_MS - 1, SECRET)).toBe('kari@iqrasti.no');
    expect(verifySession(s, NOW + SESSION_TTL_MS, SECRET)).toBeNull();
    expect(SESSION_TTL_MS).toBe(14 * 24 * 60 * 60 * 1000);
  });

  test('without a secret, or with a short one, nothing is signed or accepted', () => {
    expect(() => signSession('kari@iqrasti.no', NOW, '')).toThrow();
    expect(() => signSession('kari@iqrasti.no', NOW, 'kort')).toThrow();
    expect(verifySession(signSession('kari@iqrasti.no', NOW + 1000, SECRET), NOW, '')).toBeNull();
  });
});
