'use client';

import { useState } from 'react';
import { isSlug, slugify, type Pic } from '@/lib/redaksjon/schema';
import card from '@/components/site/page.module.css';
import { site } from '@/content/site.no';
import { Icon } from './Icon';
import { Picture } from './Picture';
import s from './editor.module.css';

const MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
export const longDate = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${Number(iso.slice(8))}. ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : '';

type Props = {
  publish: boolean; onPublish: (v: boolean) => void;
  date: string; onDate: (v: string) => void;
  slug: string; onSlug: (v: string) => void;
  title: string; summary: string; image: Pic;
  problems: { key: string; text: string }[];
  /** Whether the post has a text, so the card links to a page of its own. */
  hasText: boolean;
  /** The address on the site when the post is there as it is now; otherwise null. */
  liveHref: string | null;
};

/** Beside the sheet: whether it shows, its date and address, what is missing, and its card. */
export function SidePanel(p: Props) {
  const [editingSlug, setEditingSlug] = useState(false);
  const [draftSlug, setDraftSlug] = useState(p.slug);
  const ok = (key: string) => !p.problems.some((x) => x.key === key);
  const items: [string, boolean][] = [
    ['Overskrift', ok('title')],
    ['Ingress', ok('summary')],
    ['Dato', ok('date')],
    ...(p.image ? ([['Bilde med beskrivelse', ok('image')]] as [string, boolean][]) : []),
    ...(!ok('body') ? ([['Bildebeskrivelse på bilde i teksten', false]] as [string, boolean][]) : []),
  ];

  return (
    <aside className={s.side} aria-label="Innstillinger for nyheten">
      <section>
        <h3>Publisering</h3>
        <label className={s.toggle}>
          <input type="checkbox" role="switch" checked={p.publish} onChange={(e) => p.onPublish(e.target.checked)} />
          <span className={s.sw} aria-hidden="true" />
          <div>
            <strong>Vis på nettsiden</strong>
            <span>{p.publish ? 'På: Nyheten kommer på nettsiden når du lagrer.' : 'Av: Nyheten lagres som utkast og vises ikke på nettsiden.'}</span>
          </div>
        </label>
      </section>

      <section>
        <div className={s.f}>
          <label htmlFor="redaksjon-dato">Dato</label>
          <input id="redaksjon-dato" type="date" value={p.date} onChange={(e) => p.onDate(e.target.value)} />
        </div>
        <div className={s.f}>
          <span id="redaksjon-adresse">Nettadresse</span>
          {editingSlug ? (
            <form className={s.url} onSubmit={(e) => { e.preventDefault(); const v = slugify(draftSlug); if (isSlug(v)) { p.onSlug(v); setEditingSlug(false); } }}>
              <input aria-labelledby="redaksjon-adresse" value={draftSlug} autoFocus onChange={(e) => setDraftSlug(e.target.value)} style={{ flex: 1, height: 34 }} />
              <button type="submit">OK</button>
            </form>
          ) : (
            <div className={s.url}>
              <Icon name="globe" /><b>/aktuelt/nyheter/{p.slug || '…'}</b>
              <button type="button" onClick={() => { setDraftSlug(p.slug); setEditingSlug(true); }}>Endre</button>
            </div>
          )}
          <span className={s.hint}>Lages automatisk fra overskriften. Du trenger ikke endre den.</span>
        </div>
      </section>

      <section className={s.ready}>
        <h3>Sjekkliste</h3>
        <ul>
          {items.map(([text, done]) => (
            <li key={text} className={done ? undefined : s.no}><Icon name={done ? 'check' : 'clock'} />{text}</li>
          ))}
          <li className={p.publish ? undefined : s.no}><Icon name={p.publish ? 'check' : 'clock'} />{p.publish ? 'Vises på nettsiden' : 'Slå på «Vis på nettsiden»'}</li>
        </ul>
      </section>

      <section>
        <div className={s.prevHead}>
          <h3>Slik vises den på Aktuelt</h3>
          {p.liveHref && <a href={p.liveHref} target="_blank" rel="noreferrer">Se hele saken</a>}
        </div>
        {/* The site's own card, with the site's own styles, so this is what Aktuelt shows. */}
        <ul className={`${card.list} ${s.card}`}>
          <li className={card.item}>
            <p className={card.meta}><time>{longDate(p.date)}</time></p>
            <h3>{p.hasText ? <a href={p.liveHref ?? undefined}>{p.title || 'Overskrift'}</a> : p.title || 'Overskrift'}</h3>
            {p.image && <Picture src={p.image.src} />}
            <p>{p.summary || 'Ingressen vises her.'}</p>
            {p.hasText && <p className={card.meta}><a href={p.liveHref ?? undefined}>{site.pages.news.readMore}</a></p>}
          </li>
        </ul>
      </section>
    </aside>
  );
}
