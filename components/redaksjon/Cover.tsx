'use client';

import { useRef, useState } from 'react';
import type { Pic } from '@/lib/redaksjon/schema';
import { Icon } from './Icon';
import { Picture } from './Picture';
import s from './editor.module.css';

/**
 * The picture at the top of the sheet and its description: «Legg til bilde» when there is none,
 * «Bytt bilde» and remove when there is. A news post's or an event's picture is wide; a person's
 * photo is a portrait beside nothing, so it is shown as one.
 */
export function Cover({ image, onImage, addPicture, missing, hint, portrait = false }: {
  image: Pic;
  onImage: (p: Pic) => void;
  /** Shrinks a chosen picture and keeps it for the next save; gives back an address to show it by. */
  addPicture: (file: File) => Promise<string>;
  /** The description is needed and empty. */
  missing: boolean;
  /** The line under «Legg til bilde»: where the picture shows. */
  hint: string;
  portrait?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  const take = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setProblem('');
    try {
      const src = await addPicture(file);
      onImage({ src, alt: image?.alt ?? '' });
    } catch (e) {
      setProblem((e as Error).message || 'Kunne ikke bruke bildet.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ''; }} />
      {image ? (
        <>
          <div className={s.cover} data-portrait={portrait || undefined}>
            <Picture src={image.src} />
            <div className={s.coverTools}>
              <button type="button" className={s.btn} onClick={() => input.current?.click()}><Icon name="img" />Bytt bilde</button>
              <button type="button" className={s.btn} aria-label="Fjern bildet" title="Fjern bildet" onClick={() => onImage(null)}><Icon name="trash" /></button>
            </div>
            {busy && <div className={s.busy}>Klargjør bildet …</div>}
          </div>
          <div className={s.alt} data-missing={missing || undefined}>
            <label htmlFor="redaksjon-alt">Bildebeskrivelse</label>
            <input
              id="redaksjon-alt"
              value={image.alt}
              placeholder="Beskriv kort hva bildet viser. Teksten leses opp for blinde og svaksynte."
              onChange={(e) => onImage({ src: image.src, alt: e.target.value })}
              aria-invalid={missing || undefined}
            />
          </div>
        </>
      ) : (
        <button type="button" className={s.addCover} data-portrait={portrait || undefined} onClick={() => input.current?.click()} disabled={busy}>
          <Icon name="img" />
          {busy ? 'Klargjør bildet …' : 'Legg til bilde'}
          <small>{hint}</small>
        </button>
      )}
      {problem && <p className={`${s.hint} ${s.danger} ${s.coverProblem}`} role="alert">{problem}</p>}
    </>
  );
}
