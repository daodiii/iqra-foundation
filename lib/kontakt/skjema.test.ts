import { describe, expect, test } from 'vitest';
import { LIMITS, validateContact } from './skjema';

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

const good = { navn: 'Kari Nordmann', epost: 'kari@example.no', mobil: '', orgnr: '', melding: 'Hei, vi vil gjerne samarbeide.' };

describe('validateContact', () => {
  test('a name, a valid e-mail and a message pass, trimmed; mobile and org.nr may be empty', () => {
    const r = validateContact(form({ ...good, navn: '  Kari Nordmann ', epost: ' kari@example.no ' }));
    expect(r).toEqual({ ok: true, data: { navn: 'Kari Nordmann', epost: 'kari@example.no', mobil: '', orgnr: '', melding: 'Hei, vi vil gjerne samarbeide.' } });
  });

  test('the name, the e-mail and the message are required; whitespace alone is empty', () => {
    const r = validateContact(form({ navn: '   ', epost: '', mobil: '', orgnr: '', melding: '\n ' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.invalid.sort()).toEqual(['epost', 'melding', 'navn']);
  });

  test('an e-mail without an @ and a domain is refused', () => {
    for (const epost of ['kari', 'kari@', '@example.no', 'kari@example', 'ka ri@example.no']) {
      const r = validateContact(form({ ...good, epost }));
      expect(r.ok, epost).toBe(false);
      if (!r.ok) expect(r.invalid).toEqual(['epost']);
    }
  });

  test('each field has a length limit', () => {
    const over = {
      navn: 'a'.repeat(LIMITS.navn + 1),
      epost: `${'a'.repeat(LIMITS.epost)}@example.no`,
      mobil: '1'.repeat(LIMITS.mobil + 1),
      orgnr: '1'.repeat(LIMITS.orgnr + 1),
      melding: 'a'.repeat(LIMITS.melding + 1),
    };
    const r = validateContact(form(over));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.invalid.sort()).toEqual(['epost', 'melding', 'mobil', 'navn', 'orgnr']);
    expect(validateContact(form({ ...good, melding: 'a'.repeat(LIMITS.melding) })).ok).toBe(true);
  });

  test('line breaks in the name are flattened, so it cannot reach a mail header as two lines', () => {
    const r = validateContact(form({ ...good, navn: 'Kari\r\nBcc: x@y.no' }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.navn).toBe('Kari Bcc: x@y.no');
  });

  test('a missing field (a POST that skipped the form) counts as empty', () => {
    const fd = new FormData();
    fd.set('navn', 'Kari');
    const r = validateContact(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.invalid.sort()).toEqual(['epost', 'melding']);
  });
});
