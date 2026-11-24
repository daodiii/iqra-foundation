import nodemailer from 'nodemailer';
import { type Contact, FIELDS, type FormState, HONEYPOT, validateContact } from './skjema';

/**
 * Sends one message from the contact form to the foundation's inbox. Server only: the action in
 * components/contact/send-action.ts calls it with the request's IP and the process env.
 *
 * Mail for iqrasti.no is hosted at Webhuset, and the domain's SPF and DMARC (quarantine) mean mail
 * from @iqrasti.no has to leave through Webhuset's own SMTP. So the site logs in to a real mailbox
 * there (SMTP_USER, the full address, and SMTP_PASS) and sends From that address, with Reply-To
 * set to the writer, so «Svar» in the inbox answers them.
 */

type Env = Record<string, string | undefined>;

/** Five sends per address per quarter hour. Kept in memory, so on Vercel each instance counts on its own. */
export const RATE = { max: 5, windowMs: 15 * 60 * 1000 };
const sends = new Map<string, number[]>();

export function resetRateLimit() {
  sends.clear();
}

function allow(ip: string, now: number) {
  const recent = (sends.get(ip) ?? []).filter((t) => now - t < RATE.windowMs);
  if (recent.length >= RATE.max) {
    sends.set(ip, recent);
    return false;
  }
  recent.push(now);
  sends.set(ip, recent);
  // keep the map from growing without end: forget addresses whose sends have all aged out
  if (sends.size > 5000) for (const [k, v] of sends) if (v.every((t) => now - t >= RATE.windowMs)) sends.delete(k);
  return true;
}

export async function handleContact(fd: FormData, { env, ip, now }: { env: Env; ip: string; now: number }): Promise<FormState> {
  const v = validateContact(fd);
  if (!v.ok) {
    const values = Object.fromEntries(FIELDS.map((f) => [f, String(fd.get(f) ?? '')])) as Contact;
    return { status: 'invalid', invalid: v.invalid, values };
  }
  const { data } = v;
  const failed: FormState = { status: 'failed', values: data };

  // a person never sees this field; a bot fills it in. Tell it nothing went through.
  if (String(fd.get(HONEYPOT) ?? '').trim()) return failed;

  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS?.trim();
  if (!user || !pass) {
    console.error('[kontakt] SMTP_USER or SMTP_PASS is not set; the message was not sent');
    return failed;
  }

  if (!allow(ip, now)) {
    console.error(`[kontakt] rate limit reached for ${ip}; the message was not sent`);
    return failed;
  }

  const to = env.CONTACT_TO?.trim() || 'post@iqrasti.no';
  const transport = nodemailer.createTransport({
    host: 'smtp.webhuset.no',
    port: 465,
    secure: true,
    auth: { user, pass },
    // fail plainly within the function's time rather than leave the button waiting
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  const text = [
    `Navn: ${data.navn}`,
    `E-post: ${data.epost}`,
    ...(data.mobil ? [`Mobilnummer: ${data.mobil}`] : []),
    ...(data.orgnr ? [`Organisasjonsnummer: ${data.orgnr}`] : []),
    '',
    data.melding,
    '',
    '—',
    'Sendt fra kontaktskjemaet på iqrasti.no. Svar på denne e-posten for å svare avsenderen.',
  ].join('\n');

  try {
    await transport.sendMail({
      from: user,
      to,
      replyTo: { name: data.navn, address: data.epost },
      subject: `Kontaktskjema: ${data.navn}`,
      text,
    });
    return { status: 'sent' };
  } catch (err) {
    console.error('[kontakt] sending failed:', err instanceof Error ? err.message : err);
    return failed;
  }
}
