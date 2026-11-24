import { Resolver } from 'node:dns/promises';

/**
 * Whether the domain after the @ can receive mail at all: it has a mail server (MX), or, failing
 * that, an address record (mail's old fallback). Catches typos and made-up domains (gmail.con,
 * asdf.qq) without limiting anyone to Gmail or Outlook. Server only.
 *
 * Only a definite «no» refuses: the domain does not exist, or says it takes no mail. If DNS itself
 * is in trouble (a timeout, a failing server), the writer is let through rather than blocked.
 */
type Dns = {
  resolveMx(domain: string): Promise<{ exchange: string }[]>;
  resolve4(domain: string): Promise<unknown[]>;
  resolve6(domain: string): Promise<unknown[]>;
};

const NO = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN']);
const code = (e: unknown) => (e as { code?: string })?.code ?? '';

let resolver: Dns | undefined;
const defaultDns = () => (resolver ??= new Resolver({ timeout: 2500, tries: 2 }));

export async function mailDomainOk(domain: string, dns: Dns = defaultDns()): Promise<boolean> {
  try {
    const mx = await dns.resolveMx(domain);
    return mx.some((r) => r.exchange && r.exchange !== '.');
  } catch (e) {
    if (!NO.has(code(e))) return true;
    if (code(e) !== 'ENODATA') return false;
  }
  // no MX record, but the name exists: an A or AAAA record still receives mail
  for (const look of [() => dns.resolve4(domain), () => dns.resolve6(domain)]) {
    try {
      if ((await look()).length) return true;
    } catch (e) {
      if (!NO.has(code(e))) return true;
    }
  }
  return false;
}
