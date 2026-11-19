'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, type UploadIn } from '@/lib/redaksjon/api';
import { pictureName, shrink, toBase64 } from '@/lib/redaksjon/image';
import { problems, slugify, type Nyhet } from '@/lib/redaksjon/schema';
import { Icon } from './Icon';
import { useAdjustCount } from './Shell';
import { Sheet } from './Sheet';
import { SidePanel } from './SidePanel';
import s from './editor.module.css';

type Status = { tone: 'idle' | 'busy' | 'ok' | 'error'; text: string };

/**
 * A picture chosen in this visit. The editor shows it by its blob address the whole time; the
 * save sends its bytes once and remembers where they went, so a later save only changes the text.
 */
type Local = { name: string; blob: Blob; path?: string };

const hhmm = () => new Date().toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });

/**
 * Writing a news post (mockup A): the sheet, the panel beside it, and «Lagre». A new post has no
 * address until its first save; after that every save sends the version it opened, and pictures
 * chosen since the last save ride along under `/opplastet/nyheter/<address>/`.
 */
export function NyhetEditor({ initial, slug: savedSlug, version: savedVersion }: { initial: Nyhet; slug: string | null; version: string | null }) {
  const router = useRouter();
  const adjustCount = useAdjustCount();
  const [f, setF] = useState<Nyhet>(initial);
  const [slug, setSlug] = useState(savedSlug ?? slugify(initial.title));
  const [slugTouched, setSlugTouched] = useState(Boolean(savedSlug));
  const [version, setVersion] = useState(savedVersion);
  const [saved, setSaved] = useState<{ fields: Nyhet; slug: string } | null>(savedSlug ? { fields: initial, slug: savedSlug } : null);
  const [status, setStatus] = useState<Status>({ tone: 'idle', text: savedSlug ? 'Ingen endringer' : 'Ikke lagret ennå' });
  const [error, setError] = useState<{ text: string; stale: boolean } | null>(null);
  const local = useRef(new Map<string, Local>());

  const set = <K extends keyof Nyhet>(k: K, v: Nyhet[K]) => setF((o) => ({ ...o, [k]: v }));
  const onTitle = (v: string) => {
    set('title', v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const issues = useMemo(() => problems('nyheter', f), [f]);
  const missing = useMemo(() => new Set(issues.map((x) => x.key)), [issues]);
  const dirty = !saved || saved.slug !== slug || JSON.stringify(saved.fields) !== JSON.stringify(f);
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

  const save = async () => {
    if (busy || issues.length) return;
    setStatus({ tone: 'busy', text: 'Lagrer …' });
    setError(null);
    const to = slug || slugify(f.title);
    // Pictures from this visit: each blob address becomes its place on the site in what is sent.
    const used = [...local.current.entries()].filter(([src]) => f.image?.src === src || f.body.includes(src));
    const upload = used.filter(([, l]) => !l.path);
    const place = new Map(used.map(([src, l]) => [src, l.path ?? `/opplastet/nyheter/${to}/${l.name}`]));
    let body = f.body;
    for (const [src, path] of place) body = body.split(src).join(path);
    const fields: Nyhet = { ...f, body, image: f.image ? { ...f.image, src: place.get(f.image.src) ?? f.image.src } : null };
    let uploads: UploadIn[];
    try {
      uploads = await Promise.all(upload.map(async ([, l]) => ({ name: l.name, data: await toBase64(l.blob) })));
    } catch {
      setStatus({ tone: 'error', text: 'Ikke lagret' });
      setError({ text: 'Kunne ikke lese et av bildene. Prøv å velge det på nytt.', stale: false });
      return;
    }
    const r = saved && version
      ? await api.save('nyheter', saved.slug, fields, version, to, uploads)
      : await api.create('nyheter', fields, to, uploads);
    if (!r.ok) {
      setStatus({ tone: 'error', text: 'Ikke lagret' });
      setError({ text: r.error, stale: r.status === 409 && Boolean(saved) && !r.fields.length });
      return;
    }
    for (const [src, l] of upload) local.current.set(src, { ...l, path: place.get(src) });
    const moved = !saved || saved.slug !== r.value.slug;
    if (!saved) adjustCount('nyheter', 1);
    setSlug(r.value.slug);
    setSlugTouched(true);
    setVersion(r.value.version);
    setSaved({ fields: f, slug: r.value.slug });
    setStatus({ tone: 'ok', text: `${r.value.note.replace(/\.$/, '')} · ${hhmm()}` });
    // A new or moved post gets its address in the bar without leaving the page (a new page would
    // show the pictures from the site, which has them only after its rebuild).
    if (moved) window.history.replaceState(null, '', `/redaksjon/nyheter/${r.value.slug}`);
    else router.refresh();
  };

  const saveLabel = issues.length ? `Mangler: ${issues.map((x) => x.text.toLowerCase()).join(', ')}` : undefined;
  const statusEl = (
    <span className={s.status} data-tone={status.tone} role="status" aria-live="polite">
      {status.tone === 'ok' && <Icon name="check" />}
      {status.tone === 'error' && <Icon name="alert" />}
      {dirty && status.tone !== 'busy' && status.tone !== 'error' && saved ? 'Endringer som ikke er lagret' : status.text}
    </span>
  );
  const saveBtn = (
    <button type="button" className={`${s.btn} ${s.go}`} onClick={save} disabled={busy || issues.length > 0 || !dirty} title={saveLabel} aria-describedby={issues.length ? 'redaksjon-mangler' : undefined}>
      {busy ? 'Lagrer …' : 'Lagre'}
    </button>
  );
  const liveHref = saved && !dirty && saved.fields.publish ? `/aktuelt/nyheter/${saved.slug}` : null;

  return (
    <div className={s.write}>
      <div className={s.top}>
        <span className={s.crumb}>
          <Link href="/redaksjon/nyheter">Nyheter</Link><Icon name="chev" /><b>{saved ? saved.fields.title || 'Nyhet' : 'Ny nyhet'}</b>
        </span>
        {statusEl}
        {liveHref && <a className={s.btn} href={liveHref} target="_blank" rel="noreferrer"><Icon name="eye" />Se på nettsiden</a>}
        {saveBtn}
      </div>

      <div className={s.sheetWrap}>
        {error && (
          <div className={s.error} role="alert">
            <Icon name="alert" />
            <p>{error.text}</p>
            {error.stale
              ? <button type="button" className={s.btn} onClick={() => window.location.reload()}>Last inn på nytt</button>
              : <button type="button" className={s.btn} onClick={save}>Prøv igjen</button>}
          </div>
        )}
        <Sheet
          title={f.title} onTitle={onTitle}
          summary={f.summary} onSummary={(v) => set('summary', v)}
          image={f.image} onImage={(v) => set('image', v)}
          body={initial.body} onBody={(v) => set('body', v)}
          addPicture={addPicture} missing={missing}
        />
        {issues.length > 0 && <p id="redaksjon-mangler" className={s.srOnly}>{saveLabel}</p>}
      </div>

      <SidePanel
        publish={f.publish} onPublish={(v) => set('publish', v)}
        date={f.date} onDate={(v) => set('date', v)}
        slug={slug} onSlug={(v) => { setSlug(v); setSlugTouched(true); }}
        title={f.title} summary={f.summary} image={f.image}
        problems={issues} liveHref={liveHref} hasText={f.body.trim() !== ''}
      />

      <div className={s.bar}>{statusEl}{saveBtn}</div>
    </div>
  );
}
