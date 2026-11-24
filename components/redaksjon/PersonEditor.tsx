'use client';

import { useRef } from 'react';
import type { Person } from '@/lib/redaksjon/schema';
import { Cover } from './Cover';
import { Frame } from './Frame';
import { Line } from './Lines';
import { card, Checklist, Field, Preview } from './Panel';
import { Picture } from './Picture';
import { useEntry } from './useEntry';
import s from './editor.module.css';

/**
 * The roles the English page knows how to say (`components/menneskene-bak/MenneskenePlater.tsx`);
 * offered as suggestions, so a role typed the same way shows in English too. Any other role is
 * shown as written.
 */
const ROLES = ['Styreleder', 'Nestleder', 'Styremedlem', 'Varamedlem'];

/**
 * Writing about a board member (mockup A): the photo, the name and the short bio on the sheet;
 * the role and the place in the list in the panel. A person has no draft: a saved person is on
 * «Menneskene bak».
 */
export function PersonEditor({ initial, slug, version }: { initial: Person; slug: string | null; version: string | null }) {
  const e = useEntry('menneskene', initial, slug, version);
  const { f, set, missing } = e;
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const bad = (k: string) => missing.has(k) || undefined;

  const sheet = (
    <article className={s.sheet}>
      <Cover image={f.photo} onImage={(v) => set('photo', v)} addPicture={e.addPicture} missing={missing.has('photo')} hint="Vises på Menneskene bak" portrait />
      <Line id="redaksjon-navn" label="Navn" look="headline" value={f.name} onChange={(v) => set('name', v)} placeholder="Navn" onEnter={() => bioRef.current?.focus()} />
      <Line
        id="redaksjon-bio" ref={bioRef} label="Kort biografi" look="text" value={f.bio} onChange={(v) => set('bio', v)}
        placeholder="Kort biografi (valgfritt): bakgrunn, og hva personen gjør i stiftelsen."
      />
    </article>
  );

  const panel = (
    <>
      <section>
        <h3>I stiftelsen</h3>
        <Field id="redaksjon-rolle" label="Rolle" hint="For eksempel styreleder eller styremedlem.">
          <input id="redaksjon-rolle" list="redaksjon-roller" value={f.role} onChange={(ev) => set('role', ev.target.value)} aria-invalid={bad('role')} />
          <datalist id="redaksjon-roller">{ROLES.map((r) => <option key={r} value={r} />)}</datalist>
        </Field>
        <Field id="redaksjon-rekkefolge" label="Rekkefølge" hint="Lavest tall står først på siden.">
          <input
            id="redaksjon-rekkefolge" type="number" inputMode="numeric" step={1} value={Number.isFinite(f.order) ? f.order : ''}
            onChange={(ev) => set('order', ev.target.value === '' ? Number.NaN : Number(ev.target.value))} aria-invalid={bad('order')}
          />
        </Field>
      </section>

      <Checklist items={[
        ['Navn', !missing.has('name')],
        ['Rolle', !missing.has('role')],
        ['Rekkefølge', !missing.has('order')],
        ...(f.photo ? [['Bilde med beskrivelse', !missing.has('photo')] as [string, boolean]] : []),
      ]} />

      <Preview heading="Slik vises det på Menneskene bak">
        {f.photo && <Picture src={f.photo.src} />}
        <h3>{f.name || 'Navn'}</h3>
        <p className={card.meta}>{f.role || 'Rolle'}</p>
        {f.bio && <p>{f.bio}</p>}
      </Preview>
    </>
  );

  return <Frame entry={e} sheet={sheet} panel={panel} panelLabel="Innstillinger for personen" />;
}
