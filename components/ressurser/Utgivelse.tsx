import type { CSSProperties } from 'react';
import k from '@/components/forside/knapp.module.css';
import { site } from '@/content/site.no';
import type { Resource } from '@/lib/content';
import { writeDate } from '@/lib/dates';
import styles from './ressurser-plater.module.css';

const t = site.pages.resources;

/**
 * One resource on its category's plate: its date, its title (a link to the file or the page), the video
 * itself when it is one, its summary, and the way to it as an arrow link («Pilen» `ring`, drawn from
 * knapp.module.css on a plain link: a file or another site is no route for Next's Link). The colours
 * follow the plate's ground.
 */
export function Utgivelse({ r, style }: { r: Resource; style?: CSSProperties }) {
  const href = r.file ?? r.url;
  const go = r.file ? { href: r.file, label: t.download } : r.url ? { href: r.url, label: t.open } : null;
  return (
    <li className={styles.item} data-rise="" style={style}>
      <p className={styles.meta}>
        <time dateTime={r.date}>{writeDate(r.date)}</time>
      </p>
      <div className={styles.main}>
        <h3 className={styles.h3}>{href ? <a href={href}>{r.title}</a> : r.title}</h3>
        {r.video && <video className={styles.video} src={r.video} controls preload="metadata" playsInline />}
        <p className={styles.summary}>{r.summary}</p>
      </div>
      {go && (
        <a href={go.href} className={`${k.k} ${k.ring} ${styles.go}`} data-knapp="ring">
          <span className={k.label}>{go.label}</span>
          <span className={k.arrow} aria-hidden="true">
            <i>→</i>
            <i>→</i>
          </span>
        </a>
      )}
    </li>
  );
}
