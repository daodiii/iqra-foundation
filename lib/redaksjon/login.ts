import { mayEdit } from './access';
import { CODE_TTL_MS, formatCode, newCode, SESSION_TTL_MS, signChallenge, signSession, verifyChallenge } from './kode';

/**
 * The two steps of logging in to Redaksjon (2026-11-25, in place of Clerk), with what they need passed
 * in, so the tests can run them with a fake mailer and never send real mail.
 *
 * 1. `requestCode`: an address on `EDITOR_EMAILS` gets a code from the site's own mailbox (the
 *    contact form's Webhuset SMTP). Any other address gets nothing, and the answer and the cookie
 *    look the same either way, so the form says nothing about who is on the list and mails no one
 *    else: it is not a relay.
 * 2. `confirmCode`: the right code, in time, for an address still on the list, gives a session.
 */

type Env = Record<string, string | undefined>;
export type Mail = { to: string; subject: string; text: string };
export type Deps = { env: Env; now: number; send: (mail: Mail) => Promise<void> };

/** At most three codes per address per ten minutes. Kept in memory, so per Vercel instance: a brake, not a wall. */
const SENDS = { max: 3, windowMs: CODE_TTL_MS };
const sent = new Map<string, number[]>();
export const resetSendLimit = () => sent.clear();

function mayCount(email: string, now: number): boolean {
  const recent = (sent.get(email) ?? []).filter((t) => now - t < SENDS.windowMs);
  if (recent.length >= SENDS.max) {
    sent.set(email, recent);
    return false;
  }
  recent.push(now);
  sent.set(email, recent);
  return true;
}

export const codeMail = (to: string, code: string): Mail => ({
  to,
  subject: `Koden din til Redaksjon: ${formatCode(code)}`,
  text: [
    `Koden din er ${formatCode(code)}.`,
    '',
    'Skriv den inn på siden der du ba om den. Den gjelder i 10 minutter.',
    '',
    'Har du ikke bedt om en kode, kan du se bort fra denne e-posten.',
    '',
    '—',
    'Redaksjonen på iqrasti.no',
  ].join('\n'),
});

/** The challenge cookie to set. Always one, so the response is the same whether the address is on the list or not. */
export async function requestCode(typed: string, { env, now, send }: Deps): Promise<{ challenge: string }> {
  const email = typed.trim().toLowerCase();
  const secret = env.REDAKSJON_SECRET ?? '';
  const code = newCode();
  const challenge = signChallenge(email || 'ingen', code, now + CODE_TTL_MS, secret);
  if (!email.includes('@') || !mayEdit(email, env) || !mayCount(email, now)) return { challenge };
  try {
    await send(codeMail(email, code));
  } catch (err) {
    // the editor sees the same answer; the reason is in the function's log, without the code
    console.error('[redaksjon] the code could not be sent:', err instanceof Error ? err.message : err);
  }
  return { challenge };
}

/** The session cookie to set, or null: the wrong code, too late, or an address no longer on the list. */
export function confirmCode(challenge: string | undefined, typed: string, { env, now }: Omit<Deps, 'send'>): { email: string; session: string } | null {
  const secret = env.REDAKSJON_SECRET;
  const email = verifyChallenge(challenge, typed, now, secret);
  if (!email || !mayEdit(email, env) || !secret) return null;
  return { email, session: signSession(email, now + SESSION_TTL_MS, secret) };
}
