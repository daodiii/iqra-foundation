import type { CSSProperties } from 'react';
import { RingPil } from '@/components/forside/Knapp';
import k from '@/components/forside/knapp.module.css';
import { copy } from '@/content/copy';
import type { Lang } from '@/content/paths';
import { RESOURCES_EN } from '@/content/resources.en';
import type { Resource } from '@/lib/content';
import { writeDate } from '@/lib/dates';
import styles from './ressurser-plater.module.css';

/**
 * One resource on its category's plate: its date, its title (a link to the file or the page), the video
 * itself when it is one, its summary, and the way to it as an arrow link («Pilen» `ring`, drawn from
 * knapp.module.css on a plain link: a file or another site is no route for Next's Link). The colours
 * follow the plate's ground.
 */
export function Utgivelse({ r, style, lang = 'no' }: { r: Resource; style?: CSSProperties; lang?: Lang }) {
  const { site } = copy(lang);
  const t = site.pages.resources;
  // on an English page: the English title and summary when there is one, else the Norwegian, marked
  const en = lang === 'en' ? RESOURCES_EN[r.slug] : undefined;
  const foreign = lang === 'en' && !en;
  const title = en?.title ?? r.title;
  const summary = en?.summary ?? r.summary;
  const href = r.file ?? r.url;
  const go = r.file ? { href: r.file, label: t.download } : r.url ? { href: r.url, label: t.open } : null;
  return (
    <li className={styles.item} data-rise="" style={style}>
      <p className={styles.meta}>
        <time dateTime={r.date}>{writeDate(r.date, lang)}</time>
        {foreign && <> · {site.language.inNorwegian}</>}
      </p>
      <div className={styles.main}>
        <h3 className={styles.h3} lang={foreign ? 'nb' : undefined}>{href ? <a href={href}>{title}</a> : title}</h3>
        {r.video && <video className={styles.video} src={r.video} controls preload="metadata" playsInline />}
        <p className={styles.summary} lang={foreign ? 'nb' : undefined}>{summary}</p>
      </div>
      {go && (
        <a href={go.href} className={`${k.k} ${k.ring} ${styles.go}`} data-knapp="ring">
          <span className={k.label}>{go.label}</span>
          <span className={k.arrow} aria-hidden="true">
            <RingPil />
          </span>
        </a>
      )}
    </li>
  );
}
