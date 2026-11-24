'use client';

import { useRef, useState } from 'react';
import { blobPath, KINDS, refusal, storedName, type FileKind, type FileMode } from '@/lib/redaksjon/upload';
import { Icon } from './Icon';
import s from './editor.module.css';

/** A short random tail for a stored name. */
const tail = () => Math.random().toString(36).slice(2, 8);

/** Sends one file where this environment keeps them; gives back its address on the site. */
async function send(kind: FileKind, file: File, mode: FileMode, progress: (pct: number) => void): Promise<string> {
  const name = storedName(file.name, tail());
  if (mode === 'blob') {
    const { upload } = await import('@vercel/blob/client');
    const r = await upload(blobPath(name), file, {
      access: 'public',
      handleUploadUrl: '/api/redaksjon/fil',
      clientPayload: kind,
      contentType: file.type || undefined,
      multipart: file.size > 100 * 1024 * 1024,
      onUploadProgress: (p) => progress(Math.round(p.percentage)),
    });
    return r.url;
  }
  const res = await fetch(`/api/redaksjon/fil?kind=${kind}&name=${encodeURIComponent(name)}`, { method: 'PUT', body: file });
  const b = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !b.url) throw new Error(b.error ?? 'Opplastingen stoppet. Prøv igjen.');
  return b.url;
}

/** The file's own name as the editor shows it: the last part of its address, without the random tail. */
const shown = (url: string) => decodeURIComponent(url.split('/').pop() ?? url).replace(/-[a-z0-9]{6}(\.[a-z0-9]+)$/, '$1');

/**
 * A resource's PDF or video in the panel: «Last opp» when there is none, the file's name with
 * «Bytt» and «Fjern» when there is. The upload starts when the file is chosen and shows how far
 * it has come; the entry only keeps the address, and «Lagre» saves it.
 */
export function FileField({ id, kind, value, onChange, mode, label, invalid, onBusy }: {
  id: string; kind: FileKind; value: string; onChange: (v: string) => void; mode: FileMode; label: string; invalid?: boolean;
  /** Told when an upload starts and ends, so «Lagre» can wait for it. */
  onBusy?: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [problem, setProblem] = useState('');
  const k = KINDS[kind];

  const take = async (file: File | undefined) => {
    if (!file) return;
    const no = refusal(kind, file.name, file.size);
    if (no) { setProblem(no); return; }
    setProblem('');
    setPct(0);
    onBusy?.(true);
    try {
      onChange(await send(kind, file, mode, setPct));
    } catch (e) {
      setProblem((e as Error).message || 'Opplastingen stoppet. Prøv igjen.');
    } finally {
      setPct(null);
      onBusy?.(false);
    }
  };

  return (
    <div className={s.f}>
      <span className={s.fileLabel} id={`${id}-label`}>{label}<span className={s.opt}> (valgfritt)</span></span>
      <input
        ref={input} id={id} type="file" hidden accept={k.ext.map((e) => `.${e}`).join(',')} aria-labelledby={`${id}-label`}
        onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ''; }}
      />
      {mode === 'off' ? (
        <span className={s.hint}>Opplasting er ikke slått på ennå. Legg filen et annet sted og bruk «Lenke».</span>
      ) : value ? (
        <div className={s.fileRow} data-invalid={invalid || undefined}>
          <a href={value} target="_blank" rel="noreferrer" className={s.fileName}><Icon name="eye" />{shown(value)}</a>
          <button type="button" className={s.btn} onClick={() => input.current?.click()} disabled={pct !== null}>Bytt</button>
          <button type="button" className={s.btn} aria-label={`Fjern ${label.toLowerCase()}`} title="Fjern" onClick={() => onChange('')} disabled={pct !== null}><Icon name="trash" /></button>
        </div>
      ) : (
        <button type="button" className={s.btn} onClick={() => input.current?.click()} disabled={pct !== null} aria-describedby={`${id}-hint`}>
          <Icon name="upload" />{pct === null ? `Last opp ${label.toLowerCase()}` : `Laster opp … ${pct} %`}
        </button>
      )}
      {pct !== null && <progress className={s.progress} max={100} value={pct} aria-label={`Laster opp ${label.toLowerCase()}`} />}
      {mode !== 'off' && <span className={s.hint} id={`${id}-hint`}>{k.label}.</span>}
      {problem && <span className={`${s.hint} ${s.danger}`} role="alert">{problem}</span>}
    </div>
  );
}
