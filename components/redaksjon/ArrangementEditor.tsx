'use client';

import { useRef } from 'react';
import { site } from '@/content/site.no';
import type { Arrangement } from '@/lib/redaksjon/schema';
import { Cover } from './Cover';
import { Frame } from './Frame';
import { Line } from './Lines';
import { card, Checklist, Field, Preview } from './Panel';
import { Picture } from './Picture';
import { longDate } from './SidePanel';
import { useEntry } from './useEntry';
import s from './editor.module.css';

const t = site.pages.news;

/**
 * Writing an event (mockup A): the picture, the title and the description on the sheet; when,
 * where, sign-up, programme, write-up and recording in the panel. Events have no draft: a saved
 * event is on the site (the spec keeps it as Keystatic has it).
 */
export function ArrangementEditor({ initial, slug, version, today }: { initial: Arrangement; slug: string | null; version: string | null; today: string }) {
  const e = useEntry('arrangementer', initial, slug, version);
  const { f, set, missing } = e;
  const textRef = useRef<HTMLTextAreaElement>(null);
  const bad = (k: string) => missing.has(k) || undefined;
  // After its last day an event moves to the archive, where it shows its write-up and recording instead of sign-up.
  const past = (f.end || f.start) < today;
  const when = f.start ? `${longDate(f.start)}${f.time ? ` kl. ${f.time}` : ''}` : '';

  const sheet = (
    <article className={s.sheet}>
      <Cover image={f.image} onImage={(v) => set('image', v)} addPicture={e.addPicture} missing={missing.has('image')} hint="Vises på arrangementet på Aktuelt" />
      <Line id="redaksjon-tittel" label="Tittel" look="headline" value={f.title} onChange={(v) => set('title', v)} placeholder="Tittel" onEnter={() => textRef.current?.focus()} />
      <Line
        id="redaksjon-beskrivelse" ref={textRef} label="Beskrivelse" look="text" value={f.text} onChange={(v) => set('text', v)}
        placeholder="Beskrivelse: hva skjer, og hvem er det for?"
      />
    </article>
  );

  const panel = (
    <>
      <section>
        <h3>Tid og sted</h3>
        <Field id="redaksjon-dato" label="Dato">
          <input id="redaksjon-dato" type="date" value={f.start} onChange={(ev) => set('start', ev.target.value)} aria-invalid={bad('start')} />
        </Field>
        <Field id="redaksjon-tid" label="Klokkeslett" optional>
          <input id="redaksjon-tid" type="time" value={f.time} onChange={(ev) => set('time', ev.target.value)} aria-invalid={bad('time')} />
        </Field>
        <Field id="redaksjon-slutt" label="Sluttdato" optional hint="Bare når arrangementet går over flere dager.">
          <input id="redaksjon-slutt" type="date" value={f.end} min={f.start || undefined} onChange={(ev) => set('end', ev.target.value)} aria-invalid={bad('end')} />
        </Field>
        <Field id="redaksjon-sted" label="Sted">
          <input id="redaksjon-sted" value={f.place} onChange={(ev) => set('place', ev.target.value)} placeholder="Adresse eller navn på stedet" aria-invalid={bad('place')} />
        </Field>
      </section>

      <section>
        <h3>Påmelding og program</h3>
        <Field id="redaksjon-pamelding" label="Påmelding" optional hint="Lenke til påmeldingen.">
          <input id="redaksjon-pamelding" type="url" inputMode="url" value={f.link} onChange={(ev) => set('link', ev.target.value.trim())} placeholder="https://" aria-invalid={bad('link')} />
        </Field>
        <Field id="redaksjon-program" label="Program" optional hint="Vises under beskrivelsen. Linjeskift blir med.">
          <textarea id="redaksjon-program" rows={4} value={f.program} onChange={(ev) => set('program', ev.target.value)} />
        </Field>
      </section>

      <section>
        <h3>Etter arrangementet</h3>
        <Field id="redaksjon-referat" label="Referat" optional hint="Vises når arrangementet er over.">
          <textarea id="redaksjon-referat" rows={4} value={f.report} onChange={(ev) => set('report', ev.target.value)} />
        </Field>
        <Field id="redaksjon-opptak" label="Opptak" optional hint="Lenke til opptaket, for eksempel på YouTube.">
          <input id="redaksjon-opptak" type="url" inputMode="url" value={f.recording} onChange={(ev) => set('recording', ev.target.value.trim())} placeholder="https://" aria-invalid={bad('recording')} />
        </Field>
      </section>

      <Checklist items={[
        ['Tittel', !missing.has('title')],
        ['Dato', !missing.has('start')],
        ['Sted', !missing.has('place')],
        ['Beskrivelse', !missing.has('text')],
        ...(f.image ? [['Bilde med beskrivelse', !missing.has('image')] as [string, boolean]] : []),
        ...e.issues.filter((x) => ['time', 'end', 'link', 'recording'].includes(x.key)).map((x) => [x.text, false] as [string, boolean]),
      ]} />

      <Preview heading={past ? 'Slik vises det i arkivet' : 'Slik vises det på Aktuelt'}>
        <h3>{f.title || 'Tittel'}</h3>
        <p className={card.meta}><time>{when}</time>{' · '}{f.place || 'Sted'}</p>
        {f.image && <Picture src={f.image.src} />}
        <p>{f.text || 'Beskrivelsen vises her.'}</p>
        {f.program && <p className={card.block}><strong>{t.program}</strong>{f.program}</p>}
        {past && f.report && <p className={card.block}><strong>{t.report}</strong>{f.report}</p>}
        {past && f.recording && <p className={card.meta}><a>{t.recording}</a></p>}
        {!past && f.link && <p className={card.meta}><a>{t.signup}</a></p>}
      </Preview>
    </>
  );

  return <Frame entry={e} sheet={sheet} panel={panel} panelLabel="Innstillinger for arrangementet" />;
}
