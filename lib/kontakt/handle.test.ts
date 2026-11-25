import { beforeEach, describe, expect, test, vi } from 'vitest';

const sendMail = vi.fn();
const createTransport = vi.fn<(options: unknown) => { sendMail: typeof sendMail }>(() => ({ sendMail }));
vi.mock('nodemailer', () => ({ default: { createTransport: (o: unknown) => createTransport(o) } }));

const { handleContact, resetRateLimit, RATE } = await import('./handle');
const { MIN_MS, TIMER } = await import('./skjema');

const env = { SMTP_USER: 'skjema@iqrasti.no', SMTP_PASS: 'hemmelig' };
const good = { navn: 'Kari Nordmann', epost: 'kari@example.no', mobil: '900 00 000', orgnr: '', melding: 'Hei!\nVi vil gjerne samarbeide.' };
// a person has had the page open for eight seconds when they press Send
const form = (fields: Record<string, string> = good, extra: Record<string, string> = { [TIMER]: '8000' }) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...fields, ...extra })) fd.set(k, v);
  return fd;
};
type Opts = { env?: Record<string, string | undefined>; ip?: string; now?: number; domainOk?: (d: string) => Promise<boolean> };
const run = (fd = form(), o: Opts = {}) =>
  handleContact(fd, { env: o.env ?? env, ip: o.ip ?? '203.0.113.7', now: o.now ?? 1_000_000, domainOk: o.domainOk ?? (async () => true) });

beforeEach(() => {
  resetRateLimit();
  sendMail.mockReset().mockResolvedValue({ messageId: '<1@x>' });
  createTransport.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('handleContact', () => {
  test('a valid message goes to post@iqrasti.no over Webhuset SMTP (465, SSL), from the mailbox, replying to the writer', async () => {
    expect(await run()).toEqual({ status: 'sent' });
    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(createTransport.mock.calls[0][0]).toMatchObject({
      host: 'smtp.webhuset.no',
      port: 465,
      secure: true,
      auth: { user: 'skjema@iqrasti.no', pass: 'hemmelig' },
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.from).toBe('skjema@iqrasti.no');
    expect(mail.to).toBe('post@iqrasti.no');
    expect(mail.replyTo).toEqual({ name: 'Kari Nordmann', address: 'kari@example.no' });
    expect(mail.subject).toContain('Kari Nordmann');
    for (const v of ['Kari Nordmann', 'kari@example.no', '900 00 000', 'Vi vil gjerne samarbeide.']) expect(mail.text).toContain(v);
  });

  test('CONTACT_TO sends it elsewhere', async () => {
    await run(form(), { env: { ...env, CONTACT_TO: 'styret@iqrasti.no' } });
    expect(sendMail.mock.calls[0][0].to).toBe('styret@iqrasti.no');
  });

  test('without SMTP_USER or SMTP_PASS nothing is sent and the form says it failed, keeping what was typed', async () => {
    for (const e of [{ SMTP_PASS: 'x' }, { SMTP_USER: 'skjema@iqrasti.no' }, {}, { SMTP_USER: ' ', SMTP_PASS: ' ' }]) {
      expect(await run(form(), { env: e })).toEqual({ status: 'failed', values: good });
    }
    expect(sendMail).not.toHaveBeenCalled();
  });

  test('when the mail server refuses, the form says it failed — never sent', async () => {
    sendMail.mockRejectedValueOnce(new Error('535 Authentication failed'));
    expect(await run()).toEqual({ status: 'failed', values: good });
  });

  test('an invalid form names the fields and sends nothing', async () => {
    const r = await run(form({ ...good, epost: 'kari' }));
    expect(r).toEqual({ status: 'invalid', invalid: ['epost'], values: { ...good, epost: 'kari' } });
    expect(sendMail).not.toHaveBeenCalled();
  });

  test('a filled honeypot sends nothing and reports a failure, not a success', async () => {
    const r = await run(form({ ...good, nettsted: 'http://spam.example' }));
    expect(r.status).toBe('failed');
    expect(sendMail).not.toHaveBeenCalled();
  });

  test(`one address may send ${RATE.max} in ${RATE.windowMs / 60000} minutes; the next fails without sending, others are not held back`, async () => {
    for (let i = 0; i < RATE.max; i++) expect((await run(form(), { now: 1_000_000 + i })).status).toBe('sent');
    expect(await run(form(), { now: 1_000_000 + RATE.max })).toEqual({ status: 'failed', values: good });
    expect(sendMail).toHaveBeenCalledTimes(RATE.max);
    expect((await run(form(), { ip: '198.51.100.2', now: 1_000_100 })).status).toBe('sent');
    expect((await run(form(), { now: 1_000_000 + RATE.windowMs + 1 })).status).toBe('sent');
  });

  test('invalid tries do not count against the limit', async () => {
    for (let i = 0; i < RATE.max + 2; i++) await run(form({ ...good, navn: '' }));
    expect((await run()).status).toBe('sent');
  });

  test('an e-mail whose domain cannot receive mail is refused as a bad e-mail, nothing sent, the text kept', async () => {
    const asked: string[] = [];
    const r = await run(form({ ...good, epost: 'kari@gmail.con' }), { domainOk: async (d) => (asked.push(d), false) });
    expect(asked).toEqual(['gmail.con']);
    expect(r).toEqual({ status: 'invalid', invalid: ['epost'], values: { ...good, epost: 'kari@gmail.con' } });
    expect(sendMail).not.toHaveBeenCalled();
  });

  test(`a form sent sooner than ${MIN_MS / 1000} s after the page opened, or without the timer, is a bot: nothing sent, reported as failed`, async () => {
    for (const extra of [{ [TIMER]: String(MIN_MS - 1) }, {}, { [TIMER]: 'x' }] as Record<string, string>[]) {
      expect(await run(form(good, extra))).toEqual({ status: 'failed', values: good });
    }
    expect(sendMail).not.toHaveBeenCalled();
    expect((await run(form(good, { [TIMER]: String(MIN_MS) }))).status).toBe('sent');
  });
});
