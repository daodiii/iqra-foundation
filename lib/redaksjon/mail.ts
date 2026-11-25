import 'server-only';
import nodemailer from 'nodemailer';
import type { Mail } from './login';

type Env = Record<string, string | undefined>;

/**
 * Sends a login code from the site's own mailbox: the same Webhuset SMTP and login as the contact
 * form (lib/kontakt/handle.ts), so the editor needs no service of its own.
 */
export function smtpSender(env: Env = process.env) {
  return async (mail: Mail) => {
    const user = env.SMTP_USER?.trim();
    const pass = env.SMTP_PASS;
    if (!user || !pass?.trim()) throw new Error('SMTP_USER or SMTP_PASS is not set');
    const transport = nodemailer.createTransport({
      host: 'smtp.webhuset.no',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transport.sendMail({ from: { name: 'Iqra Foundation', address: user }, to: mail.to, subject: mail.subject, text: mail.text });
  };
}
