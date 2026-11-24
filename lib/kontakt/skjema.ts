/**
 * The contact form's rules, shared by the form (its maxLength) and the server action (which
 * checks them again, since anyone can POST without the form). No server-only imports here:
 * the client form imports this file.
 */

export const FIELDS = ['navn', 'epost', 'mobil', 'orgnr', 'melding'] as const;
export type Field = (typeof FIELDS)[number];
export type Contact = Record<Field, string>;

/** Characters per field. 254 is the longest address SMTP carries. */
export const LIMITS: Record<Field, number> = { navn: 100, epost: 254, mobil: 30, orgnr: 30, melding: 5000 };

export const REQUIRED: readonly Field[] = ['navn', 'epost', 'melding'];

/** The hidden field a person never sees and a bot fills in. */
export const HONEYPOT = 'nettsted';

/** One address: something, an @, a domain with a dot, no spaces. The mail server has the last word. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Validated = { ok: true; data: Contact } | { ok: false; invalid: Field[] };

export function validateContact(fd: FormData): Validated {
  const raw = (f: Field) => {
    const v = fd.get(f);
    return typeof v === 'string' ? v.trim() : '';
  };
  const data = Object.fromEntries(FIELDS.map((f) => [f, raw(f)])) as Contact;
  // single-line fields: no line breaks, so the name cannot become a second mail header line
  for (const f of ['navn', 'epost', 'mobil', 'orgnr'] as const) data[f] = data[f].replace(/[\r\n]+/g, ' ');

  const invalid = FIELDS.filter((f) => {
    const v = data[f];
    if (REQUIRED.includes(f) && !v) return true;
    if (v.length > LIMITS[f]) return true;
    return f === 'epost' && !!v && !EMAIL.test(v);
  });
  return invalid.length ? { ok: false, invalid } : { ok: true, data };
}

/** What the form shows after a submit. `values` puts back what the writer typed, so nothing is lost when React resets the form. */
export type FormState =
  | { status: 'idle' }
  | { status: 'sent' }
  | { status: 'invalid'; invalid: Field[]; values: Contact }
  | { status: 'failed'; values: Contact };

export const initialState: FormState = { status: 'idle' };
