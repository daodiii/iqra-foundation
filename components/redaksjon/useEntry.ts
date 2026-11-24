'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, type UploadIn } from '@/lib/redaksjon/api';
import { pictureName, shrink, toBase64 } from '@/lib/redaksjon/image';
import { LABELS, problems, slugify, titleOf, type EntryOf, type Section } from '@/lib/redaksjon/schema';
import { useAdjustCount } from './Shell';

export type Status = { tone: 'idle' | 'busy' | 'ok' | 'error'; text: string };

/**
 * A picture chosen in this visit. The editor shows it by its blob address the whole time; the
 * save sends its bytes once and remembers where they went, so a later save only changes the text.
 */
type Local = { name: string; blob: Blob; path?: string };

/** The time as Norwegian writes it: «11.34». */
const hhmm = () => new Date().toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

/**
 * Every section's writing state: the fields, the address, what is missing, whether it is saved,
 * and saving and deleting. A new entry has no address until its first save; after that every save
 * sends the version it opened. Pictures chosen since the last save ride along under
 * `/opplastet/<section>/<address>/`, wherever they sit in the fields (a cover, a photo, the text).
 *
 * Only news can move to a new address: its address is a page of its own. The other sections'
 * addresses are file names nobody sees, so they keep the one they were saved under.
 */
export function useEntry<S extends Section>(section: S, initial: EntryOf[S], savedSlug: string | null, savedVersion: string | null) {
  const router = useRouter();
  const adjustCount = useAdjustCount();
  const [f, setF] = useState<EntryOf[S]>(initial);
  const [slug, setSlugState] = useState(savedSlug ?? slugify(titleOf(section, initial)));
  const [slugTouched, setSlugTouched] = useState(Boolean(savedSlug));
  const [version, setVersion] = useState(savedVersion);
  const [saved, setSaved] = useState<{ fields: EntryOf[S]; slug: string } | null>(savedSlug ? { fields: initial, slug: savedSlug } : null);
  const [status, setStatus] = useState<Status>({ tone: 'idle', text: savedSlug ? 'Alt er lagret' : 'Ikke lagret ennå' });
  const [error, setError] = useState<{ text: string; stale: boolean } | null>(null);
  const [deleted, setDeleted] = useState(false);
  const local = useRef(new Map<string, Local>());

  const titleKey = LABELS[section].titleKey as keyof EntryOf[S];
  const set = <K extends keyof EntryOf[S]>(k: K, v: EntryOf[S][K]) => {
    setF((o) => ({ ...o, [k]: v }));
    if (k === titleKey && !slugTouched) setSlugState(slugify(String(v)));
  };
  const setSlug = (v: string) => { setSlugState(v); setSlugTouched(true); };

  const issues = useMemo(() => problems(section, f), [section, f]);
  const missing = useMemo(() => new Set(issues.map((x) => x.key)), [issues]);
  const dirty = !deleted && (!saved || saved.slug !== slug || JSON.stringify(saved.fields) !== JSON.stringify(f));
  const busy = status.tone === 'busy';

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const addPicture = useCallback(async (file: File) => {
    const shrunk = await shrink(file);
    const src = URL.createObjectURL(shrunk.blob);
    local.current.set(src, { name: pictureName(file.name), blob: shrunk.blob });
    return src;
  }, []);

  const fail = (text: string, stale = false) => {
    setStatus({ tone: 'error', text: 'Ikke lagret' });
    setError({ text, stale });
  };

  const save = async () => {
    if (busy || issues.length) return;
    setStatus({ tone: 'busy', text: 'Lagrer …' });
    setError(null);
    const to = section === 'nyheter' || !saved ? slug || slugify(titleOf(section, f)) : saved.slug;
    // Pictures from this visit: each blob address becomes its place on the site in what is sent.
    // Blob addresses hold no character JSON escapes, so a plain replace over the JSON is exact.
    let text = JSON.stringify(f);
    const used = [...local.current.entries()].filter(([src]) => text.includes(src));
    const upload = used.filter(([, l]) => !l.path);
    const place = new Map(used.map(([src, l]) => [src, l.path ?? `/opplastet/${section}/${to}/${l.name}`]));
    for (const [src, path] of place) text = text.split(src).join(path);
    const fields = JSON.parse(text) as EntryOf[S];
    let uploads: UploadIn[];
    try {
      uploads = await Promise.all(upload.map(async ([, l]) => ({ name: l.name, data: await toBase64(l.blob) })));
    } catch {
      fail('Kunne ikke lese et av bildene. Prøv å velge det på nytt.');
      return;
    }
    const r = saved && version
      ? await api.save(section, saved.slug, fields, version, to, uploads)
      : await api.create(section, fields, to, uploads);
    if (!r.ok) {
      fail(r.error, r.status === 409 && Boolean(saved) && !r.fields.length);
      return;
    }
    for (const [src, l] of upload) local.current.set(src, { ...l, path: place.get(src) });
    const moved = !saved || saved.slug !== r.value.slug;
    if (!saved) adjustCount(section, 1);
    setSlugState(r.value.slug);
    setSlugTouched(true);
    setVersion(r.value.version);
    setSaved({ fields: f, slug: r.value.slug });
    setStatus({ tone: 'ok', text: r.value.note.replace(/^Lagret/, `Lagret kl. ${hhmm()}`) });
    // A new or moved post gets its address in the bar without leaving the page (a new page would
    // show the pictures from the site, which has them only after its rebuild).
    if (moved) window.history.replaceState(null, '', `/redaksjon/${section}/${r.value.slug}`);
    else router.refresh();
  };

  /** Deletes the saved entry, then goes to the section's list. False when it was refused. */
  const remove = async (): Promise<boolean> => {
    if (!saved || !version || busy) return false;
    setStatus({ tone: 'busy', text: 'Sletter …' });
    setError(null);
    const r = await api.remove(section, saved.slug, version);
    if (!r.ok) {
      setStatus({ tone: 'error', text: 'Ikke slettet' });
      setError({ text: r.error, stale: r.status === 409 });
      return false;
    }
    setDeleted(true);
    adjustCount(section, -1);
    router.push(`/redaksjon/${section}`);
    router.refresh();
    return true;
  };

  return { section, f, set, slug, setSlug, issues, missing, dirty, busy, status, error, saved, addPicture, save, remove };
}

export type EntryState<S extends Section> = ReturnType<typeof useEntry<S>>;
