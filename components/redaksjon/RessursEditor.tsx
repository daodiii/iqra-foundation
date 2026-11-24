'use client';

import { useRef, useState } from 'react';
import { CATEGORIES, type Ressurs } from '@/lib/redaksjon/schema';
import type { FileMode } from '@/lib/redaksjon/upload';
import { FileField } from './FileField';
import { Frame } from './Frame';
import { Line } from './Lines';
import { card, Checklist, Field, Preview } from './Panel';
import { longDate } from './SidePanel';
import { useEntry } from './useEntry';
import s from './editor.module.css';

/**
 * Writing a resource for the library (mockup A): the title and the summary on the sheet; the
 * category, the date and what it offers in the panel: a file to download, a video to play on the
 * page, or a link elsewhere, at least one of them. A resource has no draft: a saved one is on
 * /ressurser.
 */
export function RessursEditor({ initial, slug, version, files }: { initial: Ressurs; slug: string | null; version: string | null; files: FileMode }) {
  const e = useEntry('ressurser', initial, slug, version);
  const { f, set, missing } = e;
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState({ file: false, video: false });
  const bad = (k: string) => missing.has(k) || undefined;
  const category = CATEGORIES.find((c) => c.key === f.category)?.label ?? '';

  const sheet = (
    <article className={s.sheet}>
      <Line id="redaksjon-tittel" label="Tittel" look="headline" value={f.title} onChange={(v) => set('title', v)} placeholder="Tittel" onEnter={() => summaryRef.current?.focus()} />
      <Line
        id="redaksjon-sammendrag" ref={summaryRef} label="Sammendrag" look="text" value={f.summary} onChange={(v) => set('summary', v)}
        placeholder="Sammendrag: hva handler den om, og hvem er den for?"
      />
    </article>
  );

  const panel = (
    <>
      <section>
        <h3>Om ressursen</h3>
        <Field id="redaksjon-kategori" label="Kategori">
          <select id="redaksjon-kategori" value={f.category} onChange={(ev) => set('category', ev.target.value)} aria-invalid={bad('category')}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </Field>
        <Field id="redaksjon-dato" label="Dato" hint="Når den ble gitt ut.">
          <input id="redaksjon-dato" type="date" value={f.date} onChange={(ev) => set('date', ev.target.value)} aria-invalid={bad('date')} />
        </Field>
      </section>

      <section>
        <h3>Hva den tilbyr</h3>
        <p className={s.hint}>Minst én av disse.</p>
        <FileField id="redaksjon-fil" kind="file" label="Fil" value={f.file} onChange={(v) => set('file', v)} mode={files} invalid={bad('file')} onBusy={(b) => setUploading((u) => ({ ...u, file: b }))} />
        <FileField id="redaksjon-video" kind="video" label="Video" value={f.video} onChange={(v) => set('video', v)} mode={files} invalid={bad('file')} onBusy={(b) => setUploading((u) => ({ ...u, video: b }))} />
        <Field id="redaksjon-lenke" label="Lenke" optional hint="Når ressursen ligger på en annen nettside.">
          <input id="redaksjon-lenke" type="url" inputMode="url" value={f.url} onChange={(ev) => set('url', ev.target.value.trim())} placeholder="https://" aria-invalid={bad('url')} />
        </Field>
      </section>

      <Checklist items={[
        ['Tittel', !missing.has('title')],
        ['Kategori', !missing.has('category')],
        ['Dato', !missing.has('date')],
        ['Sammendrag', !missing.has('summary')],
        ['En fil, en video eller en lenke', !missing.has('file')],
        ...e.issues.filter((x) => x.key === 'url').map((x) => [x.text, false] as [string, boolean]),
      ]} />

      <Preview heading="Slik vises den på Ressurser">
        <p className={card.meta}>{category}{f.date && <>{' · '}<time>{longDate(f.date)}</time></>}</p>
        <h3>{f.title || 'Tittel'}</h3>
        <p>{f.summary || 'Sammendraget vises her.'}</p>
        {f.video && <video src={f.video} controls preload="metadata" playsInline style={{ width: '100%' }} />}
        {(f.file || f.url) && <p className={card.meta}><a>{f.file ? 'Last ned' : 'Åpne'}</a></p>}
      </Preview>
    </>
  );

  const hold = uploading.file || uploading.video ? 'Venter på at opplastingen blir ferdig' : undefined;
  return <Frame entry={e} sheet={sheet} panel={panel} panelLabel="Innstillinger for ressursen" hold={hold} />;
}
