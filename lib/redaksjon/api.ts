import type { EntryOf, Section } from './schema';

/**
 * The editor's calls from the browser. Every answer is either the result or `{ error, fields }`
 * in words the editor can show as they are; a dropped connection becomes one of those too.
 */

export type Problem = { key: string; text: string };
export type Failure = { ok: false; status: number; error: string; fields: Problem[] };
export type Result<T> = { ok: true; value: T } | Failure;
export type Saved = { slug: string; version: string; note: string };
export type UploadIn = { name: string; data: string };

async function call<T>(method: string, url: string, body?: unknown): Promise<Result<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch {
    return { ok: false, status: 0, error: 'Fikk ikke kontakt med nettsiden. Sjekk internett og prøv igjen. Teksten din er ikke borte.', fields: [] };
  }
  if (res.ok) return { ok: true, value: (res.status === 204 ? undefined : await res.json()) as T };
  const b = (await res.json().catch(() => ({}))) as { error?: string; fields?: Problem[] };
  const error = b.error ?? (res.status === 401 ? 'Du er logget ut. Logg inn igjen.' : 'Noe gikk galt. Prøv igjen.');
  return { ok: false, status: res.status, error, fields: b.fields ?? [] };
}

const base = (section: Section) => `/api/redaksjon/${section}`;

export const api = {
  create: <S extends Section>(section: S, fields: EntryOf[S], slug: string, uploads: UploadIn[] = []) =>
    call<Saved>('POST', base(section), { fields, slug, uploads }),
  save: <S extends Section>(section: S, slug: string, fields: EntryOf[S], version: string, newSlug: string, uploads: UploadIn[] = []) =>
    call<Saved>('PUT', `${base(section)}/${slug}`, { fields, version, slug: newSlug, uploads }),
  remove: (section: Section, slug: string, version: string) =>
    call<void>('DELETE', `${base(section)}/${slug}?version=${encodeURIComponent(version)}`),
};
