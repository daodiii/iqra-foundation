'use client';

import type { Nyhet } from '@/lib/redaksjon/schema';
import { Frame } from './Frame';
import { Sheet } from './Sheet';
import { SidePanel } from './SidePanel';
import { useEntry } from './useEntry';

/**
 * Writing a news post (mockup A): the sheet, the panel beside it, and «Lagre». Pictures chosen
 * since the last save ride along under `/opplastet/nyheter/<address>/`.
 */
export function NyhetEditor({ initial, slug, version }: { initial: Nyhet; slug: string | null; version: string | null }) {
  const e = useEntry('nyheter', initial, slug, version);
  const { f, set, saved } = e;
  const liveHref = saved && !e.dirty && saved.fields.publish ? `/aktuelt/nyheter/${saved.slug}` : null;

  return (
    <Frame
      entry={e} liveHref={liveHref} panelLabel="Innstillinger for nyheten"
      sheet={
        <Sheet
          title={f.title} onTitle={(v) => set('title', v)}
          summary={f.summary} onSummary={(v) => set('summary', v)}
          image={f.image} onImage={(v) => set('image', v)}
          body={initial.body} onBody={(v) => set('body', v)}
          addPicture={e.addPicture} missing={e.missing}
        />
      }
      panel={
        <SidePanel
          publish={f.publish} onPublish={(v) => set('publish', v)}
          date={f.date} onDate={(v) => set('date', v)}
          slug={e.slug} onSlug={e.setSlug}
          title={f.title} summary={f.summary} image={f.image}
          problems={e.issues} liveHref={liveHref} hasText={f.body.trim() !== ''}
        />
      }
    />
  );
}
